const fs = require('fs');
const ytdl = require('ytdl-core');
let ffmpeg = require('ffmpeg');

function videoToMp3(req, res) {
  let stream
  const videoId = req.query.videoId

  if(videoId) {
    stream = ytdl(videoId, 'highestaudio')
    ffmpeg(stream)
    .audioBitrate(128)
    .save(`${__dirname}/${videoId}.mp3`, (error, file)=>{
      if(!error)
        file.pipe(res)
        //console.log()
    })
  }
}

function videoToMp4(req, res) {
  let stream
  const url = req.query.yUrl
  const start = req.query.start
  const end = req.query.end

  if(url) {
    console.log("start : ", start, ", end : ", end, ", url : ", url)
    stream = fs.createWriteStream('video.mp4')
    ytdl(url, {format : 'mp4'}).pipe(stream)

    ffmpeg(stream)
    .then((video) => {
      video
      //.setVideoStartTime(13)
      //.setVideoDuration(20)
      .save(`${__dirname}/test.mp4`, (error, file) => {
        
        res.header('Content-Disposition', 'attachment', filename="video.mp4")

        if(!error)
          file.pipe(res)
          
        console.log('Video file : ' + file) 
      })
    })

  }
}

function downloadVideo(req, res) {
  const url = req.query.yUrl
  //const start = req.query.start
  //const end = req.query.end
  if(url) {
    //res.header('Content-Disposition', 'attachment', filename="video.mp4")
    //ytdl(url, {format : 'mp4'}).pipe(res)
    videoToMp4(req, res)
  }
}

module.exports = {
  videoToMp3,
  videoToMp4,
  downloadVideo,
}