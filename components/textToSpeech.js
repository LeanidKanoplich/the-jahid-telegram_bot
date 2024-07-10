const fs = require('fs').promises; // If not already imported
const OpenAI = require("openai");


const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
    model: "gpt-4o",
  });
  
async function convertTextToSpeech(SpeechResulttext, speechFilePath) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: SpeechResulttext,
  });

  // Convert the TTS response to a buffer
  const buffer = Buffer.from(await mp3.arrayBuffer());

  // Save as an MP3 file
  await fs.writeFile(speechFilePath, buffer);
  
  return speechFilePath; // Optionally return the path or any other relevant information
}

module.exports = { convertTextToSpeech };
