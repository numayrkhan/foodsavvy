// server/routes/admin/uploads.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}${ext}`);
  },
});

// Limit file size to 5MB, accept only images
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype);
    cb(
      allowed ? null : new Error("Only PNG, JPG, WEBP, or GIF images allowed"),
      allowed
    );
  },
});

// POST /api/admin/uploads
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return relative path for DB storage
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
