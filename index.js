const { ChatOpenAI } = require("@langchain/openai");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const OpenAI = require("openai");
const { HumanMessage} = require("@langchain/core/messages");
const dotenv = require('dotenv');
dotenv.config({path: './.env.local'});
const http = require('http');
const {pdfSummarization} = require('./components/pdf.js')
// const {SpeechToText} = require('./components/speechtoText.js')
// const {convertTextToSpeech} = require('./components/textToSpeech.js')
// const {saveuserVoiceMessage} = require('./components/saveUservoiceMessage.js')
const {processVoiceMessage} = require('./components/processVoiceMessage.js')
const token = process.env.TELEGRAM_TOKEN

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
       await processVoiceMessage(bot, msg, chatId);
    } catch (error) {
        console.log('error', error)
    }

} else if (msg.text) {
 if(msg.text.startsWith('/ai_image_generate')) {
  const text = msg.text.replace('/ai_image_generate', '').trim();
  console.log('text', text);
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: text,
        n: 1,
        size: "1024x1024",
      });
      const image_url = response.data[0].url;
      await bot.sendMessage(chatId, image_url);
    } catch (error) {
      // Handle errors (e.g., BadRequestError due to safety system, etc.)
      bot.sendMessage(msg.chat.id, "An error occurred while generating the image. Please try again.");
    }


    
 } else {
  try {
    const tempMessage = await bot.sendMessage(chatId, "processing...");
    const tempMessageId = tempMessage.message_id;

    const data = await chatModel.invoke([new HumanMessage({ content: msg.text })]);
   await bot.editMessageText(data.content, { chat_id: chatId, message_id: tempMessageId });
   
  } catch (error) {
    console.error('Error occurred:', error);
    // Handle the error appropriately here, e.g., send a message to the user
    await bot.sendMessage(chatId, "Sorry, something went wrong.");
  }
 }

}  else if(msg.document) {
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

  

  bot.sendMessage(chatId, 'This is photo')
} else {
  
  bot.sendMessage(chatId, "This File Type is not supported in this bot")
}

});





const port = process.env.PORT || 3000; // Use the PORT environment variable provided by Render

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Telegram bot is running\n');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
