import express from "express";
import { getSheetValues } from "../services/sheetsService.js";
import { calculateRisk, isSanctioned } from "../services/riskService.js";
import { readWorkflow, writeWorkflow } from "../utils/workflow.js";

const router = express.Router();

function safeDateToISO(value) {
	if (!value) return null;
	const date = new Date(String(value).trim());
	if (isNaN(date.getTime())) return null;
	return date.toISOString();
}

// Generates a sequential stable ID per sheet row (app-00000001, app-00000002, ...)
const makeRowId = (index) => `app-${String(index + 1).padStart(8, "0")}`;
const makeLegacyId = (index) => `app-${index + 100}`;

router.get("/", async (req, res) => {
	try {
		const sheetData = await getSheetValues("A1:Z");
		if (!sheetData || sheetData.length === 0)
			return res.status(404).json({ message: "No data" });
		const headers = sheetData[0].map((h) => (h || "").trim());
		const headerMap = {};
		headers.forEach((h, i) => {
			if (h) headerMap[h] = i;
		});

		// Build stable IDs that survive row inserts/deletes.
		// Prefer email or registration number, and keep a legacy ID for backwards compatibility.

		const applications = sheetData.slice(1).map((row, index) => {
			// keep existing parsing behavior (use same indexes as original server.js)
			const execName = row[7] ? String(row[7]).trim() : "";
			const execDob = row[8] ? String(row[8]).trim() : "";
			const execRole = row[9] ? String(row[9]).trim() : "";
			const bm1Name = row[11] ? String(row[11]).trim() : "";
			const bm1Dob = row[12] ? String(row[12]).trim() : "";
			const bm1Role = row[13] ? String(row[13]).trim() : "";
			const bm2Name = row[14] ? String(row[14]).trim() : "";
			const bm2Dob = row[15] ? String(row[15]).trim() : "";
			const bm2Role = row[16] ? String(row[16]).trim() : "";
			const bm3Name = row[17] ? String(row[17]).trim() : "";
			const bm3Dob = row[18] ? String(row[18]).trim() : "";
			const bm3Role = row[19] ? String(row[19]).trim() : "";
			const finalDecisionMaker = row[20] ? String(row[20]).trim() : "";

			const leadership = [];
			const seen = new Set();
			const addLeader = (name, dob, role, isExec = false) => {
				const trimmed = (name || "").trim();
				if (!trimmed) return;
				const key = trimmed.toLowerCase();
				if (seen.has(key)) return;
				seen.add(key);
				leadership.push({
					name: trimmed,
					dob: dob || undefined,
					age: safeDateToISO(dob) ? undefined : undefined,
					role: role || (isExec ? "Executive Head" : "Board Member"),
					hasId: true,
					isFinalDecisionMaker: trimmed === finalDecisionMaker.trim(),
				});
			};

			addLeader(execName, execDob, execRole, true);
			addLeader(bm1Name, bm1Dob, bm1Role);
			addLeader(bm2Name, bm2Dob, bm2Role);
			addLeader(bm3Name, bm3Dob, bm3Role);

			const submittedAt = row[0]
				? safeDateToISO(row[0])
				: new Date().toISOString();

			const organizationName = row[2] ? String(row[2]).trim() : "";
			const registrationNumber = row[3] ? String(row[3]).trim() : "";
			const email = row[1] ? String(row[1]).trim() : "";

			const rowId = makeRowId(index);
			const legacyId = makeLegacyId(index);
			const app = {
				id: rowId,
				legacyId,
				organizationName,
				registrationNumber,
				country: row[4] ? String(row[4]).trim() : "",
				city: row[4] ? String(row[4]).trim() : "",
				email,
				phone: "",
				website: row[6] ? String(row[6]).trim() : "",
				leadership,
				missionStatement: row[22] ? String(row[22]).trim() : "",
				yearEstablished: row[5] ? String(row[5]).trim() : "",
				memberCount: row[21] ? Number(String(row[21]).trim()) : 0,
				hasRecentActivityProof: !!row[23],
				submittedAt,
				status: "pending",
			};

			const risk = calculateRisk(app);

			return {
				...app,
				riskAssessment: { score: risk.riskScore, level: risk.riskLevel },
			};
		});

		// merge workflow persisted states (match by stable ID, legacy ID, email, or registration number)
		try {
			const workflow = await readWorkflow();

			// Build quick lookup maps for current applications
			const appsByEmail = new Map();
			const appsByReg = new Map();
			const appsById = new Map();
			const appsByLegacy = new Map();
			applications.forEach((app) => {
				if (app.email) appsByEmail.set(String(app.email).toLowerCase(), app);
				if (app.registrationNumber)
					appsByReg.set(String(app.registrationNumber).toLowerCase(), app);
				appsById.set(app.id, app);
				if (app.legacyId) {
					appsByLegacy.set(app.legacyId, app);
				}
			});

			const resolve = (stored) => {
				if (!stored) return null;
				if (stored.id) {
					const byId = appsById.get(stored.id);
					if (byId) return byId;
				}
				if (stored.email) {
					const byEmail = appsByEmail.get(String(stored.email).toLowerCase());
					if (byEmail) return byEmail;
				}
				if (stored.registrationNumber) {
					const byReg = appsByReg.get(
						String(stored.registrationNumber).toLowerCase(),
					);
					if (byReg) return byReg;
				}
				if (stored.id) {
					const byLegacy = appsByLegacy.get(stored.id);
					if (byLegacy) return byLegacy;
				}
				return null;
			};

			const applyStatus = (list, status) => {
				(list || []).forEach((stored) => {
					const match = resolve(stored);
					if (match) {
						match.status = status;
						match.actionDate = stored.actionDate || new Date().toISOString();
					}
				});
			};

			applyStatus(workflow.verified, "approved");
			applyStatus(workflow.flagged, "flagged");
			applyStatus(workflow.rejected, "rejected");
		} catch (e) {
			console.warn("Failed to merge workflow:", e?.message || e);
		}

		res.json(applications);
	} catch (err) {
		console.error("Error in /api/applications:", err?.stack || err);
		res.status(500).json({ message: "Failed to fetch applications" });
	}
});

