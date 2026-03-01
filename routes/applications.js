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

			const app = {
				id: `app-${index + 100}`,
				organizationName: row[2] ? String(row[2]).trim() : "",
				registrationNumber: row[3] ? String(row[3]).trim() : "",
				country: row[4] ? String(row[4]).trim() : "",
				city: row[4] ? String(row[4]).trim() : "",
				email: row[1] ? String(row[1]).trim() : "",
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

		// merge workflow persisted states
		try {
			const workflow = await readWorkflow();
			const verifiedIds = new Set((workflow.verified || []).map((a) => a.id));
			const flaggedIds = new Set((workflow.flagged || []).map((a) => a.id));
			const rejectedIds = new Set((workflow.rejected || []).map((a) => a.id));
			for (const a of applications) {
				if (verifiedIds.has(a.id)) a.status = "approved";
				if (flaggedIds.has(a.id)) a.status = "flagged";
				if (rejectedIds.has(a.id)) a.status = "rejected";
			}
		} catch (e) {
			console.warn("Failed to merge workflow:", e?.message || e);
		}

		res.json(applications);
	} catch (err) {
		console.error("Error in /api/applications:", err?.stack || err);
		res.status(500).json({ message: "Failed to fetch applications" });
	}
});

export default router;
