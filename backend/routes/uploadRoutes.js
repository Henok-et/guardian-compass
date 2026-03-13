import express from "express";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { authenticateToken } from "../middleware/auth.js";
import { uploadFileHandler } from "../controllers/uploadController.js";
import path from "path";
import sanitize from "sanitize-filename"; // npm i sanitize-filename

const router = express.Router();

// ──────────────────────────────────────────────
// Validate uploaded file: allow only images and limit size to 3MB
// ──────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
	const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
	const ext = path.extname(file.originalname).toLowerCase();

	// Ensure both MIME type and file extension match allowed types
	if (
		!allowedMimes.includes(file.mimetype) ||
		![".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)
	) {
		return cb(
			new Error("Only image uploads are allowed (jpg, jpeg, png, gif, webp)"),
		);
	}

	cb(null, true);
};

// ──────────────────────────────────────────────
// GridFS Storage configuration
// ──────────────────────────────────────────────
const storage = new GridFsStorage({
	url: process.env.MONGODB_URI || process.env.MONGO_URI,
	options: { useNewUrlParser: true, useUnifiedTopology: true },
	file: (req, file) => {
		const safeName = sanitize(file.originalname); // remove unsafe characters
		const userId = req.user?.id || "anonymous";

		return {
			filename: `${Date.now()}-${safeName}`, // timestamp + sanitized filename
			bucketName: "uploads",
			metadata: { userId }, // attach userId to metadata for auditing
		};
	},
});

// ──────────────────────────────────────────────
// Multer middleware: enforce file filter and size limit
// ──────────────────────────────────────────────
const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
});

// ──────────────────────────────────────────────
// POST /api/upload
// Authenticate user → validate single file → handle upload
// ──────────────────────────────────────────────
router.post("/", authenticateToken, upload.single("file"), uploadFileHandler);

// ──────────────────────────────────────────────
// Export router
// ──────────────────────────────────────────────
export default router;
