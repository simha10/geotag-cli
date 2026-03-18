const readline = require("readline");
const fs = require("fs");

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

    // Step 1: Parse Excel
    const excelData = parseExcel(excelPath);

    // Step 2: Match Images
    const { matched, missing } = matchImages(imageFolder, excelData);

    // Step 3: Generate CSV
    const csvPath = generateCSV(matched);

    // Step 4: Run ExifTool
    await runExifTool(csvPath, imageFolder);

    // Step 5: Logs
    fs.writeFileSync("./logs/missing.txt", missing.join("\n"));

    console.log("✔ Processing complete");
    console.log(`✔ Matched: ${matched.length}`);
    console.log(`⚠ Missing: ${missing.length}`);
    
    if (missing.length > 0) {
      console.log("\n⚠ Files without GPS coordinates in Excel:");
      missing.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    }

    rl.close();

  } catch (err) {
    console.error("❌ Error:", err);
    rl.close();
  }
})();