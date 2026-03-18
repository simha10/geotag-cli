const { exec } = require("child_process");

const EXIF_PATH = "C:\\ExifTool\\exiftool.exe";

function runExifTool(csvPath, imageFolder) {
  return new Promise((resolve, reject) => {
    const command = `"C:\\ExifTool\\exiftool.exe" -csv="${csvPath}" -overwrite_original "${imageFolder}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("ExifTool Error:", stderr);
        reject(stderr);
      } else {
        console.log("ExifTool Output:", stdout);
        resolve(stdout);
      }
    });
  });
}

module.exports = { runExifTool };