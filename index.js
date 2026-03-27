const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { parseExcel } = require("./process/excelParser");
const { matchImages } = require("./process/matcher");
const { generateCSV } = require("./process/csvGenerator");
const { runExifTool } = require("./process/exifRunner");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function cleanPath(p) {
  return p.replace(/^"(.*)"$/, "$1").trim();
}

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
  try {
    const imageFolder = cleanPath(await ask("Enter image folder path or Drag & drop image folder here: "));
    const excelPath = cleanPath(await ask("Enter Excel file path or Drag & drop Excel file here: "));

    console.log("\nProcessing...\n");

    // Ensure temp and logs directories exist
    ["./temp", "./logs"].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // Step 1: Parse Excel
    console.log("📊 Step 1: Parsing Excel file...");
    const excelData = parseExcel(excelPath);
    console.log(`   Found ${excelData.length} entries in Excel\n`);

    // Step 2: Match Images
    console.log("🔍 Step 2: Matching images with Excel data...");
    const { matched, excelMissing, imageMissing } = matchImages(imageFolder, excelData);
    console.log(`   Matched: ${matched.length} images`);
    console.log(`   Excel entries not found: ${excelMissing.length}`);
    console.log(`   Images without Excel data: ${imageMissing.length}\n`);

    // Step 3: Generate CSV
    console.log("📝 Step 3: Generating CSV metadata file...");
    const csvPath = generateCSV(matched);
    console.log(`   CSV generated at: ${csvPath}\n`);

    // Step 4: Run ExifTool
    console.log("📍 Step 4: Processing EXIF metadata...\n");
    const exifResult = await runExifTool(csvPath, imageFolder, matched);

    // Step 5: Generate Logs
    console.log("\n📋 Step 5: Generating logs...\n");
    
    // Write detailed log files
    fs.writeFileSync("./logs/excel_missing.txt", excelMissing.join("\n"));
    fs.writeFileSync("./logs/image_missing.txt", imageMissing.join("\n"));
    
    // Write failed updates log if there were failures
    if (exifResult.errors && exifResult.errors.length > 0) {
      fs.writeFileSync("./logs/failed_updates.txt", exifResult.errors.join("\n"));
    }

    console.log("✔ Processing complete\n");
    console.log("=".repeat(60));
    console.log("📊 SUMMARY REPORT");
    console.log("=".repeat(60));
    console.log(`✔ Total images scanned:         ${matched.length + imageMissing.length}`);
    console.log(`✔ Matched & updated:            ${exifResult.updatedCount || matched.length}`);
    console.log(`❌ Excel entries not found:     ${excelMissing.length}`);
    console.log(`❌ Images without Excel data:   ${imageMissing.length}`);
    console.log(`⚠ Failed updates:               ${exifResult.failedCount || 0}`);
    console.log("=".repeat(60));
    
    // Show matched files
    if (matched.length > 0) {
      console.log(`\n✔ Modified images with GPS coordinates (${matched.length}):`);
      matched.forEach((item, index) => {
        const fileName = path.basename(item.filePath);
        console.log(`   ${index + 1}. ${fileName}`);
      });
    }
    
    // Show Excel entries not found
    if (excelMissing.length > 0) {
      console.log(`\n❌ Excel entries not found in folder (${excelMissing.length}):`);
      excelMissing.slice(0, 10).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      if (excelMissing.length > 10) {
        console.log(`   ... and ${excelMissing.length - 10} more (see logs/excel_missing.txt)`);
      }
    }
    
    // Show images without Excel data
    if (imageMissing.length > 0) {
      console.log(`\n❌ Images without GPS coordinates in Excel (${imageMissing.length}):`);
      imageMissing.slice(0, 10).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      if (imageMissing.length > 10) {
        console.log(`   ... and ${imageMissing.length - 10} more (see logs/image_missing.txt)`);
      }
    }
    
    // Show failed updates if any
    if (exifResult.failedCount > 0 || (exifResult.errors && exifResult.errors.length > 0)) {
      console.log(`\n⚠ Failed updates (${exifResult.failedCount || exifResult.errors.length}):`);
      console.log(`   Check logs/failed_updates.txt for details`);
    }
    
    console.log("\n📁 Log files generated:");
    console.log("   - logs/excel_missing.txt (Excel entries not found)");
    console.log("   - logs/image_missing.txt (Images without Excel data)");
    if (exifResult.errors && exifResult.errors.length > 0) {
      console.log("   - logs/failed_updates.txt (Processing errors)");
    }
    console.log();

    rl.close();

  } catch (err) {
    console.error("❌ Error:", err);
    rl.close();
  }
})();