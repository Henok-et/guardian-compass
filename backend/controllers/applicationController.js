import {
	createApplication,
	getApplicationById,
	listApplications,
	updateApplication,
	STATUS_APPROVED,
	STATUS_FLAGGED,
	STATUS_REJECTED,
} from "../models/Application.js";
import { z } from "zod";

export async function listApplicationsHandler(req, res) {
	const user = req.user;
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const filter = {};
		if (user.role === "user") {
			filter.userId = user.id;
		}
		const applications = await listApplications(filter);
		return res.json(applications);
	} catch (err) {
		console.error("Failed to list applications", err);
		return res.status(500).json({ message: "Failed to list applications" });
	}
}

export async function getApplicationHandler(req, res) {
	const user = req.user;
	const { id } = req.params;
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const app = await getApplicationById(id);
	if (!app) {
		return res.status(404).json({ message: "Application not found" });
	}

	if (user.role === "user" && String(app.userId) !== user.id) {
		return res.status(403).json({ message: "Forbidden" });
	}
	return res.json(app);
}

// Removed misplaced code block; authorization is handled inside handler functions

// Zod schema for multi-step form
const ApplicationSchema = z.object({
	organization: z.object({
		legalName: z.string().min(3).max(200),
		registrationNumber: z.string().min(1).max(100),
		country: z.string().min(1).max(100),
		yearEstablished: z.number().int().lte(new Date().getFullYear()),
		organizationType: z.string().min(1).max(100),
		website: z.string().url().max(200),
		socialMedia: z.string().max(200).optional(),
		email: z.string().email().max(200),
		phone: z.string().max(30),
	}),
	executive: z.object({
		fullName: z.string().min(3).max(200),
		dateOfBirth: z.string().min(1).max(30),
		gender: z.string().optional(),
		role: z.string().min(2).max(100),
		phone: z.string().max(30),
		email: z.string().email().max(200),
		idDocument: z.any().optional(),
	}),
	boardMembers: z
		.array(
			z.object({
				fullName: z.string().min(3).max(200),
				dateOfBirth: z.string().min(1).max(30),
				gender: z.string().min(1).max(20),
				role: z.string().min(2).max(100),
				phone: z.string().max(30).optional(),
				email: z.string().email().max(200).optional(),
			}),
		)
		.min(3)
		.max(15),
	governance: z.object({
		decisionAuthority: z.string().min(2).max(200),
		boardSize: z.number().int().min(3),
		governanceDeclaration: z.boolean(),
		leadershipResponsibilityDeclaration: z.boolean(),
	}),
	activities: z.object({
		activitiesDescription: z.string().min(150).max(2000),
		impactDescription: z.string().min(100).max(2000),
		operationalPresence: z.string().min(1).max(100),
		partnerships: z.string().max(1000).optional(),
		verificationLinks: z.string().min(20).max(1000),
		transparencyDeclaration: z.boolean(),
	}),
	legalDeclaration: z.object({
		legalDeclaration: z.boolean(),
		authorization: z.boolean(),
	}),
});

// Sanitize string fields
function sanitizeString(str) {
	return String(str).replace(/[<>]/g, "").trim();
}

// Recursively sanitize all string fields
function deepSanitize(obj) {
	if (Array.isArray(obj)) {
		return obj.map(deepSanitize);
	} else if (typeof obj === "object" && obj !== null) {
		const sanitized = {};
		for (const key in obj) {
			if (typeof obj[key] === "string") {
				sanitized[key] = sanitizeString(obj[key]);
			} else if (typeof obj[key] === "object") {
				sanitized[key] = deepSanitize(obj[key]);
			} else {
				sanitized[key] = obj[key];
			}
		}
		return sanitized;
	}
	return obj;
}

export async function createApplicationHandler(req, res) {
	const user = req.user;
	if (!user || user.role !== "user") {
		return res.status(401).json({ message: "Unauthorized" });
	}

	let payload = req.body || {};
	try {
		payload = ApplicationSchema.parse(payload);
		payload = deepSanitize(payload);
	} catch (err) {
		return res
			.status(400)
			.json({ message: "Validation failed", details: err.errors });
	}

	try {
		const application = await createApplication({
			...payload,
			userId: user.id,
			status: "pending",
			submittedAt: new Date(),
		});
		// Optional: Notify officers/admins (dashboard badge or email)
		// Example: increment dashboard badge, or send email (placeholder)
		// await notifyOfficersOfNewSubmission(application);
		return res.status(201).json(application);
	} catch (err) {
		console.error("Failed to create application", err);
		return res.status(500).json({ message: "Failed to create application" });
	}
}

export async function updateApplicationStatusHandler(req, res) {
	const user = req.user;
	const { id } = req.params;
	const { status } = req.body || {};
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}
	if (![STATUS_APPROVED, STATUS_FLAGGED, STATUS_REJECTED].includes(status)) {
		return res.status(400).json({ message: "Invalid status" });
	}

	try {
		const application = await getApplicationById(id);
		if (!application) {
			return res.status(404).json({ message: "Application not found" });
		}
		// Only admin/officer can update status
		if (user.role === "user") {
			return res.status(403).json({ message: "Forbidden" });
		}

		const updated = await updateApplication(id, { status });
		return res.json(updated);
	} catch (err) {
		console.error("Failed to update application status", err);
		return res
			.status(500)
			.json({ message: "Failed to update application status" });
	}
}
