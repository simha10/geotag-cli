const fs = require("fs");
const path = require("path");

const VALID_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

function getBaseName(file) {
  return path.parse(file).name.toLowerCase().trim();
}

function isValidImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VALID_IMAGE_EXTENSIONS.has(ext);
}

function matchImages(imageFolder, excelData) {
  const files = fs.readdirSync(imageFolder).filter(isValidImageFile);

  const normalizedFiles = files.map(f => ({
    original: f,
    base: getBaseName(f)
  }));

  const matched = [];
  const excelMissing = []; // Excel entries not found in folder
  const imageMissing = []; // Images without Excel data
  const matchedFileNames = new Set();

  // Match Excel entries to images
  excelData.forEach(row => {
    if (!row.image_name) {
      excelMissing.push("invalid_row (empty filename)");
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
      excelMissing.push(row.image_name);
    }
  });

  // Find images that don't have Excel entries
  normalizedFiles.forEach(file => {
    if (!matchedFileNames.has(file.original)) {
      imageMissing.push(file.original);
    }
  });

  return { matched, excelMissing, imageMissing };
}

module.exports = { matchImages };