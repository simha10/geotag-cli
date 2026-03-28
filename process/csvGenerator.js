const fs = require("fs");
const path = require("path");

/**
 * Generates an ExifTool-compatible CSV with all 4 required GPS tags.
 *
 * GIS tools (e.g. ArcGIS) require ALL of:
 *   GPSLatitude, GPSLatitudeRef (N/S), GPSLongitude, GPSLongitudeRef (E/W)
 *
 * ExifTool CSV format rules:
 *   - Header row must match exact ExifTool tag names
 *   - SourceFile must be the first column
 *   - File paths with spaces must be double-quoted
 *   - Coordinate values must be absolute (positive); direction is encoded in the Ref tags
 */
function generateCSV(data) {
  const csvPath = path.join(__dirname, "../temp/metadata.csv");

  // ✅ All 4 GPS tags required for GIS compatibility
  const rows = [
    "SourceFile,GPSLatitude,GPSLatitudeRef,GPSLongitude,GPSLongitudeRef"
  ];

  data.forEach(item => {
    // Defensive fallback: derive refs if somehow missing (should never happen after matcher fix)
    const latRef  = item.latRef  || (item.lat  >= 0 ? "N" : "S");
    const longRef = item.longRef || (item.long >= 0 ? "E" : "W");

    // Absolute values for coordinates — direction is carried by the Ref tags
    const lat  = Math.abs(item.lat);
    const long = Math.abs(item.long);

    // Always quote SourceFile paths to handle spaces and special characters
    rows.push(`"${item.filePath}",${lat},${latRef},${long},${longRef}`);
  });

  fs.writeFileSync(csvPath, rows.join("\n"), "utf8");

  return csvPath;
}

module.exports = { generateCSV };