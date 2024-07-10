
const {SpeechToText} = require('./speechtoText.js')
const {convertTextToSpeech} = require('./textToSpeech.js')
const {saveuserVoiceMessage} = require('./saveUservoiceMessage.js')

async function processVoiceMessage(bot, msg, chatId) {
          try {
            // Send a temporary processing message and capture its message ID
            const tempMessage = await bot.sendMessage(chatId, "Your request is processing...");
            const tempMessageId = tempMessage.message_id;

            const fileUrl = await bot.getFileLink(msg.voice.file_id);
            await saveuserVoiceMessage(fileUrl, './voice/file.mp3');
            console.log('User Voice message save complete.');

            const speechResultText = await SpeechToText('./voice/file.mp3');
            // Optionally, update the temporary message with the result
            await bot.editMessageText(speechResultText, { chat_id: chatId, message_id: tempMessageId });

            const speechFilePath = await convertTextToSpeech(speechResultText, './voiceresponse/file.mp3');
            // If you prefer to send a new message instead, comment out the above line and uncomment below
            await bot.sendVoice(chatId, speechFilePath);
            // To make the temporary message disappear, update it to a minimal text (Telegram API does not support direct deletion by bots)
            // await bot.editMessageText("✓", { chat_id: chatId, message_id: tempMessageId });

        } catch (error) {
            console.error('Error:', error);
            // Update or delete the temporary message in case of an error
            await bot.editMessageText("Got an error processing your request.", { chat_id: chatId, message_id: tempMessageId });
        }
  }
  
  // Usage example (assuming bot, msg, and chatId are defined elsewhere in your code)
module.exports = {
    processVoiceMessage
}


