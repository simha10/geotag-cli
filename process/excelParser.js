const xlsx = require("xlsx");

/**
 * Parses the Excel file and normalises coordinate columns.
 *
 * Handles common column name variations (lat, Lat, LAT, latitude, etc.).
 * Produces absolute coordinate values and explicit N/S, E/W reference tags
 * so all downstream consumers (matcher → csvGenerator → exifRunner) receive
 * the full 4-tag GPS payload required by GIS tools.
 */
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  return data.map(row => {
    const lat = parseFloat(
      row.lat        || row.Lat        || row.LAT        ||
      row.latitude   || row.Latitude   || row.LATITUDE   ||
      row["GPS Latitude"] || row.gps_latitude || 0
    );

    const long = parseFloat(
      row.long       || row.Long       || row.LONG       ||
      row.longitude  || row.Longitude  || row.LONGITUDE  ||
      row["GPS Longitude"] || row.gps_longitude || 0
    );

    // Derive directional references from sign, then store absolute values.
    // ExifTool CSV format: coordinate must be positive; direction goes in Ref tag.
    const latRef  = lat  >= 0 ? "N" : "S";
    const longRef = long >= 0 ? "E" : "W";

    return {
      image_name: String(row.image_name || "").trim().toLowerCase(),
      lat:        Math.abs(lat),
      long:       Math.abs(long),
      latRef,
      longRef
    };
  });
}

module.exports = { parseExcel };