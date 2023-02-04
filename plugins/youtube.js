const { google } = require('googleapis')
const drive = google.drive('v3')
const fileService = require('./../services/file')
const driveProps = require('./../properties/drive')

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

function getFileStream(fileName, callBack) {
    if(fileName) {
        fileService.getFileContent("../files", fileName, (error, stream) => {
            callBack(error, stream)
        })
    }
}

function flushStream(fileName, media, folderId, stream, callBack) {
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
            console.log("err : ", err)
            console.log("after flushStream : ", res)
            fileService.deleteFile("../files/", fileName)
            /*if(err) {
                callBack(err, null)
            } else {
                shareFile(res.data.id, callBack)
            }*/
        }
    )
    fileService.deleteFile("../files/", fileName)
}

function createFile(req, callBack) {
    const media = req.body.media
    const fileName = req.body.fileName
    const folderId = req.body.folderId
    const content = JSON.stringify(req.body.data)

    //exist(fileName, (err1, res1) => {
    //updateFile(res1, req, fileName, callBack)
    //uploadFile(res, req, fileName, folderId)

    if(fileName) {
        fileService.writeFile("../files/", fileName, content, (err) => {
            if(err){
                callBack(err, null)
            } else {
                getFileStream(fileName, function (error, stream) {
                    if(error) callBack(error, null)
                    else flushStream(fileName, media, folderId, stream, callBack)
                })   
            }
        })
    }
}

function updateFile(fileName, media, fileId, callBack) {
    if(fileName) {
        fileService.getFileContent("../files", fileName, (error, stream) => {
            if(error) {
                callBack(error, null)
            } else if(stream) {     
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
    uploadFile,
    createFile,
    deleteFile,
    exportFile,
    updateFile,
    revokeToken,
    createFolder,
    downloadFile,
    refreshToken,
}