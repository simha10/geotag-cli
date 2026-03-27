# GeoTag CLI - Robust Geotagging Tool Documentation

## 🎯 Overview

This is a **significantly enhanced** version of the GeoTag CLI tool that guarantees GPS metadata (latitude & longitude) is written to every valid image with corresponding Excel data, even when input data or image files are imperfect.

---

## 🔧 Key Fixes Implemented

### 1. ✅ Fixed: Incorrect Data Modeling (Critical Logic Bug)

**Problem:** The system mixed Excel entries not found in folder with image files not found in Excel into a single `missing` list.

**Solution:** 
- Separated into two distinct lists:
  - `excelMissing` → rows in Excel not found in folder
  - `imageMissing` → images without Excel data
- Provides accurate counts and clear reporting

**Files Changed:** `process/matcher.js`

---

### 2. ✅ Fixed: Processing Non-Image Files

**Problem:** The system read all files from folder without filtering, including junk files like `desktop.ini`, `Thumbs.db`.

**Solution:** 
- Added image file validation
- Only processes `.jpg`, `.jpeg`, `.png` files
- Filters out system files and non-image content

**Files Changed:** `process/matcher.js`

---

### 3. ✅ Fixed: CSV Formatting Issue (Silent Failure)

**Problem:** CSV generator did not wrap file paths in quotes, causing paths with spaces to break ExifTool parsing.

**Solution:** 
- All file paths now wrapped in double quotes
- Format: `"absolute/path/image.jpg",lat,long`
- Prevents silent failures for files with spaces in names

**Files Changed:** `process/csvGenerator.js`

---

### 4. ✅ Fixed: Over-aggressive Metadata Removal

**Problem:** System removed all metadata from entire folder before writing GPS, causing images without matching Excel entries to lose metadata permanently.

**Solution:** 
- Only strips metadata from **matched files** (images that will be updated)
- Preserves metadata for unmatched images
- Batch processing in groups of 50 for efficiency

**Files Changed:** `process/exifRunner.js`

---

### 5. ✅ Enhanced: Error Handling & Structured Logging

**Problem:** ExifTool errors were logged but not categorized, making it hard to diagnose issues.

**Solution:** 
- Categorized error reporting
- Detailed logging with separate files:
  - `logs/excel_missing.txt` - Excel entries not found
  - `logs/image_missing.txt` - Images without Excel data
  - `logs/failed_updates.txt` - Processing errors
- Structured summary report with clear statistics

**Files Changed:** `process/exifRunner.js`, `index.js`

---

## 📋 System Behavior

### Processing Pipeline

#### Step 1: Filter Inputs
- Scans image folder
- Filters only valid image files (`.jpg`, `.jpeg`, `.png`)
- Ignores system files and non-image content

#### Step 2: Match Data
- Matches Excel entries to images by filename (case-insensitive, ignores extensions)
- Creates three lists:
  - `matched` - successful matches
  - `excelMissing` - Excel entries without images
  - `imageMissing` - images without Excel data

#### Step 3: Pre-clean (Matched Files Only)
- Strips EXIF metadata **only from matched files**
- Uses batch processing for efficiency
- Clean slate ensures reliable GPS writing

#### Step 4: Write GPS
- Uses CSV-based batch write via ExifTool
- Handles files with/without existing EXIF
- Updates GPS coordinates for all matched images

---

## 🛡️ Fault Tolerance

The system now handles:

### ✅ Corrupted EXIF Data
- Attempts cleanup and rewrite
- Strips corrupted metadata before writing
- Reports failures clearly in logs

### ✅ Missing Files
- Logs missing Excel entries separately
- Logs images without GPS data separately
- No silent failures

### ✅ Invalid Coordinates
- Validates coordinate data during Excel parsing
- Skips invalid entries with warnings
- Continues processing remaining files

---

## 📊 Structured Output

### Console Report

```
================================================================
📊 SUMMARY REPORT
================================================================
✔ Total images scanned:         150
✔ Matched & updated:            120
❌ Excel entries not found:     15
❌ Images without Excel data:   15
⚠ Failed updates:               0
================================================================

✔ Modified images with GPS coordinates (120):
   1. photo1.jpg
   2. photo2.jpg
   ...

❌ Excel entries not found in folder (15):
   1. missing_photo1.jpg
   2. missing_photo2.jpg
   ...

❌ Images without GPS coordinates in Excel (15):
   1. orphan_image1.jpg
   2. orphan_image2.jpg
   ...

📁 Log files generated:
   - logs/excel_missing.txt (Excel entries not found)
   - logs/image_missing.txt (Images without Excel data)
```

