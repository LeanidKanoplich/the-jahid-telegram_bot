const axios = require('axios');
const {ChatPromptTemplate} = require("@langchain/core/prompts");
const pdfParse = require('pdf-parse');
const { ChatOpenAI } = require("@langchain/openai");
const dotenv = require('dotenv');
dotenv.config({path: './.env.local'});

const chatModel = new ChatOpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
    model: "gpt-4o",
    temperature: 0.7
  });

const pdfSummarization = async (fileUrl) => {

   
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      const pdfText = await pdfParse(response.data);

      const sys_template = "You are a assitant that summarize user docs text"
      const human_template = "${text}"

      const chatPrompt = ChatPromptTemplate.fromMessages([
        ["system", sys_template],
        ["human", human_template]
      ])

      const formattedChatPrompt = await chatPrompt.formatMessages({
         text:pdfText.text
      })

       const responsesummary = await chatModel.invoke(formattedChatPrompt);
       return responsesummary.content;
}

module.exports = {
    pdfSummarization
}
