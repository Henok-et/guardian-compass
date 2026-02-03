import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { testRead } from "./testSheets.js";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve Vite build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME;

/// Google Sheets auth - Updated for Render.com environment
let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS) {
        // For Render.com - parse JSON from environment variable
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key.replace(/\\n/g, "\n"),
            ["https://www.googleapis.com/auth/spreadsheets"]
        );
    } else {
        // For local development - use individual variables
        const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        auth = new google.auth.JWT(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            privateKey.replace(/\\n/g, "\n"),
            ["https://www.googleapis.com/auth/spreadsheets"]
        );
    }
    console.log("Google authentication initialized successfully");
} catch (error) {
    console.error("Failed to initialize Google auth:", error.message);
    console.error("Error details:", error);
    process.exit(1);
}

const sheets = google.sheets({ version: "v4", auth });

const sheets = google.sheets({ version: "v4", auth });

// Calculate age from DOB (expects DD/MM/YYYY format)
function calculateAge(dobString) {
	if (!dobString) return undefined;
	const [day, month, year] = dobString.split("/").map(Number);
	if (!day || !month || !year) return undefined;

	const birthDate = new Date(year, month - 1, day);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
	return age >= 0 ? age : undefined;
}

// Simple risk scoring (you can expand this later)
function calculateRisk(app) {
	const ageScore = Math.min(
		10,
		new Date().getFullYear() - (app.yearEstablished || 2000),
	);
	const idScore =
		(app.leadership.filter((l) => l.hasId).length /
			(app.leadership.length || 1)) *
		10;
	const activityScore = app.hasRecentActivityProof ? 10 : 0;

	const totalScore = 30 - (ageScore + idScore + activityScore);
	let riskLevel = "low";
	if (totalScore >= 20) riskLevel = "high";
	else if (totalScore >= 10) riskLevel = "medium";

	return { riskScore: Math.max(0, totalScore), riskLevel };
}

