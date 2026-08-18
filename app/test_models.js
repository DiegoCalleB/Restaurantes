import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.log("No api key");
  process.exit(1);
}

// @google/genai version 2.16.0 usage might be wrong.
// Wait, is it GoogleGenAI or something else?
console.log("Initializing...");
const ai = new GoogleGenAI({ apiKey });
console.log("Instantiated");

async function run() {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello'
     });
     console.log('gemini-2.5-flash works');
  } catch (e) {
     console.log('2.5 failed:', e.message);
  }

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'hello'
     });
     console.log('1.5-flash works');
  } catch (e) {
     console.log('1.5 failed:', e.message);
  }
}
run();
