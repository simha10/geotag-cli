# GeoTag CLI

A command-line tool that automatically adds GPS coordinates to images using ExifTool. This tool matches images from a folder with coordinate data from an Excel file and writes the GPS metadata to the image files.

## Features

- 📊 Parse Excel files containing GPS coordinate data
- 🔍 Automatically match images with their corresponding coordinates
- 📍 Write GPS metadata (latitude & longitude) to image files
- 📝 Generate CSV metadata for batch processing
- ⚠️ Log unmatched images for review

## Prerequisites

### 1. Install ExifTool

This tool requires ExifTool to be installed on your system:

1. Download ExifTool from the [official website](https://exiftool.org)
2. Extract the downloaded folder
3. Rename `exiftool(-k).exe` to `exiftool.exe`
4. Create a folder at `C:\ExifTool`
5. Move `exiftool.exe` and other files to `C:\ExifTool\`
6. Verify installation by running:
   ```powershell
   exiftool -ver
   ```

### 2. Node.js

Make sure you have Node.js installed on your system.

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```powershell
   cd d:\projects\geotag-cli
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```

## Usage

Run the tool using:

```powershell
npm start
```

You will be prompted to enter:

1. **Image folder path**: The directory containing your images
2. **Excel file path**: The path to your Excel file with GPS coordinates

### Excel File Format

Your Excel file should have the following columns in the first sheet:

| image_name | lat | long |
|------------|-----|------|
| photo1.jpg | 40.7128 | -74.0060 |
| photo2.jpg | 34.0522 | -118.2437 |

- `image_name`: Name of the image file (with extension)
- `lat`: Latitude coordinate (decimal format)
- `long`: Longitude coordinate (decimal format)

### How It Works

1. **Parse Excel**: Reads GPS coordinates from the Excel file
2. **Match Images**: Matches image filenames with entries in the Excel file (case-insensitive, ignores file extensions)
3. **Generate CSV**: Creates a temporary CSV file with the mapping
4. **Run ExifTool**: Writes GPS coordinates to image metadata
5. **Log Results**: Saves matched count and creates a log of unmatched entries

## Output

After processing, you'll see:

- ✅ Number of successfully matched images
- ⚠️ Number of missing/unmatched images
- 📄 A log file at `logs/missing.txt` containing names of unmatched images

## Example

```
Enter image folder path: D:\Photos\Vacation
Enter Excel file path: D:\Photos\coordinates.xlsx

Processing...

ExifTool Output: X images updated

✔ Processing complete
✔ Matched: 45
⚠ Missing: 3
```

## Project Structure

```
geotag-cli/
├── index.js              # Main entry point
├── process/
│   ├── excelParser.js    # Excel file parser
│   ├── matcher.js        # Image matching logic
│   ├── csvGenerator.js   # CSV file generator
│   └── exifRunner.js     # ExifTool executor
├── temp/                 # Temporary files (CSV)
├── logs/                 # Log files
│   └── missing.txt       # Unmatched images log
└── package.json
```

## Dependencies

- **xlsx**: For parsing Excel files
- **ExifTool**: For writing GPS metadata to images (external dependency)

## License

ISC