// General name normalization for duplicate detection
function normalizeName(name) {
	if (!name) return "";
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ") // normalize spaces
		.replace(/[.,'’"()]/g, "") // remove punctuation
		.replace(/\b(mr|ms|mrs|dr|prof|hon|sr|jr|ii|iii|iv)\b/gi, ""); // remove titles/suffixes
}

// Get a simple key for deduplication (first + last name)
function getNameKey(name) {
	const norm = normalizeName(name);
	const parts = norm.split(" ").filter(Boolean);
	if (parts.length === 0) return "";
	if (parts.length === 1) return parts[0];
	return `${parts[0]} ${parts[parts.length - 1]}`;
}

// Check if two names are likely the same person
function isLikelyDuplicate(nameA, nameB) {
	if (!nameA || !nameB) return false;

	const keyA = getNameKey(nameA);
	const keyB = getNameKey(nameB);
	if (keyA === keyB) return true;

	// Extra token overlap check
	const tokensA = normalizeName(nameA).split(" ");
	const tokensB = normalizeName(nameB).split(" ");

	let matches = 0;
	tokensA.forEach((t) => {
		if (tokensB.includes(t)) matches++;
	});

	return matches / Math.max(tokensA.length, tokensB.length) >= 0.7;
}

// Main API endpoint
app.get("/api/applications", async (req, res) => {
	try {
		const sheetData = await testRead();

		if (!sheetData || sheetData.length < 1) {
			return res.status(404).json({ message: "No data found in sheet" });
		}

		// Headers from first row
		const headers = sheetData[0].map((h) => (h || "").trim());

		// Header → column index map
		const headerMap = {};
		headers.forEach((h, i) => {
			if (h) headerMap[h] = i;
		});

		const getValue = (row, headerName) => {
			const col = headerMap[headerName];
			return col !== undefined && row[col] ? String(row[col]).trim() : "";
		};

		const applications = sheetData.slice(1).map((row, index) => {
			// slice(1) skips row 1 if it's junk/empty
			// Use 0-based column indices (A=0, B=1, ..., Z=25)
			const execName = row[7] ? String(row[7]).trim() : ""; // H
			const execDob = row[8] ? String(row[8]).trim() : ""; // I
			const execRole = row[9] ? String(row[9]).trim() : ""; // J

			const bm1Name = row[11] ? String(row[11]).trim() : ""; // L
			const bm1Dob = row[12] ? String(row[12]).trim() : ""; // M
			const bm1Role = row[13] ? String(row[13]).trim() : ""; // N

			const bm2Name = row[14] ? String(row[14]).trim() : ""; // O
			const bm2Dob = row[15] ? String(row[15]).trim() : ""; // P
			const bm2Role = row[16] ? String(row[16]).trim() : ""; // Q

			const bm3Name = row[17] ? String(row[17]).trim() : ""; // R
			const bm3Dob = row[18] ? String(row[18]).trim() : ""; // S
			const bm3Role = row[19] ? String(row[19]).trim() : ""; // T

			const finalDecisionMaker = row[20] ? String(row[20]).trim() : ""; // U

			// ────────────── DEBUG: Log raw extracted values ──────────────
			console.log(
				`\n=== Processing row ${index + 2} - ${row[2] || "Unnamed"} (ID: app-${index + 100}) ===`,
			);
			console.log("Raw extracted leadership fields:");
			console.log(
				`  Exec: "${execName}" | DOB: "${execDob}" | Role: "${execRole}"`,
			);
			console.log(
				`  BM1: "${bm1Name}" | DOB: "${bm1Dob}" | Role: "${bm1Role}"`,
			);
			console.log(
				`  BM2: "${bm2Name}" | DOB: "${bm2Dob}" | Role: "${bm2Role}"`,
			);
			console.log(
				`  BM3: "${bm3Name}" | DOB: "${bm3Dob}" | Role: "${bm3Role}"`,
			);
			console.log(`  Final decision maker: "${finalDecisionMaker}"`);

			// Build leadership with deduplication (keep your existing addLeader logic)
			const leadership = [];
			const seenNames = new Set();

			const addLeader = (name, dob, role, isExec = false) => {
				if (!name?.trim()) return;

				const trimmed = name.trim();
				const key = getNameKey(trimmed);

				let isDuplicate = seenNames.has(key);

				if (!isDuplicate) {
					for (const existing of leadership) {
						if (isLikelyDuplicate(trimmed, existing.name)) {
							isDuplicate = true;
							console.log(
								`Near-duplicate detected: "${trimmed}" ~ "${existing.name}"`,
							);
							break;
						}
					}
				}

				if (isDuplicate) return;

				seenNames.add(key);

				leadership.push({
					name: trimmed,
					dob: dob || undefined,
					age: calculateAge(dob),
					role: role || (isExec ? "Executive Head" : "Board Member"),
					hasId: true,
					isFinalDecisionMaker: trimmed === finalDecisionMaker.trim(),
				});
			};

			addLeader(execName, execDob, execRole, true);
			addLeader(bm1Name, bm1Dob, bm1Role);
			addLeader(bm2Name, bm2Dob, bm2Role);
			addLeader(bm3Name, bm3Dob, bm3Role);

			// Debug final result
			console.log("Final parsed leadership array (after dedup):");
			leadership.forEach((l, i) => {
				console.log(
					`  ${i + 1}. "${l.name}" | Role: "${l.role || "(none)"}" | Age: ${l.age ?? "?"} | Final: ${l.isFinalDecisionMaker}`,
				);
			});
			console.log(`Total leaders: ${leadership.length}\n`);

			// Rest of your app object construction remains the same...
			const app = {
				id: `app-${index + 100}`,
				organizationName: row[2] ? String(row[2]).trim() : "",
				registrationNumber: row[3] ? String(row[3]).trim() : "",
				country: row[4] ? String(row[4]).trim() : "",
				city: row[4] ? String(row[4]).trim() : "", // same as country for now
				email: row[1] ? String(row[1]).trim() : "",
				phone: "",
				website: row[6] ? String(row[6]).trim() : "",
				leadership,
				missionStatement: row[22] ? String(row[22]).trim() : "",
				yearEstablished: row[5] ? String(row[5]).trim() : "",
				memberCount: row[21] ? Number(String(row[21]).trim()) : 0,
				hasRecentActivityProof: !!row[23],
				submittedAt: row[0]
					? new Date(String(row[0])).toISOString()
					: new Date().toISOString(),
				status: "pending",
			};

			const risk = calculateRisk(app);

			return {
				...app,
				riskAssessment: {
					score: risk.riskScore,
					level: risk.riskLevel,
				},
			};
		});

		console.log("[SERVER] Sending to client - count:", applications.length);
		console.log(
			"[SERVER] Org names being sent:",
			applications.map((a) => a.organizationName),
		);
		console.log(
			"[SERVER] Leader counts:",
			applications.map((a) => a.leadership.length),
		);

		res.json(applications);
	} catch (error) {
		console.error("Error fetching applications:", error);
		res.status(500).json({ message: "Failed to fetch applications" });
	}
});

// React/Vite routing fallback
app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
	res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
