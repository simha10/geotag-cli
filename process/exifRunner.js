// process/exifRunner.js
const { execFile } = require("child_process"); // safer than exec - no shell injection
const path = require("path");
const fs = require("fs");

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
 * Strip all existing EXIF metadata from specific files only.
 * This gives ExifTool a clean slate to write into.
 * -all= means "set all tags to nothing" (delete them)
 */
async function stripExif(files) {
  if (files.length === 0) {
    console.log("🧹 Pass 1: No files to clean\n");
    return;
  }

  console.log(`🧹 Pass 1: Stripping existing EXIF from ${files.length} matched files...\n`);
  
  // Process files individually to avoid command line length limits
  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const { stdout, stderr } = await spawnExif([
      "-all=",
      "-overwrite_original",
      ...batch
    ]);
    if (stderr && !stdout.includes("images updated")) {
      console.error(stderr);
    }
  }
  
  console.log("✔ Metadata cleanup complete\n");
}

/**
 * PASS 2 — Write GPS coordinates from the CSV to the cleaned files.
 * Returns detailed results including success/failure lists.
 */
async function writeGPS(csvPath, imageFolder) {
  console.log("📍 Pass 2: Writing GPS coordinates...\n");
  
  const { stdout, stderr } = await spawnExif([
    `-csv=${csvPath}`,
    "-overwrite_original",
    "-q",  // Quiet mode to reduce noise
    imageFolder
  ]);

  const output = stdout || stderr;

  const updatedMatch = output.match(/(\d+) image files? updated/);
  const failedMatch  = output.match(/(\d+) files? weren't updated/i);
  const errorLines = output.split('\n').filter(line => 
    line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')
  );

  if (updatedMatch) {
    console.log(`✔ Successfully updated: ${updatedMatch[1]} files`);
  }
  if (failedMatch) {
    console.log(`⚠ Failed to update:     ${failedMatch[1]} files`);
  }

  return { 
    stdout, 
    stderr,
    updatedCount: updatedMatch ? parseInt(updatedMatch[1]) : 0,
    failedCount: failedMatch ? parseInt(failedMatch[1]) : 0,
    errors: errorLines
  };
}

/**
 * Main runner: strip metadata from matched files first, then write GPS.
 */
async function runExifTool(csvPath, imageFolder, matchedFiles) {
  // Extract just the file paths from matched files array
  const filePaths = matchedFiles.map(m => m.filePath);
  
  await stripExif(filePaths);
  return await writeGPS(csvPath, imageFolder);
}

module.exports = { runExifTool };