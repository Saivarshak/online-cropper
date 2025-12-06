const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");

const app = express();

// Allow cross-origin
app.use(cors());
app.use(express.json());

// Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("trimmed")) fs.mkdirSync("trimmed");

// Serve trimmed files
app.use("/trimmed", express.static(path.join(__dirname, "trimmed")));

// Health check
app.get("/", (req, res) => {
  res.send("Video Trimmer Backend Running");
});

// Configure Multer
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".mp4");
  }
});

const upload = multer({ storage });

/* ======================================================
   1) UPLOAD API 
   Sends file -> returns filename
====================================================== */
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  res.json({
    success: true,
    filename: req.file.filename
  });
});

/* ======================================================
   2) TRIM API  
   Frontend sends:
   - video: <file>
   - start: seconds
   - end: seconds
====================================================== */
app.post("/trim", upload.single("video"), (req, res) => {
  const { start, end } = req.body;

  // Must receive a file
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No video provided for trimming" });
  }

  // Ensure time values exist
  if (start === undefined || end === undefined) {
    return res.status(400).json({ success: false, error: "Missing start or end time" });
  }

  const inputPath = path.join(__dirname, "uploads", req.file.filename);
  const outputName = "trim-" + Date.now() + ".mp4";
  const outputPath = path.join(__dirname, "trimmed", outputName);

  // Build ffmpeg trim command
  const command = `"${ffmpegPath}" -i "${inputPath}" -ss ${start} -to ${end} -c copy "${outputPath}"`;

  exec(command, err => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    // Frontend uses blob(), so send the file directly
    res.sendFile(outputPath);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
