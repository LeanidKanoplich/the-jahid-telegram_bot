const OpenAI = require("openai");
const { ChatOpenAI } = require("@langchain/openai");
const fs = require('fs');
const { HumanMessage} = require("@langchain/core/messages");

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
    model: "gpt-4o",
  });

  const chatModel = new ChatOpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
    model: "gpt-4o",
    temperature: 0.7
  });

const SpeechToText = async(filepath) => {
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filepath),
        model: "whisper-1",
      });

      // Process the transcription text to generate a response
      const data = await chatModel.invoke([new HumanMessage({ content: transcription.text })]);
      return data.content;
}

module.exports = {
    SpeechToText
}