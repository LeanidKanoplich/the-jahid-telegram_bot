const axios = require('axios');
const fs = require('fs');

async function saveuserVoiceMessage(fileUrl, voiceFilePath) {
  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    
    fs.writeFileSync(voiceFilePath, response.data);
    
  } catch (error) {
    console.error('Error saving voice message:', error);
  }
}


module.exports = {
  saveuserVoiceMessage
}