const fs = require('fs'),
  path = require("path"),
  ytdl = require('ytdl-core'),
  ffmpeg = require('fluent-ffmpeg'),
  md5 = require('md5'),
  os = require("os");

let cache = {}
const GrowingFile = require('growing-file')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const dataPath = path.join(os.tmpdir(), "data");

const FILE_OPTIONS = {
  timeout: 10000,
  interval: 100,
  startFromEnd: false,
}

ffmpeg.setFfmpegPath(ffmpegPath)

function createDir(dirPath) {
  if(dirPath && !fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function rmDir(dirPath) {
  if(dirPath) {
    setTimeout(() => {
      fs.rmSync(dirPath, { recursive: true });
    }, 180 * 1000);
  }
}

function rmFile(filePath, callBack, otherFiles) {
  let files, file
  if(filePath) {
    fs.unlink(filePath, (err) => {
      if(otherFiles && 0 < otherFiles.length) {
        files = Object.assign([], otherFiles)
        file = files.pop()
        rmFile(file, callBack, files)
      } else if(callBack) {
        callBack(err)
      }
    })
  } else if(callBack) {
    callBack()
  }
}

function existFile(path) {
  let exist = false
  if(path) {
    try {
      exist = fs.existsSync(path)
    } catch(err) {
      console.error(err)
    }
  }
  return exist
}

function getSessionId(req) {
  let tokens
  let sessionId = null

  try {
    tokens = JSON.parse(req.headers. tokens)
    sessionId = tokens.sessionID
  } catch(e) {
    console.log("exception : ", e)
  }

  return sessionId
}

function initCache(sessionID, videoId) {
  let target

  if(sessionID) {
    if(cache[sessionID] === undefined) {
      cache[sessionID] = []
    } else {
      target = cache[sessionID].find(video => video.id === videoId)
    }

    if(target === undefined) {
      cache[sessionID].push({
        id : videoId,
        merge_progress : 0,
        audio_progress : 0,
        video_progress : 0,
        conversion_progress : 0
      })
    }
  }
}

function setAudioProgress(sessionID, videoId, progress) {
  let target

  if(cache[sessionID] === undefined) {
    initCache(sessionID, videoId)
  }

  target = cache[sessionID].find(video => video.id === videoId)

  if(target && progress) {
    target.audio_progress = progress
  }
}

function setVideoProgress(sessionID, videoId, progress) {
  let target

  if(cache[sessionID] === undefined) {
    initCache(sessionID, videoId)
  }

  target = cache[sessionID].find(video => video.id === videoId)

  if(target && progress) {
    target.video_progress = progress
  }
}

function setMerge(req, progress) {
  const sessionID = getSessionId(req)
  const videoId = req.query.videoId
  const target = cache[sessionID].find(video => video.id === videoId)

  if(target) {
    target.merge_progress = progress
  } 
}

function setConversionProgress(sessionID, videoId, progress) {
  const target = cache[sessionID].find(video => video.id === videoId)

  if(target) {
    target.conversion_progress = progress
  } 
}

function streamCutRes(res, filePath, deleteFile, otherFiles) {
  let stream
  if(res && filePath) {
    const file = GrowingFile.open(filePath, FILE_OPTIONS)
    file.on('error', (err) => {
      console.log("error (streamCutRes) : ", err)
      res.end()
      file.destroy()
    })

    stream = file.pipe(res)

    stream.on('finish', () => {
      console.log("Finished to stream : ", filePath)
      if(deleteFile)
        rmFile(filePath, null, otherFiles)
    })
  }
}

function getFilePath(videoId, dir, format, callBack) {
  const id = Date.now().toString(36)
  const cacheDir =  path.resolve(dataPath, `/cache` + dir)
  const filePath = path.resolve(dataPath, `/cache`+ dir + `${md5(videoId)}.` + format)
  const outputPath = path.resolve(dataPath,  `/cache`+ dir + `${md5(id)}_out.` + format)

  createDir(cacheDir)

  if(callBack)
    callBack(filePath, outputPath)
}

function createStream(filePath, callBack) {
  let writeStream

  if(filePath) {
    writeStream = fs.createWriteStream(filePath)

    writeStream.on('error', (err) => {
      console.log("error (createStream) : ", err)
      // audio.destroy()
    })

    if(callBack)
      callBack(writeStream)
  }
}

function merge(video, audio, req, res) {
  let progress
  const id = Date.now().toString(36)
  const start = Number(req.query.start)
  const end = Number(req.query.end)
  
  if(video && audio) {
    getFilePath(id,'/merge/', 'mp3', (outputPath) => {
      ffmpeg()
      .addInput(video)
      .addInput(audio)
      .addOptions(['-map 0:v', '-map 1:a', '-c:v copy'])
      .format('mp4')
      .on('progress', function({timemark}) {
        progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
        setMerge(req, progress)
      })
      .on('error', (error, stdout, stderr) => {
        console.log("stderr : ", stderr)
        console.log("merge (error) : ", error)
      })
      .on('end',() => { 
        console.log('Finished to merge !',)  
        streamCutRes(res, outputPath, true, [video, audio]) 
      })
      .saveToFile(outputPath)
    })
  }
}

function hmsToSeconds(hms) {
  let a = hms.split(':'); // split it at the colons
  let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])
  return seconds
}

