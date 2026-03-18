const xlsx = require("xlsx");

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = xlsx.utils.sheet_to_json(sheet);

  return data.map(row => ({
    image_name: String(row.image_name || "").trim().toLowerCase(),
    lat: parseFloat(row.lat),
    long: parseFloat(row.long)
  }));
}

module.exports = { parseExcel };