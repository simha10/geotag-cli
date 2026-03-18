const fs = require("fs");
const path = require("path");

function generateCSV(data) {
  const csvPath = path.join(__dirname, "../temp/metadata.csv");

  const rows = ["SourceFile,GPSLatitude,GPSLongitude"];

  data.forEach(item => {
    // 🔥 IMPORTANT: wrap path in quotes
    rows.push(`"${item.filePath}",${item.lat},${item.long}`);
  });

  fs.writeFileSync(csvPath, rows.join("\n"), "utf8");

  return csvPath;
}

module.exports = { generateCSV };