const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { parseExcel }  = require("./process/excelParser");
const { matchImages } = require("./process/matcher");
const { generateCSV } = require("./process/csvGenerator");
const { runExifTool } = require("./process/exifRunner");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function cleanPath(p) {
  if (!p || typeof p !== 'string') return '';
  // Remove leading/trailing whitespace
  let cleaned = p.trim();
  // Remove PowerShell '& ' prefix if present (happens with drag & drop)
  cleaned = cleaned.replace(/^&\s+/, '');
  // Remove surrounding quotes (both single and double)
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  // Handle escaped quotes that might appear in some terminals
  cleaned = cleaned.replace(/^\\"|\\"$/g, '');
  return cleaned;
}

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
  try {
    const imageFolder = cleanPath(await ask("Enter image folder path or drag & drop here: "));
    const excelPath   = cleanPath(await ask("Enter Excel file path or drag & drop here: "));

    console.log("\nProcessing...\n");

    ["./temp", "./logs"].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // ── Step 1: Parse Excel ──────────────────────────────────────────────────
    console.log("📊 Step 1: Parsing Excel file...");
    const excelData = parseExcel(excelPath);
    console.log(`   Found ${excelData.length} entries in Excel\n`);

    // ── Step 2: Match images ─────────────────────────────────────────────────
    console.log("🔍 Step 2: Matching images with Excel data...");
    const { matched, excelMissing, imageMissing } = matchImages(imageFolder, excelData);
    console.log(`   Matched: ${matched.length} images`);
    console.log(`   Excel entries not found: ${excelMissing.length}`);
    console.log(`   Images without Excel data: ${imageMissing.length}\n`);

    if (matched.length === 0) {
      console.log("⚠ No matching images found. Check that image_name values in Excel");
      console.log("  match the filenames (without extension) in the image folder.\n");
      rl.close();
      return;
    }

    // ── Step 3: Generate CSV ─────────────────────────────────────────────────
    console.log("📝 Step 3: Generating CSV metadata file...");
    const csvPath = generateCSV(matched);
    console.log(`   CSV generated at: ${csvPath}\n`);

    // ── Step 4: Run ExifTool (strip → write → validate) ──────────────────────
    console.log("📍 Step 4: Processing EXIF metadata...\n");
    const exifResult = await runExifTool(csvPath, imageFolder, matched);

    // ── Step 5: Write logs ───────────────────────────────────────────────────
    console.log("\n📋 Step 5: Generating logs...\n");

    fs.writeFileSync("./logs/excel_missing.txt", excelMissing.join("\n"));
    fs.writeFileSync("./logs/image_missing.txt", imageMissing.join("\n"));

    if (exifResult.errors && exifResult.errors.length > 0) {
      fs.writeFileSync("./logs/failed_updates.txt", exifResult.errors.join("\n"));
    }

    if (exifResult.validation?.invalidFiles?.length > 0) {
      const validationLog = exifResult.validation.invalidFiles
        .map(f => {
          if (f.error) return `${f.file}: ${f.error}`;
          const missing = Object.entries(f.missing || {})
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ");
          return `${f.file}: Missing ${missing}`;
        })
        .join("\n");
      fs.writeFileSync("./logs/gps_validation.txt", validationLog);
    }

    // ── Summary report ───────────────────────────────────────────────────────
    console.log("✔ Processing complete\n");
    console.log("=".repeat(60));
    console.log("📊 SUMMARY REPORT");
    console.log("=".repeat(60));
    console.log(`✔ Total images scanned:           ${matched.length + imageMissing.length}`);
    console.log(`✔ Matched & updated:              ${exifResult.updatedCount || matched.length}`);
    console.log(`❌ Excel entries not found:       ${excelMissing.length}`);
    console.log(`❌ Images without Excel data:     ${imageMissing.length}`);
    console.log(`⚠  Failed updates:                ${exifResult.failedCount || 0}`);
    if (exifResult.validation) {
      console.log(`✅ GIS-compatible (all 4 tags):   ${exifResult.validation.valid} files`);
      console.log(`⚠  Incomplete GPS metadata:       ${exifResult.validation.invalid} files`);
    }
    console.log("=".repeat(60));

    // Show matched files
    if (matched.length > 0) {
      console.log(`\n✔ Images geotagged (${matched.length}):`);
      matched.forEach((item, i) => {
        const name = path.basename(item.filePath);
        console.log(`   ${i + 1}. ${name}  (${item.lat}°${item.latRef}, ${item.long}°${item.longRef})`);
      });
    }

    // Show Excel entries not found
    if (excelMissing.length > 0) {
      console.log(`\n❌ Excel entries not found in folder (${excelMissing.length}):`);
      excelMissing.slice(0, 10).forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
      if (excelMissing.length > 10) {
        console.log(`   ... and ${excelMissing.length - 10} more (see logs/excel_missing.txt)`);
      }
    }

    // Show images without Excel data
    if (imageMissing.length > 0) {
      console.log(`\n❌ Images without GPS coordinates (${imageMissing.length}):`);
      imageMissing.slice(0, 10).forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
      if (imageMissing.length > 10) {
        console.log(`   ... and ${imageMissing.length - 10} more (see logs/image_missing.txt)`);
      }
    }

    // Show validation failures
    if (exifResult.validation?.invalidFiles?.length > 0) {
      console.log(`\n⚠ GIS validation failures (${exifResult.validation.invalid}):`);
      exifResult.validation.invalidFiles.slice(0, 10).forEach(f => {
        const missing = f.error
          ? f.error
          : Object.entries(f.missing || {}).filter(([, v]) => v).map(([k]) => k).join(", ");
        console.log(`   • ${f.file}: missing ${missing}`);
      });
      console.log("   (see logs/gps_validation.txt for full list)");
    }

    // Show failed updates
    if (exifResult.failedCount > 0) {
      console.log(`\n⚠ Failed updates: ${exifResult.failedCount}`);
      console.log("   See logs/failed_updates.txt for details");
    }

    console.log("\n📁 Log files:");
    console.log("   • logs/excel_missing.txt");
    console.log("   • logs/image_missing.txt");
    if (exifResult.errors?.length > 0)                      console.log("   • logs/failed_updates.txt");
    if (exifResult.validation?.invalidFiles?.length > 0)    console.log("   • logs/gps_validation.txt");
    console.log();

    rl.close();

  } catch (err) {
    console.error("❌ Error:", err.message || err);
    rl.close();
  }
})();