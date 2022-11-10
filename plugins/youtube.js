const { google } = require('googleapis')
const drive = google.drive('v3')
const OAuth2Data = require('./google_key.json')

let authed = false
const CLIENT_ID = OAuth2Data.client.id
const CLIENT_SECRET = OAuth2Data.client.secret
const REDIRECT_URL = OAuth2Data.client.redirect

let oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'postmessage'
    //REDIRECT_URL[0]
)

function getTokens(req, callBack) {
    const code = req.body.code        
    if(code) {
        oauth2Client.getToken(code, (err, tokens) => {
            if(callBack)
                callBack(err, tokens)
        })
    }
}

function validateCode(req, callBack) {
    let validate = true
    const code = req.body.code
    let message = "Successfully authenticated"

    if(code) {
        oauth2Client.getToken(code, (err, tokens) => {
            if(err) {
                validate = false
                message = 'Error authenticating'
                //console.log(err)
            } else if(!authed) { 
                authed = true
                oauth2Client.setCredentials(tokens)
            }

            if(callBack)
                callBack(validate, message)
        })
    }
}

function filesHandler(err1, res1, callBack) {
    if (err1) return console.log('The API returned an error: ' + err1)
    const files = res1.data.files
    let filesNames = []

    if(files.length) {
        files.map((file) => {
            console.log(`${file.name} (${file.id})`)
            filesNames.push(`${file.name} (${file.id})`)
        })
        callBack(filesNames)
    } else {
        console.log('No files found.')
    }
}

function getFiles(res) {
    drive.files.list({
        auth: oauth2Client,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    },(err1, res1) => {
        filesHandler(err1, res1, (filesNames) => {
            res.json({"files" : filesNames})
        })
    })
}

function getState(res) {
    console.log(oauth2Client)
    if(res)
        res.json({"state" : authed})
}

module.exports = {
    getFiles,
    getState,
    getTokens,
    validateCode
}