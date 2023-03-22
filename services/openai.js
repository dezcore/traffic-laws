const { Configuration, OpenAIApi } = require("openai")

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function checkApiKey(callBack) {
  if(!configuration.apiKey && callBack) {
    callBack({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    })
  } else if(callBack) {
    callBack()
  }
}

function errorTreatment(error, callBack) {
  if(error.response && callBack) {
    callBack(error.response.status, error.response.data)
  } else {
    console.error(`Error with OpenAI API request: ${error.message}`);
    callBack(500, {
      error: {
        message: 'An error occurred during your request.',
      }
    })
  }
}

async function getAiResponse(res, prompt) {
  let completion

  if(prompt) {
    completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.6,
    })
    //console.log("data : ", completion.data)
    res.status(200).json({ data : completion.data.choices[0].text })
  } else {
    res.status(500).json({message : 'prompt undefined'})  
  }
}

function testChatGpt(req, res) {
  try {
    const prompt = req.query.prompt

    checkApiKey((err)=>{
      if(err) {
        res.status(500).json(err)  
      } else {
        getAiResponse(res, prompt)
      }
    })   
  } catch(error) {
    errorTreatment(error, (status, data) => {
      res.status(status).json(data)
    })
  }
}

module.exports = {
  testChatGpt
}