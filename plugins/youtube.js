const { google } = require('googleapis')
const drive = google.drive('v3')
const fileService = require('./../services/file')
const driveProps = require('./../properties/drive')

let Readable = require('stream').Readable

let authed = false

let oauth2Client = new google.auth.OAuth2(
    process.env.DRIVE_CLIENT_ID,
    process.env.DRIVE_CLIENT_SECRET,
    'postmessage'
)

function refreshToken(code, callBack) {
    if(code) {
        google.auth.fromJSON(code, (err, tokens) => {
            if(callBack)
                callBack(err, tokens)
        })
    }
}

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

function revokeToken(refresh_token, callBack) {
    if(refresh_token) {
        oauth2Client.revokeToken(refresh_token, function(err, body){
            if(callBack)
                callBack(body)
        })
    }
}

function search(filter, callBack) {
    drive.files.list({
        auth: oauth2Client,
        q: filter,
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
        }, function (err1, res) {
            callBack(err1, res)
    })
}

function exist(name, callBack) {
    let files
    let exist = false

    if(name) {
        search('name = \'' + name + '\'', (err, res) => {
            exist = res && res.data ? res.data.files.length > 0 : false
            files = res && res.data ? res.data.files : []
            callBack(err, exist, files)
        })
    }
}

function exportFile(fileId, callBack) {
    if(fileId) {
        drive.files.export({
            auth: oauth2Client,
            fileId: fileId,
            mimeType: 'text/plain',
            }, callBack)
    }
}

function downloadFile(fileId, callBack) {
    if(fileId) {
        drive.files.get({
            auth: oauth2Client,
            fileId: fileId,
            alt: 'media',
            }, callBack)
    }
}

function shareFile(fileId, callBack) {
    if(fileId) {
        drive.permissions.create({
            auth: oauth2Client,
            resource: {
                type: 'anyone',
                role: 'reader',
                //domain: 'global'
            },
            fileId: fileId,
            fields: 'id',
        }, function(err, res) {
            callBack(err, res)
        })
    }
}

function getStream(content, callBack) {
    let stream

    if(content) {
        stream = new Readable()
        stream.push(content)    // the string you want
        stream.push(null)      // indicates end-of-file basically - the end of the stream
        
        if(callBack)
            callBack(stream)
    }
}

function flushStream(fileName, media, req, content, callBack) {
    const folderId = req.body.folderId

    if(folderId) {
        getStream(content, (stream) => {
            drive.files.create({
                auth: oauth2Client,
                resource:  {
                    name: fileName,
                    parents : [folderId],
                },
                media : {
                    mimeType : driveProps.MEDIA_MIMETYPES[media],
                    body : stream
                },
                fields: 'id',
                },
                function (err, res) {
                    if(err) {
                        callBack(err, null)
                    } else {
                        shareFile(res.data.id, callBack)
                    }
                }
            )
        })
    }
}

function updateFile(fileId, media, content, callBack) {
    if(fileId) {
        getStream(content, (stream) => {
            drive.files.update({
                auth: oauth2Client,
                fileId : fileId,
                media : {
                    mimeType : driveProps.MEDIA_MIMETYPES[media],
                    body : stream
                },
                fields: 'id'
                },
                function (err, res) {
                    callBack(err, res)
                }
            )
        })
    }
}

function createFile(req, callBack) {
    const media = req.body.media
    const fileName = req.body.fileName
    const content = JSON.stringify(req.body.data)

    if(fileName) {
        exist(fileName, (err, exist, files) => {
            if(err)
                callBack(err)
            else if(!exist)
                flushStream(fileName, media, req, content, callBack)
            else if(exist && files[0] && files[0].id)
                updateFile(files[0].id, media, content, callBack)
        })
    }
}

function createFolder(folderName, callBack) {
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    }

    if(fileMetadata) {
        exist(folderName, (err, exist, files) => {
            if(err) {
                callBack(err)
            } else if(!exist) {
                drive.files.create({
                    auth: oauth2Client,
                    resource: fileMetadata,
                    fields: 'id',
                    }, callBack)
            }  if(exist && files[0] && files[0].id) {
                callBack(null,  files[0].id)
            }
        })
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

function deleteFolder(name, callBack) {
    if(name) {
        exist(name, (err, exist, files) => {
            if(exist && files[0] && files[0].id)
            deleteFile(files[0].id, callBack)
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
                    }, callBack) 
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
    shareFile,
    createFile,
    deleteFile,
    exportFile,
    updateFile,
    revokeToken,
    deleteFolder,
    createFolder,
    downloadFile,
    refreshToken,
}