// Update workflow status (approved/flagged/rejected)
const updateWorkflowStatus = async (id, status) => {
	const workflow = await readWorkflow();
	const matchesId = (item) =>
		item.id === id ||
		item.legacyId === id ||
		(item.email && item.email.toLowerCase() === id.toLowerCase()) ||
		(item.registrationNumber &&
			item.registrationNumber.toLowerCase() === id.toLowerCase());

	workflow.verified = (workflow.verified || []).filter((a) => !matchesId(a));
	workflow.flagged = (workflow.flagged || []).filter((a) => !matchesId(a));
	workflow.rejected = (workflow.rejected || []).filter((a) => !matchesId(a));

	return { workflow, status };
};

const addToWorkflow = (workflow, status, payload) => {
	const item = {
		id: payload.id,
		legacyId: payload.legacyId,
		email: payload.email,
		registrationNumber: payload.registrationNumber,
		actionDate: payload.actionDate || new Date().toISOString(),
	};
	if (status === "approved") workflow.verified.push(item);
	if (status === "flagged") workflow.flagged.push(item);
	if (status === "rejected") workflow.rejected.push(item);
	return workflow;
};

const createStatusHandler = (status) => async (req, res) => {
	const { id } = req.params;
	try {
		// Load apps to know any metadata for stable matching later
		const sheetData = await getSheetValues("A1:Z");

		const apps = sheetData.slice(1).map((row, index) => {
			const email = row[1] ? String(row[1]).trim() : "";
			const registrationNumber = row[3] ? String(row[3]).trim() : "";
			const rowId = makeRowId(index);
			const legacyId = makeLegacyId(index);
			return {
				id: rowId,
				legacyId,
				email,
				registrationNumber,
			};
		});

		const payload = apps.find((a) => a.id === id);
		// Ensure we always store using the sequential row-based ID where possible.
		const rowId = (() => {
			if (/^app-\d{8}$/.test(id)) return id; // already in correct format
			if (payload) return payload.id; // match the row's id
			// fallback: keep whatever was passed in
			return id;
		})();

		const { workflow } = await updateWorkflowStatus(rowId, status);

		// If we can't find the app in the current sheet snapshot, still store the ID
		// so it can be merged later when the sheet is re-read.
		const safePayload = payload || {
			id: rowId,
			legacyId: id,
			email: "",
			registrationNumber: "",
			actionDate: new Date().toISOString(),
		};
		addToWorkflow(workflow, status, safePayload);

		await writeWorkflow(workflow);
		console.log(
			`[workflow] saved status=${status} for id=${id} (found: ${Boolean(payload)})`,
		);
		res.json({ ok: true });
	} catch (err) {
		console.error(`Failed to update status ${status} for ${id}:`, err);
		res.status(500).json({ message: "Failed to update status" });
	}
};

router.post("/:id/approve", createStatusHandler("approved"));
router.post("/:id/flag", createStatusHandler("flagged"));
router.post("/:id/reject", createStatusHandler("rejected"));

export default router;
