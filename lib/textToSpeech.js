const AWS = require("aws-sdk");

const textToSpeechjs = (language, userText) => {
    return new Promise((resolve, reject) => {
        console.log(language, userText)
        const polly = new AWS.Polly({ region: "ap-south-1" });
        
        let params = {
            OutputFormat: "mp3",
            Text: userText,
        }
        
        if (language === 'ar') {
            params.VoiceId = "Hala";
            params.Engine = "neural";
        } else if (language === 'en-US') {
            params.VoiceId = "Matthew";
        }

        polly.synthesizeSpeech(params, (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                let audioStream = data.AudioStream;
                resolve(audioStream);
            }
        })
    });
}

module.exports = {
    textToSpeechjs
}