function cutAudio(sessionID, videoId, audio, start, end, callBack) {
  let progress
  const id = Date.now().toString(36)

  if(audio) {
    getFilePath(id, '/cuts/mp3/', 'mp3', (outputPath) => {
      createStream(outputPath, (writeStream) => {
        ffmpeg(audio)
          .seekInput(start)
          .audioBitrate(128)
          .duration(end - start)
          .format('mp3')
          .once('start', () => console.log("start to cut audio"))
          .on('progress', function({timemark}) {
            progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
            setAudioProgress(sessionID, videoId, progress) 
          })
          .on('error', (err) => {
            console.log("error to cut audio", err)
            writeStream.destroy();
          })
          .once('end', () => {
            console.log("Cut Audio done !")
            if(callBack)
              callBack(outputPath, writeStream)
          })
          .pipe(writeStream);
      })
    })
  }
}

function saveAudio(sessionID, videoId, audio, callBack) {
  //let progress

  if(videoId && audio) {
    getFilePath(videoId,'/full/mp3/', 'mp3', (filePath) => {
      createStream(filePath, (writeStream) => {
        ffmpeg(audio)
          .audioBitrate(128)
          .format('mp3')
          .once('start', () => console.log("Start to save Audio"))
          /*.on('progress', function({timemark}) {
            progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
            setAudioProgress(sessionID, videoId, progress) 
          })*/
          .on('error', (err) => {
            console.log("error to save audio : ", err)
            writeStream.destroy();
          })
          .once('end', () => {
            console.log("Save Audio done !")
            if(callBack)
              callBack(filePath, writeStream)
          })
          .pipe(writeStream)
      })
    })
  }
}

function downloadAudio(sessionID, videoId, start, end, callBack) {
  let audio

  if(sessionID && videoId) {
    console.log("videoId : ", videoId)
    audio = ytdl(videoId, { quality: 'highestaudio' })
        audio.on('error', (err) => {
          console.log("error (videoToMp3) : ", err)
        })
        audio.once('progress', () => {
          saveAudio(sessionID, videoId, audio, (filePath) => {
            cutAudio(sessionID, videoId, filePath, start, end, callBack)
          })
    })
  }
}

function getAudio(req, res, callBack) {
  const videoId = req.query.videoId
  const start = Number(req.query.start)
  const end = Number(req.query.end)
  const sessionID = getSessionId(req)

  if(req && res) {
    getFilePath(videoId,'/full/mp3/', 'mp3', (filePath) => {
      if(existFile(filePath)) {
        console.log("Audio Exist : ", filePath)
        cutAudio(sessionID, videoId, filePath, start, end, callBack)
      } else {
        console.log("Audio No Exist : ", filePath)
        downloadAudio(sessionID, videoId, start, end, callBack) 
      }
    })
  }
}

function cutVideo(sessionID, videoId, video, start, end, callBack) {
  let progress
  const id = Date.now().toString(36)

  if(video) {
    getFilePath(id, '/cuts/mp4/', 'mp4', (outputPath) => {
      ffmpeg(video)
      .setStartTime(start)
      .setDuration(end-start)
      .output(outputPath)
      .on('progress', function({timemark}) {
        progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
        setVideoProgress(sessionID, videoId, progress)
      })
      .once('start', () => console.log("start to cut video"))
      .on('end', function(err) {
        console.log('Finished to cut video') 
        if(!err && callBack) { 
          callBack(outputPath)
        }
      })
      .on('error', err => console.log('error (convertToMp4) : ', err))
      .run()
    })
  }
}

function downloadVideo(sessionID, videoId, url, filePath, start, end, callBack) {
  let progress

  if(url && filePath) {
    createStream(filePath, (writeStream) => {
      ytdl(url, { quality: 'highestvideo' })
      .on('progress', (length, downloaded, totalLength) => {
        progress = (downloaded/totalLength) * 100
        setConversionProgress(sessionID, videoId, progress)

        if(progress === 100)
          cutVideo(sessionID, videoId, filePath, start, end, callBack)

      }).pipe(writeStream)
    })
  }
}

function getVideo(req, res, callBack) {
  const url = req.query.yUrl
  const videoId = req.query.videoId
  const start = Number(req.query.start)
  const end = Number(req.query.end)
  const sessionID = getSessionId(req)
  
  if(req && res) {
    getFilePath(videoId, '/full/mp4/', 'mp4', (filePath) => {
      if(existFile(filePath)) {
        console.log("Video Exist : ", filePath)
        cutVideo(sessionID, videoId, filePath, start, end, callBack)
      } else {
        console.log("Video No Exist : ", filePath)
        downloadVideo(sessionID, videoId, url, filePath, start, end, callBack)
      }
    })
  }
}

function download(req, res) {
  const url = req.query.yUrl
  const start = req.query.start
  const end = req.query.end
  const format = req.query.format

  if(url) {
    if(start && end && format === 'mp3') {
      getAudio(req, res, (audio) => {
        if(audio)
          streamCutRes(res, audio, true)
      })
    } else if(start && end && format === 'mp4') {
      getAudio(req, res, (audio) => {
        getVideo(req, res, (video) => {
          merge(video, audio, req, res)
        })
      })
    } else {
      res.header('Content-Disposition', 'attachment', filename="video.mp4")
      ytdl(url, {format : 'mp4'}).pipe(res)
    }
  }
}

function progress(req, res) {
  let target, download
  const format = req.query.format
  const videoId = req.query.videoId
  const sessionID = getSessionId(req)

  if(cache[sessionID])
    target = cache[sessionID].find(video => video.id === videoId)

  if(target === undefined){
    initCache(sessionID, videoId)
    target = cache[sessionID].find(video => video.id === videoId)
  }

  download = (format === 'mp3' ? target.audio_progress : 
    Math.floor((target.merge_progress * 25) / 100) + 
    Math.floor((target.audio_progress * 25) / 100) +
    Math.floor((target.video_progress * 25) / 100) + 
    Math.floor((target.conversion_progress * 25) / 100)
  )

  res.json({id : videoId, download : download})
}

module.exports = {
  download,
  progress
}