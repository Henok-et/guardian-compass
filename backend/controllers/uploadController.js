export async function uploadFileHandler(req, res) {
	try {
		// multer-gridfs-storage attaches file info to req.file
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		const { id, filename, contentType, size, metadata } = req.file;

		// Optional: log upload for auditing
		console.log(`User ${req.user.id} uploaded file: ${filename} (${id})`);

		// Respond with safe file info
		return res.json({
			fileId: id.toString(), // convert ObjectId to string
			filename,
			contentType,
			size,
			uploadedBy: metadata?.userId || req.user.id, // track uploader
		});
	} catch (err) {
		console.error("File upload error:", err); // log server-side for debugging
		return res.status(500).json({ message: "Failed to upload file" });
	}
}