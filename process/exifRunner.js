// process/exifRunner.js
const { execFile } = require("child_process"); // safer than exec - no shell injection
const path = require("path");

const EXIF_PATH = "C:\\ExifTool\\exiftool.exe";

/**
 * Runs ExifTool as a child process safely using execFile.
 * Returns a Promise resolving with { stdout, stderr, code }.
 */
function spawnExif(args) {
  return new Promise((resolve) => {
    execFile(EXIF_PATH, args, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      resolve({ stdout: stdout || "", stderr: stderr || "", code: error?.code ?? 0 });
    });
  });
}

/**
 * PASS 1 — Strip all existing (possibly corrupted) EXIF metadata from every file.
 * This gives ExifTool a clean slate to write into.
 * -all= means "set all tags to nothing" (delete them)
 * -overwrite_original so no _original backup files pile up
 */
async function stripExif(imageFolder) {
  console.log("🧹 Pass 1: Stripping existing EXIF to fix corrupted IFD0...\n");
  const { stdout, stderr } = await spawnExif([
    "-all=",
    "-overwrite_original",
    "-r",          // recursive, safe even if not needed
    "-ext", "jpg",
    "-ext", "jpeg",
    imageFolder
  ]);
  console.log(stdout || stderr);
}

/**
 * PASS 2 — Write GPS coordinates from the CSV to the now-clean files.
 */
async function writeGPS(csvPath, imageFolder) {
  console.log("📍 Pass 2: Writing GPS coordinates...\n");
  const { stdout, stderr } = await spawnExif([
    `-csv=${csvPath}`,
    "-overwrite_original",
    imageFolder
  ]);

  const output = stdout || stderr;

  const updatedMatch = output.match(/(\d+) image files? updated/);
  const failedMatch  = output.match(/(\d+) files? weren't updated/i);

  console.log(updatedMatch ? `✔ Successfully updated: ${updatedMatch[1]} files` : "");
  console.log(failedMatch  ? `⚠ Failed to update:     ${failedMatch[1]} files`  : "");

  return { stdout, stderr };
}

/**
 * Main runner: strip first, then write GPS.
 */
async function runExifTool(csvPath, imageFolder) {
  await stripExif(imageFolder);
  return await writeGPS(csvPath, imageFolder);
}

module.exports = { runExifTool };