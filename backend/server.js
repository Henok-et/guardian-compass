import "./loadEnv.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { fileURLToPath } from "url";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import { connectDb } from "./utils/mongo.js";
import { ensureUserIndexes } from "./models/User.js";
import { ensureApplicationIndexes } from "./models/Application.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Log unhandled promise rejections to prevent silent crashes
process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Rejection:", reason);
});

// Catch unexpected runtime errors before Node exits
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});

// Trust proxy headers so correct client IP is detected behind load balancers
app.set("trust proxy", 1);

// Adds security headers to protect against XSS, clickjacking, and MIME attacks
app.use(helmet());

// Enables cross-origin requests from the frontend
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "*",
	}),
);

// Limits JSON body size to prevent payload abuse and memory attacks
app.use(express.json({ limit: "10mb" }));

// Rate limiter protects API from brute force, bots, and request flooding
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	message: { message: "Too many requests. Please try again later." },
});

app.use("/api", apiLimiter);

// Authentication routes (login, register, email verification)
app.use("/api/auth", authRoutes);

// User management routes (profile, roles, admin controls)
app.use("/api/users", userRoutes);

// Application submission routes for platform registrations
app.use("/api/applications", applicationRoutes);

// File upload routes for ID verification and document uploads
app.use("/api/upload", uploadRoutes);

// Health endpoint used for uptime monitoring and server checks
app.get("/api/health", (req, res) => {
	res.json({
		ok: true,
		timestamp: new Date().toISOString(),
	});
});

// Serve compiled frontend files
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// SPA fallback so React routing works without server routes
app.use((req, res, next) => {
	if (req.path.startsWith("/api")) return next();
	res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Global error handler prevents server crashes and standardizes API errors
app.use((err, req, res, next) => {
	console.error("Server Error:", err);
	res.status(err.status || 500).json({
		message: err.message || "Internal server error",
	});
});

// Initialize database and start server
async function start() {
	try {
		await connectDb();
		await ensureUserIndexes();
		await ensureApplicationIndexes();
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Failed to initialize backend:", err);
		process.exit(1);
	}

	const HOST = process.env.HOST || "0.0.0.0";

	app.listen(PORT, HOST, () => {
		console.log(`Server listening on http://${HOST}:${PORT}`);
	});
}

start();
