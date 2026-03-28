// process/exifRunner.js
const { execFile } = require("child_process");
const path = require("path");

const EXIF_PATH = "C:\\ExifTool\\exiftool.exe";

// ─── Core ExifTool runner ────────────────────────────────────────────────────

/**
 * Runs ExifTool safely via execFile (no shell injection risk).
 * Returns { stdout, stderr, code }.
 */
function spawnExif(args) {
  return new Promise((resolve) => {
    execFile(
      EXIF_PATH,
      args,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          code: error?.code ?? 0
        });
      }
    );
  });
}

// ─── Pass 1: Strip existing EXIF ────────────────────────────────────────────

/**
 * Removes all existing EXIF metadata from matched files only.
 * Gives ExifTool a clean slate before writing new GPS data.
 * Processes in batches to avoid OS command-line length limits.
 */
async function stripExif(files) {
  if (files.length === 0) {
    console.log("🧹 Pass 1: No files to clean\n");
    return;
  }

  console.log(`🧹 Pass 1: Stripping existing EXIF from ${files.length} matched files...\n`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
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

// ─── Pass 2: Write GPS via CSV ───────────────────────────────────────────────

/**
 * Writes GPS coordinates from the ExifTool-compatible CSV.
 *
 * The CSV must have all 4 columns:
 *   SourceFile, GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef
 *
 * ExifTool reads these as explicit tag assignments, so all 4 required GIS
 * tags are written in one atomic operation.
 */
async function writeGPS(csvPath, imageFolder) {
  console.log("📍 Pass 2: Writing GPS coordinates (GIS-compatible, all 4 tags)...\n");

  const { stdout, stderr } = await spawnExif([
    `-csv=${csvPath}`,
    "-overwrite_original",
    "-q",
    imageFolder
  ]);

  const output = stdout || stderr;

  const updatedMatch = output.match(/(\d+) image files? updated/);
  const failedMatch  = output.match(/(\d+) files? weren't updated/i);
  const errorLines   = output
    .split("\n")
    .filter(line =>
      line.toLowerCase().includes("error") ||
      line.toLowerCase().includes("failed")
    );

  if (updatedMatch) console.log(`✔ Successfully updated: ${updatedMatch[1]} files`);
  if (failedMatch)  console.log(`⚠ Failed to update:     ${failedMatch[1]} files`);

  return {
    stdout,
    stderr,
    updatedCount: updatedMatch ? parseInt(updatedMatch[1]) : 0,
    failedCount:  failedMatch  ? parseInt(failedMatch[1])  : 0,
    errors: errorLines
  };
}

// ─── Pass 3: Validate GPS completeness ──────────────────────────────────────

/**
 * Confirms all 4 required GPS tags are present and non-empty after writing.
 *
 * Uses `-s3` (shortest) output format and explicit tag list for reliable
 * parsing. Checks that ExifTool can read the tags back — not just that they
 * were written.
 *
 * Required tags for GIS (ArcGIS "GeoTagged Photos To Points"):
 *   GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef
 */
async function validateGPS(files) {
  if (files.length === 0) {
    return { valid: 0, invalid: 0, invalidFiles: [] };
  }

  console.log("🔍 Pass 3: Validating GPS metadata for GIS compatibility...\n");

  let validCount = 0;
  let invalidCount = 0;
  const invalidFiles = [];

  for (const filePath of files) {
    try {
      const { stdout } = await spawnExif([
        "-GPSLatitude",
        "-GPSLatitudeRef",
        "-GPSLongitude",
        "-GPSLongitudeRef",
        "-s3",           // prints bare values, one per line — no field name noise
        filePath
      ]);

      // With -s3, ExifTool prints one line per tag found (in request order).
      // A missing tag produces no output line — so we count non-empty lines.
      const lines = stdout
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

      // ✅ All 4 tags must be present and non-empty
      const hasLat     = lines.length >= 1 && lines[0].length > 0;
      const hasLatRef  = lines.length >= 2 && lines[1].length > 0;
      const hasLong    = lines.length >= 3 && lines[2].length > 0;
      const hasLongRef = lines.length >= 4 && lines[3].length > 0;

      if (hasLat && hasLatRef && hasLong && hasLongRef) {
        validCount++;
      } else {
        invalidCount++;
        invalidFiles.push({
          file: path.basename(filePath),
          path: filePath,
          missing: {
            GPSLatitude:     !hasLat,
            GPSLatitudeRef:  !hasLatRef,
            GPSLongitude:    !hasLong,
            GPSLongitudeRef: !hasLongRef
          }
        });
      }
    } catch (err) {
      invalidCount++;
      invalidFiles.push({
        file: path.basename(filePath),
        path: filePath,
        error: err.message
      });
    }
  }

  console.log(`✔ GIS-compatible GPS metadata: ${validCount} files`);
  if (invalidCount > 0) {
    console.log(`⚠ Incomplete/Invalid GPS metadata: ${invalidCount} files`);
  }
  console.log();

  return { valid: validCount, invalid: invalidCount, invalidFiles };
}

// ─── Main runner ─────────────────────────────────────────────────────────────

/**
 * Orchestrates all 3 passes: strip → write → validate.
 *
 * Strip isolates each image so stale GPS tags from a previous run
 * can't bleed through. Write uses the CSV for atomic 4-tag assignment.
 * Validate confirms GIS readability per-file.
 */
async function runExifTool(csvPath, imageFolder, matchedFiles) {
  const filePaths = matchedFiles.map(m => m.filePath);

  await stripExif(filePaths);
  const writeResult = await writeGPS(csvPath, imageFolder);
  const validationResult = await validateGPS(filePaths);

  return { ...writeResult, validation: validationResult };
}

module.exports = { runExifTool };