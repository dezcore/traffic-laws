const { google } = require('googleapis')
const drive = google.drive('v3')
const OAuth2Data = require('./google_key.json')
const fileService = require('./../services/file')
const driveProps = require('./../properties/drive')

let authed = false
const CLIENT_ID = OAuth2Data.client.id
const CLIENT_SECRET = OAuth2Data.client.secret
//const REDIRECT_URL = OAuth2Data.client.redirect

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

function setTokens(tokens, callBack) {
    if(tokens) {
        oauth2Client.setCredentials(tokens)
        callBack()
    }
}

function search(filter, callBack) {
    drive.files.list({
        auth: oauth2Client,
        q: filter,
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
        }, (err1, res) => {
            callBack(err1, res)
    })
}

function createFile(fileName, media, folderId, callBack) {
    if(fileName) {
        fileService.getFileContent("../files", fileName, (stream) => {

            if(stream) {
                drive.files.create({
                    auth: oauth2Client,
                    resource:  {
                        name: fileName,
                        parents : [folderId] 
                    },
                    media : {
                        mimeType : driveProps.MEDIA_MIMETYPES[media],
                        body : stream
                    },
                    fields: 'id',
                    }, callBack)
            }
        })
    }
}

function createFolder(folderName, callBack) {
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    }
    
    if(fileMetadata) {
        drive.files.create({
            auth: oauth2Client,
            resource: fileMetadata,
            fields: 'id',
            }, callBack)
    }
}

function deleteFile(fileId, callBack) {
    if(fileId) {
        drive.files.delete({
            auth: oauth2Client,
            fileId : fileId,
            }, callBack)
    }
}

function uploadFile(fileName, media, callBack) {
    if(fileName && media) {
        fileService.getFileContent("../files", fileName, (stream) => {
            if(stream) {
                drive.files.create({
                    auth: oauth2Client,
                    resource:  {
                        name: fileName,
                        parents : [folderId],
                        mimeType: driveProps.RESOURCES_MIMETYPES['mimeType'],
                    },
                    media : {
                        mimeType: driveProps.MEDIA_MIMETYPES[ 'csv'],
                        body: stream,
                    },
                    fields: 'id',
                    }, callBack)
            }
        })
    }
}

function getFileParents(fileId, callBack) {
    drive.files.get({
        auth: oauth2Client,
        fileId: fileId,
        fields: 'parents',
    }, (err1, file) => {
        if(err1){
            callBack(err1)
        } else {
            const previousParents = file.data.parents
            .map(function(parent) {
                return parent.id
            })
            .join(',')

            callBack(err1, previousParents)
        }
    })
}

function moveFile(folderId, fileId, callBack) {
    if(folderId && fileId) {
        getFileParents(fileId, (err1, previousParents) => {
            if(err1){
                callBack(err1)
            } else {

                drive.files.update({
                    auth: oauth2Client,
                    fileId: fileId,
                    addParents: folderId,
                    removeParents: previousParents,
                    fields: 'id, parents',
                    }, callBack)   //console.log(files.status);
            }
        })
    }
}

function getState(res) {
    if(res)
        res.json({"state" : authed})
}

module.exports = {
    search,
    moveFile,
    getState,
    getTokens,
    setTokens,
    uploadFile,
    createFile,
    deleteFile,
    createFolder
}