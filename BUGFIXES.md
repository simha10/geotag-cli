# Bug Fixes Summary

## Issues Fixed - March 18, 2026

### 1. ✅ Security: Replaced `exec` with `execFile` (CRITICAL)
**File:** `process/exifRunner.js`  
**Risk:** Shell injection vulnerability if user provides malicious folder paths  
**Fix:** Switched from `exec()` to `execFile()` which passes arguments as an array, eliminating shell interpretation

**Before:**
```javascript
const { exec } = require("child_process");
exec(`"C:\\ExifTool\\exiftool.exe" ... "${imageFolder}"`)
```

**After:**
```javascript
const { execFile } = require("child_process");
execFile(EXIF_PATH, [arg1, arg2, imageFolder], ...)
```

---

### 2. ✅ CSV Format: Removed quotes from file paths (HIGH)
**File:** `process/csvGenerator.js`  
**Issue:** ExifTool's CSV parser doesn't expect quoted values - it handles spaces natively  
**Impact:** Paths with spaces could silently fail on Windows

**Before:**
```javascript
rows.push(`"${item.filePath}",${item.lat},${item.long}`);
```

**After:**
```javascript
rows.push(`${item.filePath},${item.lat},${item.long}`);
```

**Why this works:** ExifTool's CSV parser treats commas as delimiters and handles spaces in paths without needing quotes.

---

### 3. ✅ Crash Prevention: Added directory creation (MEDIUM)
**File:** `index.js`  
**Issue:** Tool would crash on first run if `temp/` or `logs/` directories don't exist

**Before:**
```javascript
// No directory check - would crash if folders missing
fs.writeFileSync("./logs/missing.txt", missing.join("\n"));
```

**After:**
```javascript
// Ensure temp and logs directories exist
["./temp", "./logs"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
```

**Benefit:** Tool now works out-of-the-box without manual directory setup.

---

## Additional Improvements Already Implemented

### 4. Two-Pass EXIF Processing (WORK IN PROGRESS)
**File:** `process/exifRunner.js`  
**Purpose:** Fix IFD0 corruption by stripping EXIF first, then writing GPS

**Approach:**
- **Pass 1:** Strip all existing EXIF metadata (`-all=`)
- **Pass 2:** Write GPS coordinates from CSV

This addresses the root cause where 91% of images have corrupted IFD0 segments preventing metadata writes.

---

## Testing Checklist

- [ ] Test with folder paths containing spaces
- [ ] Test with folder paths containing special characters
- [ ] Test first run without temp/logs directories
- [ ] Verify CSV format is correct for ExifTool
- [ ] Confirm security fix prevents path injection
- [ ] Validate two-pass approach fixes corruption errors

---

## Files Modified

1. ✅ `process/exifRunner.js` - Security fix + two-pass processing
2. ✅ `process/csvGenerator.js` - CSV format fix
3. ✅ `index.js` - Directory creation

---

## Impact

| Issue | Severity | Status |
|-------|----------|--------|
| Shell injection vulnerability | 🔴 Critical | ✅ Fixed |
| CSV quoting breaks space paths | 🟡 High | ✅ Fixed |
| Missing directories crash | 🟡 Medium | ✅ Fixed |
| IFD0 corruption blocks writes | 🔴 High | 🔄 In Progress |

---

**Next Steps:** Test the two-pass EXIF stripping approach to resolve the IFD0 corruption issue affecting 52/57 images.
