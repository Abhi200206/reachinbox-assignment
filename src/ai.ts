import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const apikey:string|any=process.env.aisec;
const genAI = new GoogleGenerativeAI(apikey);

function removeFormatting(input:string) {
    // Remove bullet points
    let strippedText = input.replace(/^\s*[\*\-]\s*/gm, '');
    // Remove bold formatting
    strippedText = strippedText.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove asterisks that are not part of bold formatting
    strippedText = strippedText.replace(/\*/g, '');
    
    return strippedText.trim();
}


export async function run(prompt:string) {

  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  let finaltext=await removeFormatting(text);
  return finaltext;
}