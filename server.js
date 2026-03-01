import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { initializeGoogleSheets } from "./services/sheetsService.js";
import applicationsRouter from "./routes/applications.js";
import { readWorkflow, writeWorkflow } from "./utils/workflow.js";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────────────────────
// Global error handling for uncaught issues
// ──────────────────────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	// Optionally exit process.exit(1) in production
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err.stack);
	// Optionally process.exit(1)
});

// ──────────────────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve Vite build (frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

// ──────────────────────────────────────────────────────────────
// Startup: Initialize Google Sheets
// ──────────────────────────────────────────────────────────────
console.log("Starting AU Youth Registrar server...");

(async () => {
	try {
		await initializeGoogleSheets();
		console.log("Google Sheets initialized successfully");
	} catch (err) {
		console.error(
			"Google Sheets initialization failed:",
			err.message,
			err.stack,
		);
		// Continue anyway – don't crash server
	}
})();

// ──────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────
app.use("/api/applications", applicationsRouter);

// SendGrid notification endpoint with beautiful HTML templates
app.post("/api/applications/:id/notify", async (req, res) => {
	const { id } = req.params;
	const { to, status, extra } = req.body || {};

	// Validate input
	if (
		!to ||
		!status ||
		!["approved", "flagged", "rejected"].includes(status.toLowerCase())
	) {
		return res
			.status(400)
			.json({ message: "Missing or invalid 'to' or 'status'" });
	}

	// Env check
	if (!process.env.SENDGRID_API_KEY || !process.env.NOTIFY_FROM) {
		return res
			.status(501)
			.json({ message: "Email notifications not configured" });
	}

	try {
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);

		const statusLower = status.toLowerCase();
		const orgName = extra?.orgName || "Applicant";
		const currentYear = new Date().getFullYear();

		// Subject lines
		const subjectMap = {
			approved: `✅ Approved: ${orgName} – AU Youth Organization Registration`,
			flagged: `⏳ Update: ${orgName} – AU Youth Organization Application`,
			rejected: `ℹ️ Update on ${orgName} – AU Youth Organization Registration`,
		};

		// Plain text fallback
		const textMap = {
			approved: `Dear ${orgName},\n\nCongratulations!\n\nYour organization application (ID: ${id}) has been APPROVED.\n\nYou have successfully passed to the next step. A representative from the AU Youth Department will contact you soon with further instructions.\n\nThank you for your commitment to youth development in Africa.\n\nBest regards,\nAU Youth Division Registrar Team`,
			flagged: `Dear ${orgName},\n\nThank you for submitting your organization application (ID: ${id}).\n\nYour application is currently UNDER REVIEW.\n\nWe are carefully assessing all submissions. You will be contacted soon with any additional information needed or the outcome.\n\nWe appreciate your patience.\n\nBest regards,\nAU Youth Division Registrar Team`,
			rejected: `Dear ${orgName},\n\nThank you for submitting your organization application (ID: ${id}).\n\nAfter careful review, we are unable to approve your application at this time.\n\nWe encourage you to apply again in the future if circumstances change.\n\nBest wishes,\nAU Youth Division Registrar Team`,
		};

		// Professional HTML templates with AU branding
		const htmlMap = {
			approved: `
				<!DOCTYPE html>
				<html>
				<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
				<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4">
					<div style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
						<div style="background-color:#1e3c72;padding:25px 20px;text-align:center">
							<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300">African Union</h1>
							<h2 style="color:#ffb347;margin:5px 0 0;font-size:20px;font-weight:400">Youth Division</h2>
						</div>
						<div style="padding:30px 25px">
							<p style="font-size:18px;color:#1e3c72;margin-top:0"><strong>Dear ${orgName},</strong></p>
							<p style="font-size:16px">Congratulations!</p>
							<div style="background-color:#e8f5e9;border-left:6px solid #28a745;padding:15px;margin:20px 0">
								<p style="margin:0;font-weight:bold;color:#155724">Your organization application <strong>(ID: ${id})</strong> has been <span style="color:#28a745;font-size:18px">✓ APPROVED</span></p>
							</div>
							<p>You have successfully passed to the next step of the accreditation process.</p>
							<div style="background-color:#f8f9fa;border-radius:6px;padding:15px;margin:20px 0">
								<p style="margin:0 0 10px;font-weight:bold">What happens next?</p>
								<ul style="margin:0;padding-left:20px">
									<li>A representative will contact you within 5–7 business days</li>
									<li>You will receive further instructions for the next phase</li>
									<li>Your organization will be listed in the AU Youth Directory after final verification</li>
								</ul>
							</div>
							<p>Thank you for your commitment to youth development in Africa. We look forward to working with you.</p>
							<div style="margin-top:30px;padding-top:20px;border-top:1px solid #dee2e6">
								<p style="margin:0">Best regards,</p>
								<p style="margin:5px 0 0"><strong>AU Youth Division Registrar Team</strong></p>
								<p style="margin:20px 0 0;font-size:14px;color:#6c757d">
									African Union Commission<br>Addis Ababa, Ethiopia<br>youth.africa-union.org
								</p>
							</div>
						</div>
						<div style="background-color:#f8f9fa;text-align:center;padding:15px;font-size:12px;color:#6c757d;border-top:1px solid #dee2e6">
							<p style="margin:0">This is an automated message from the AU Youth Verification System. Please do not reply.</p>
							<p style="margin:5px 0 0">© ${currentYear} African Union – All rights reserved</p>
						</div>
					</div>
				</body>
				</html>
			`,
			flagged: `
				<!DOCTYPE html>
				<html>
				<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
				<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4">
					<div style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
						<div style="background-color:#1e3c72;padding:25px 20px;text-align:center">
							<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300">African Union</h1>
							<h2 style="color:#ffb347;margin:5px 0 0;font-size:20px;font-weight:400">Youth Division</h2>
						</div>
						<div style="padding:30px 25px">
							<p style="font-size:18px;color:#1e3c72;margin-top:0"><strong>Dear ${orgName},</strong></p>
							<p>Thank you for submitting your organization application <strong>(ID: ${id})</strong>.</p>
							<div style="background-color:#fff3cd;border-left:6px solid #ffc107;padding:15px;margin:20px 0">
								<p style="margin:0;font-weight:bold;color:#856404">Your application is currently <span style="color:#856404;">UNDER REVIEW</span></p>
							</div>
							<p>We are carefully assessing all submissions. Our team will contact you soon if:</p>
							<ul style="margin:10px 0 20px;padding-left:20px">
								<li>Additional information is needed</li>
								<li>Clarification on documents is required</li>
								<li>A decision has been reached</li>
							</ul>
							<p>We appreciate your patience and support for the AU Youth agenda.</p>
							<div style="margin-top:30px;padding-top:20px;border-top:1px solid #dee2e6">
								<p style="margin:0">Best regards,</p>
								<p style="margin:5px 0 0"><strong>AU Youth Division Registrar Team</strong></p>
							</div>
						</div>
						<div style="background-color:#f8f9fa;text-align:center;padding:15px;font-size:12px;color:#6c757d;border-top:1px solid #dee2e6">
							<p style="margin:0">This is an automated message from the AU Youth Verification System.</p>
							<p style="margin:5px 0 0">© ${currentYear} African Union</p>
						</div>
					</div>
				</body>
				</html>
			`,
			rejected: `
				<!DOCTYPE html>
				<html>
				<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
				<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4">
					<div style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
						<div style="background-color:#1e3c72;padding:25px 20px;text-align:center">
							<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300">African Union</h1>
							<h2 style="color:#ffb347;margin:5px 0 0;font-size:20px;font-weight:400">Youth Division</h2>
						</div>
						<div style="padding:30px 25px">
							<p style="font-size:18px;color:#1e3c72;margin-top:0"><strong>Dear ${orgName},</strong></p>
							<p>Thank you for submitting your organization application <strong>(ID: ${id})</strong>.</p>
							<div style="background-color:#f8d7da;border-left:6px solid #dc3545;padding:15px;margin:20px 0">
								<p style="margin:0;font-weight:bold;color:#721c24">After careful review, we are unable to approve your application at this time.</p>
							</div>
							<p>We encourage you to apply again in the future if:</p>
							<ul style="margin:10px 0 20px;padding-left:20px">
								<li>Your organization's circumstances change</li>
								<li>You have additional supporting information</li>
								<li>Your organization meets updated criteria</li>
							</ul>
							<p>If you believe this decision was made in error, you may contact the AU Youth Division at <a href="mailto:youth@au.int" style="color:#1e3c72">youth@au.int</a> for clarification.</p>
							<div style="margin-top:30px;padding-top:20px;border-top:1px solid #dee2e6">
								<p style="margin:0">Best wishes,</p>
								<p style="margin:5px 0 0"><strong>AU Youth Division Registrar Team</strong></p>
							</div>
						</div>
						<div style="background-color:#f8f9fa;text-align:center;padding:15px;font-size:12px;color:#6c757d;border-top:1px solid #dee2e6">
							<p style="margin:0">This is an automated message from the AU Youth Verification System.</p>
							<p style="margin:5px 0 0">© ${currentYear} African Union</p>
						</div>
					</div>
				</body>
				</html>
			`,
		};

		// Enhanced email message with proper sender name and reply-to
		const msg = {
			to,
			from: {
				email: process.env.NOTIFY_FROM,
				name: "AU Youth Division",
			},
			replyTo: "youth@au.int",
			subject: subjectMap[statusLower] || `Update on Application ${id}`,
			text: textMap[statusLower] || `Status update for application ${id}`,
			html: htmlMap[statusLower] || `<p>${textMap[statusLower]}</p>`,
		};

		await sgMail.send(msg);
		return res.json({ success: true, message: "Notification sent" });
	} catch (e) {
		console.error("SendGrid full error details:", {
			message: e.message,
			response: e.response ? e.response.body : null,
			stack: e.stack,
			code: e.code,
			statusCode: e.response?.statusCode,
		});
		return res
			.status(500)
			.json({ success: false, message: "Failed to send email" });
	}
});

// ──────────────────────────────────────────────────────────────
// Start the server
// ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
