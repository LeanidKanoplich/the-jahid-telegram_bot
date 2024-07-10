const { ChatOpenAI } = require("@langchain/openai");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const OpenAI = require("openai");

const AWS = require("aws-sdk");
const { HumanMessage} = require("@langchain/core/messages");
const dotenv = require('dotenv');
dotenv.config({path: './.env.local'});
const path = require("path");
const {pdfSummarization} = require('./components/pdf.js')

const token = process.env.TELEGRAM_TOKEN

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_APIKEY,
  model: "gpt-4o",
});

const chatModel = new ChatOpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
    model: "gpt-4o",
    temperature: 0.7
  });


const bot = new TelegramBot(token, { polling: true });

// ------------- this is all okay ------------------------------------

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

if (msg.voice) {
 
  try {
    // Get the file URL for the voice message
    const fileUrl = await bot.getFileLink(msg.voice.file_id);        
    // Download the voice message as an array buffer
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });
  
    // Save the voice message locally as an MP3 file
    const voiceFilePath = './voice/file.mp3';
    fs.writeFileSync(voiceFilePath, response.data);
  
    // Define the main asynchronous function for processing
    async function processVoiceMessage() {
      // Transcribe the voice message using OpenAI's Whisper model
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream('./voice/file.mp3'),
        model: "whisper-1",
      });

      console.log('text transcrbe', transcription.text)

  
      // Process the transcription text to generate a response
      const data = await chatModel.invoke([new HumanMessage({ content: transcription.text })]);
      // Send the generated text response back to the user
      await bot.sendMessage(chatId, data.content);
  
      // Generate a voice response using OpenAI's TTS model
      const speechFilePath = "./voiceresponse/file.mp3";
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: data.content,
      });
  
      // Convert the TTS response to a buffer and save as an MP3 file
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(speechFilePath, buffer);
      // Send the voice response back to the user
      await bot.sendVoice(chatId, speechFilePath);
    }
  
    // Call the main function to process the voice message
    processVoiceMessage();
  
  } catch (error) {
    // Log and notify the user of any errors during processing
    console.error('Error:', error);
    await bot.sendMessage(chatId, "Got an error processing your request.");
  }

} else if (msg.text) {
  try {
    const data = await chatModel.invoke([new HumanMessage({ content: msg.text })]);
    await bot.sendMessage(chatId, data.content);
  } catch (error) {
    console.error('Error occurred:', error);
    // Handle the error appropriately here, e.g., send a message to the user
    await bot.sendMessage(chatId, "Sorry, something went wrong.");
  }

} else if(msg.document) {

  // Check if the received document is a PDF
if( msg.document.mime_type === 'application/pdf'){
  try {
    // Retrieve file details from Telegram
    const fileDetails = await bot.getFile(msg.document.file_id);
    // Construct the URL to access the file
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileDetails.file_path}`;
    // Summarize the PDF content
    const pdftext = await pdfSummarization(fileUrl);
  
    // Send the summarized text back to the user
    await bot.sendMessage(msg.chat.id, pdftext); 
  } catch (error) {
    // Handle errors (e.g., summarization failure, sending message failure)
    await bot.sendMessage(msg.chat.id, 'Failed to process the PDF document.');
  }
} else if (msg.document && msg.document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
  // Handle DOCX files (currently in development)
  bot.sendMessage(chatId, 'The DOCX file processing is in development phase')
} 
else {
  // Log and inform the user for unsupported file types
  console.log('Unsupported file type received:', msg.document);
  bot.sendMessage(chatId, 'This File Type is not supported by this bot');
}
} else if(msg.photo){


  // const response = await openai.images.generate({
  //   model: "dall-e-3",
  //   prompt: "a white siamese cat",
  //   n: 1,
  //   size: "1024x1024",
  // });
  // const image_url = response.data[0].url;

  // console.log('image url', image_url);

  const response = await openai.images.edit({
    model: "dall-e-2",
    image: fs.createReadStream("./Image/Screenshot(407).png"),
    prompt: "explain this image",
    n: 1,
    size: "1024x1024"
  });
  const image_url = response

  console.log('image_url', image_url);

  bot.sendMessage(chatId, 'This is photo')
} else {
  
  bot.sendMessage(chatId, "This File Type is not supported in this bot")
}

});
