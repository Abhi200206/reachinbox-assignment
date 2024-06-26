import { narr,rep } from "./index";
export enum hello{
"Interested"="I am intrested and lets hop on for a chat.",
"Not Interested"="sorry, i am not Intrested",
"More information"="I need more information please "
}

 function addrep()
{
        setInterval(async ()=>{
            for(let i=0;i<narr.length;i++)
                {
                    await rep(narr[i]);
                }
        },15000);
}
console.log("hello started");
addrep();