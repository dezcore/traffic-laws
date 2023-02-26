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

function rmFile(filePath, callBack) {
  if(filePath) {
    fs.unlink(filePath, (err) => {
      if(callBack)
          callBack(err)
    })
  }
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

function initCache(req) {
  let target
  const sessionID = getSessionId(req)
  const videoId = req.query.videoId

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

function setAudioProgress(req, progress) {
  let target
  const sessionID = getSessionId(req)
  const videoId = req.query.videoId

  if(cache[sessionID] === undefined) {
    initCache(req)
  }

  target = cache[sessionID].find(video => video.id === videoId)

  if(target && progress) {
    target.audio_progress = progress
  }
}

function setVideoProgress(req, progress) {
  let target
  const sessionID = getSessionId(req)
  const videoId = req.query.videoId

  if(cache[sessionID] === undefined) {
    initCache(req)
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

function setConversionProgress(req, progress) {
  const sessionID = getSessionId(req)
  const videoId = req.query.videoId
  const target = cache[sessionID].find(video => video.id === videoId)

  if(target) {
    target.conversion_progress = progress
  } 
}

function streamCutRes(res, filePath) {
  if(res && filePath) {
    const file = GrowingFile.open(filePath, FILE_OPTIONS);

    file.on('error', (err) => {
      console.log("error (streamCutRes) : ", err)
      res.end();
      file.destroy();
    });
    file.pipe(res)
  }
}

function getFilePath(videoId, dir, format, callBack) {
  //const sessionID = generateSessionID(32); -> return sessionID
  //path.resolve(dataPath, `../cache` + dir)
  const cacheDir =  path.resolve(process.cwd(), `/cache` + dir) //path.join(process.cwd(), 'posts')
  const filePath = path.resolve(process.cwd(), `/cache`+ dir + `${md5(videoId)}.` + format)
  const outputPath = path.resolve(process.cwd(),  `/cache`+ dir + `${md5(videoId)}_out.` + format)

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
  const start = Number(req.query.start)
  const end = Number(req.query.end)
  const mergeDir =  path.resolve(process.cwd(), `/cache/merge/`)
  const outputPath = path.resolve(process.cwd(), `/cache/merge/merged.mp4`)

  createDir(mergeDir)
  if(video && audio) {
    ffmpeg()
    .addInput(video)
    .addInput(audio)
    .addOptions(['-map 0:v', '-map 1:a', '-c:v copy'])
    .format('mp4')
    .on('progress', function({timemark}) {
      progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
      setMerge(req, progress)
    })
    .on('error', error => console.log(error))
    .on('end',() => { 
      console.log(' finished (merge) !')  
      streamCutRes(res, outputPath) 
    })
    .saveToFile(outputPath)
  }
}

function hmsToSeconds(hms) {
  let a = hms.split(':'); // split it at the colons
  let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])
  return seconds
}

function convertToMp3(audio, writeStream, filePath, req, res, callBack) {
  let progress
  const start = req.query.start
  const end = req.query.end

  if(audio) {
    ffmpeg(audio)
        .audioBitrate(128)
        .seekInput(start)
        .duration(end - start)
        .format('mp3')
        .once('start', () => console.log("start"))
        .on('progress', function({timemark}) {
          progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
          setAudioProgress(req, progress) 
        })
        .on('error (convertToMp3) ', (err) => {
          audio.destroy();
          writeStream.destroy();
        })
        .once('end', () => {
          console.log(' finished (convertToMp3) !') 
          if(callBack)
            callBack(filePath)
          else
            streamCutRes(res, filePath)
        })
        .pipe(writeStream);
  }
}

function convertToMp4(filePath, outputPath, req, res, callBack) {
  let progress
  const start = Number(req.query.start)
  const end = Number(req.query.end)

  if(filePath &&  outputPath) {
    ffmpeg(filePath)
    .setStartTime(start)
    .setDuration(end-start)
    .output(outputPath)
    .on('progress', function({timemark}) {
      progress = Math.floor((hmsToSeconds(timemark)/ (end - start)) * 100)
      setVideoProgress(req, progress)
    })
    .on('end', function(err) {
      console.log(' finished (convertToMp4) !') 
      if(!err) { 
        console.log('conversion Done')
        
        if(callBack)
          callBack(outputPath)
        else
          streamCutRes(res, outputPath) 
      }
    })
    .on('error', err => console.log('error: ', err))
    .run()
  }
}

function cutVideoToMp3(req, res, callBack) {
  let audio
  const videoId = req.query.videoId

  if(req && res) {
    audio = ytdl(videoId, { quality: 'highestaudio' })

    audio.on('error', (err) => {
      console.log("error (videoToMp3) : ", err)
    })

    audio.once('progress', () => {
      getFilePath(videoId,'/mp3/', 'mp3', (filePath/*, outputPath*/) => {
        createStream(filePath, (writeStream) => {
          convertToMp3(audio, writeStream, filePath, req, res, callBack)
        })
      })
    })
  }
}

function cutVideoToMp4(req, res, callBack) {
  let progress
  const url = req.query.yUrl
  const videoId = req.query.videoId

  if(req && res) {
    getFilePath(videoId, '/mp4/', 'mp4', (filePath, outputPath) => {
      createStream(filePath, (writeStream) => {
        ytdl(url, { quality: 'highestvideo' })
        .on('progress', (length, downloaded, totalLength) => {
          progress = (downloaded/totalLength) * 100
          setConversionProgress(req, progress)

          if(progress === 100)
            convertToMp4(filePath, outputPath, req, res, callBack)

        }).pipe(writeStream)
      })
    })
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
    initCache(req)
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

function download(req, res) {
  const url = req.query.yUrl
  const start = req.query.start
  const end = req.query.end
  const format = req.query.format

  if(url) {
    if(start && end && format === 'mp3') {
      cutVideoToMp3(req, res)
    } else if(start && end && format === 'mp4') {
      cutVideoToMp3(req, res, (audio) => {
        cutVideoToMp4(req, res, (video) => {
          merge(video, audio, req, res)
        })
      })
      //Download Mp3/Mp4 -> cut -> merge 
    } else {
      res.header('Content-Disposition', 'attachment', filename="video.mp4")
      ytdl(url, {format : 'mp4'}).pipe(res)
    }
  }
}

module.exports = {
  download,
  progress
}