const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve current folder as static root (because index.html is here)
app.use(express.static(__dirname));

// Homepage route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Storage settings
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    res.json({
        success: true,
        url: "/uploads/" + req.file.filename
    });
});

// Trim route
app.post("/trim", (req, res) => {
    const { filename, start, end } = req.body;

    if (!filename) {
        return res.json({ success: false, error: "Filename missing" });
    }

    const inputPath = path.join(__dirname, "uploads", filename);
    const outputPath = path.join(__dirname, "trimmed", "trim-" + Date.now() + ".mp4");

    const command = `"${ffmpegPath}" -i "${inputPath}" -ss ${start} -to ${end} -c copy "${outputPath}"`;

    exec(command, (error) => {
        if (error) {
            return res.json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            url: "/trimmed/" + path.basename(outputPath)
        });
    });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});
