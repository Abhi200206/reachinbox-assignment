import express from 'express';
import { Worker } from 'bullmq';
import { google } from 'googleapis';
import session from 'express-session';
import { run } from './ai';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { hello } from './queue';
import dotenv from "dotenv";
dotenv.config();
export let narr:any[]=[];
const redisClient = new Redis({
  host: 'localhost', 
  port: 6379, 
  maxRetriesPerRequest: null, 
});
const OAuth2 = google.auth.OAuth2;
const app = express();
const oauth2Client = new OAuth2(
  process.env.id,
  process.env.secret,
  'http://localhost:3000/auth/google/callback'
);

app.use(express.json());
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));

const myQueue = new Queue('reachinbox', { connection:redisClient});
async function addJobs(id:string,Oauthclient:any) {
  console.log("oauth token: ",Oauthclient);
  await myQueue.add(id, { Oauthclient ,id});
  console.log("completed");
}
const worker = new Worker('reachinbox', async job => {
  try{
    console.log("started and waiting");
    await getlabel(job.data.Oauthclient,job.data.id);
    console.log("from queue completed ");
  }
  catch(err)
  {
    console.error(err);
  }
}, { connection:redisClient});

worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
  });
  
  worker.on('failed', (job, err) => {
    console.log(`${job} has failed with ${err.message}`);
  });



app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'profile',
      'email'
    ],
  });
  res.redirect(authUrl);
});
const gmail = google.gmail({ version: 'v1' });
app.get('/auth/google/callback', async (req:any, res) => {
  const { tokens } = await oauth2Client.getToken(req.query.code as string);
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens; 

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  const userInfo = await oauth2.userinfo.get();
  console.log('User profile:', userInfo.data);

  res.redirect('/check-emails');
});

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

async function markEmailAsRead(auth: any, messageId: string) {
  try {
    const modifyRequestBody = {
      removeLabelIds: ['UNREAD'],
    };

    await gmail.users.messages.modify({
      auth: auth,
      userId: 'me',
      id: messageId,
      requestBody: modifyRequestBody,
    });

    console.log(`Email ${messageId} marked as read.`);
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}


async function sendEmail(auth: any,senderEmail: string, subject: string, message: string) {
  try {
    const from = 'me';
    const to = senderEmail;
    const raw = makeEmail(from, to, subject, message);

    await gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      requestBody: {
        raw: Buffer.from(raw).toString('base64'),
      },
    });

    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
function makeEmail(from: string, to: string, subject: string, message: string) {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    `Subject: ${subject}`,
    '',
    `${message}`,
  ];

  return emailLines.join('\n');
}

async function listTodaysUnreadEmails(auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  const todayDate = getTodayDate();
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `is:unread after:${todayDate}`,
  });
  return res.data.messages || [];
}
async function getmailonly(auth:any,id:string)
{
    const gmail = google.gmail({ version: 'v1', auth });
    const result=await gmail.users.messages.get({
        userId:'me',
        id:id
    });
    const headers = result.data.payload?.headers;
  const fromHeader = headers?.find(header => header.name === 'From');

  let fromEmail:string = '';
  if (fromHeader) {
    const fromValue = fromHeader.value;
    const match = fromValue?.match(/^(.*)<(.*)>$/);
    if (match) {
      fromEmail = match[2].trim();
    } else {
      fromEmail = fromValue || '';
    }
  }
    return [result.data,fromEmail];
}
export async function getlabel(oauthClient:any,id:string){
      try {
        oauth2Client.setCredentials(oauthClient);
        const [messages,toEmail] :any[]= await getmailonly(oauth2Client,id);
        await markEmailAsRead(oauth2Client,id);
        console.log("Today's unread emails: ", messages);
        const promt:string=`Categorizing the email based on the content and assign a label as follows -Interested,Not Interested,More information, on email ${JSON.stringify(messages)}`;
        let result=await run(promt);
        console.log(result ," from id : ",id);
        if(result=="Interested")
          {
            await sendEmail(oauth2Client,toEmail ,"hello there", hello.Interested);
          }
          else if(result== "Not Interested")
            {
             await  sendEmail(oauth2Client,toEmail ,"hello there", hello['Not Interested']);
            }
            else{
              await  sendEmail(oauth2Client,toEmail ,"hello there", hello['More information']);
            }
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
};
async function add(messages: any[],Oauthclient:any)
{
  console.log("inside");
    for(let i=0;i<messages.length;i++)
      {
          await addJobs(messages[i].id,Oauthclient);
      }

}
export async function rep(oauth:any)
{
  oauth2Client.setCredentials(oauth);
  try {
    const messages = await listTodaysUnreadEmails(oauth2Client);
    console.log("Today's unread emails: ", messages);
     await add(messages,oauth);

  } catch (error) {
    console.error('Error fetching emails:', error);
  }
}
app.get('/check-emails', async (req:any, res) => {
  if (!req.session.tokens) {
    return res.redirect('/auth/google');
  }
  
  oauth2Client.setCredentials(req.session.tokens);

  try {
    const messages = await listTodaysUnreadEmails(oauth2Client);
    console.log("Today's unread emails: ", messages);
     await add(messages,req.session.tokens);
     narr.push(req.session.tokens);
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send('Error fetching emails.');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