---

## 🔒 Engineering Principles

This system is designed as a **data reconciliation + transformation pipeline**:

1. **Handles Imperfect Inputs**
   - Corrupted metadata
   - Missing files
   - Invalid data

2. **Avoids Silent Failures**
   - Every failure is logged
   - Clear categorization of issues
   - Transparent reporting

3. **Guarantees Output Consistency**
   - All matched images get GPS data
   - Unmatched images preserve their state
   - Comprehensive audit trail via logs

---

## 🚀 Usage

### Prerequisites

1. **Node.js** installed
2. **ExifTool** installed at `C:\ExifTool\exiftool.exe` and added to system PATH

### Installation

```powershell
cd e:\Projects\geotag-cli
npm install
```

### Running the Tool

```powershell
npm start
```

You'll be prompted for:
1. Image folder path
2. Excel file path

### Excel Format

| image_name | lat | long |
|------------|-----|------|
| photo1.jpg | 26.176335 | 80.968250 |
| IMG_001.png | 28.613939 | 77.209021 |

---

## 📂 Project Structure

```
geotag-cli/
├── index.js                  # Main entry point (enhanced reporting)
├── process/
│   ├── excelParser.js        # Excel file parser
│   ├── matcher.js            # Image matching (FIXED: filters images)
│   ├── csvGenerator.js       # CSV generator (FIXED: quoted paths)
│   └── exifRunner.js         # ExifTool executor (FIXED: selective cleanup)
├── temp/                     # Temporary files
│   └── metadata.csv          # Generated CSV
├── logs/                     # Log files
│   ├── excel_missing.txt     # Excel entries not found
│   ├── image_missing.txt     # Images without Excel data
│   └── failed_updates.txt    # Processing errors (if any)
└── package.json
```

---

## 🎯 Primary Guarantee

**If an image has valid latitude & longitude data available in the Excel file, it WILL end up with correct GPS metadata written — regardless of initial EXIF state.**

This includes:
- ✅ Images with no metadata → creates new EXIF block
- ✅ Images with corrupted metadata → cleans and rewrites safely
- ✅ Images with valid metadata → updates GPS fields only

---

## 🔍 Dependencies

- **xlsx** (v0.18.5) - Excel parsing
- **ExifTool** (external) - Metadata writing
- **Node.js** (v0.8+) - Runtime

---

## 📝 Version History

### Current Version (Enhanced)
- ✅ Separated missing lists (excelMissing vs imageMissing)
- ✅ Image file filtering (.jpg, .jpeg, .png only)
- ✅ CSV path quoting for space handling
- ✅ Selective metadata stripping (matched files only)
- ✅ Enhanced error categorization
- ✅ Structured logging system
- ✅ Comprehensive summary reporting

### Previous Version
- Mixed missing lists
- Processed all files (including non-images)
- CSV paths unquoted (silent failures)
- Stripped metadata from entire folder
- Basic error handling
- Single log file

---

## 🛠️ Troubleshooting

### Common Issues

**Issue:** "Error reading OtherImageStart data in IFD0"
- **Cause:** Structural corruption in JPEG's EXIF segment
- **Solution:** Tool automatically strips corrupted metadata before rewrite
- **If persists:** Check `logs/failed_updates.txt` for details

**Issue:** Low match count
- **Check:** Filename spelling in Excel (case-insensitive but must match base name)
- **Verify:** Image extensions are supported (.jpg, .jpeg, .png)

**Issue:** ExifTool not found
- **Verify:** ExifTool installed at `C:\ExifTool\exiftool.exe`
- **Check:** System PATH includes ExifTool location

---

## 📞 Support

For issues or questions:
1. Check log files in `logs/` directory
2. Verify ExifTool installation: `exiftool -ver`
3. Ensure image files are valid JPEG/PNG format
4. Confirm Excel column names: `image_name`, `lat`, `long`

---

## ⚡ Performance Notes

- **Batch Processing:** Files processed in batches of 50 for optimal performance
- **Selective Cleanup:** Only matched files are modified (faster, safer)
- **CSV Batch Write:** Single ExifTool call for all GPS writes
- **Memory Efficient:** Streams data rather than loading all at once

---

**Built with ❤️ for reliable geotagging**
