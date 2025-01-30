const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobe = require("@ffprobe-installer/ffprobe");

const ffmpeg = require("fluent-ffmpeg")()
  .setFfprobePath(ffprobe.path)
  .setFfmpegPath(ffmpegInstaller.path);

const args = process.argv.slice(2);
const path = args[0];

function main() {
  try {
    ffmpeg
      .input(path)
      .noAudio()
      .outputOptions("-pix_fmt yuv420p")
      .output(`./${path.slice(0, -4)}.mp4`)
      .on("end", () => {
        console.log("Video Generated!");
      })
      .on("error", (e) => console.log(e))
      .run();
  } catch (e) {
    console.log(e);
  }
}

main();
