import {
	createApplication,
	getApplicationById,
	listApplications,
	updateApplication,
	STATUS_APPROVED,
	STATUS_FLAGGED,
	STATUS_REJECTED,
} from "../models/Application.js";

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

export async function createApplicationHandler(req, res) {
	const user = req.user;
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const payload = req.body || {};

	// Validate minimum required fields
	const required = [
		"email",
		"legalNameOfOrganization",
		"registrationNumber",
		"countryOfRegistration",
		"yearEstablished",
		"officialWebsite",
		"executiveHead",
		"boardMembers",
		"totalBoardMembers",
		"activitiesLast12Months",
		"proofUpload",
		"confirmationYouthAgeRange",
		"legalDeclaration",
	];

	for (const prop of required) {
		if (payload[prop] === undefined || payload[prop] === null) {
			return res
				.status(400)
				.json({ message: `Missing application field: ${prop}` });
		}
	}

	try {
		const application = await createApplication({
			...payload,
			userId: user.id,
		});
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
