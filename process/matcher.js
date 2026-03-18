const fs = require("fs");
const path = require("path");

function getBaseName(file) {
  return path.parse(file).name.toLowerCase().trim();
}

function matchImages(imageFolder, excelData) {
  const files = fs.readdirSync(imageFolder);

  const normalizedFiles = files.map(f => ({
    original: f,
    base: getBaseName(f)
  }));

  const matched = [];
  const missing = [];
  const matchedFileNames = new Set();

  // Match Excel entries to images
  excelData.forEach(row => {
    if (!row.image_name) {
      missing.push("invalid_row");
      return;
    }

    const targetBase = getBaseName(row.image_name);

    const found = normalizedFiles.find(f => f.base === targetBase);

    if (found) {
      matched.push({
        filePath: path.join(imageFolder, found.original),
        lat: row.lat,
        long: row.long
      });
      matchedFileNames.add(found.original);
    } else {
      missing.push(row.image_name);
    }
  });

  // Find images that don't have Excel entries
  normalizedFiles.forEach(file => {
    if (!matchedFileNames.has(file.original)) {
      missing.push(file.original);
    }
  });

  return { matched, missing };
}

module.exports = { matchImages };