import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { testRead } from "./testSheets.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

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

// Google Sheets initialization with OAuth support
let sheets;

async function initializeGoogleSheets() {
	try {
		console.log("=== Initializing Google Sheets with OAuth ===");

		if (!process.env.GOOGLE_CREDENTIALS) {
			throw new Error("GOOGLE_CREDENTIALS not found");
		}

		const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
		console.log("Service Account:", credentials.client_email);

		const auth = new google.auth.JWT({
			email: credentials.client_email,
			key: credentials.private_key.replace(/\\n/g, "\n"),
			scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
		});

		console.log("Authorizing with Google...");
		const token = await auth.authorize();
		console.log("✅ Authorization successful!");

		sheets = google.sheets({ version: "v4", auth });

		// Quick test
		const test = await sheets.spreadsheets.values.get({
			spreadsheetId: process.env.GOOGLE_SHEET_ID,
			range: "A1",
		});

		console.log("✅ Sheets API test passed");
		return true;
	} catch (error) {
		console.error("❌ Google Sheets initialization failed:", error.message);

		if (error.message.includes("invalid_grant")) {
			console.log("\n=== TROUBLESHOOTING ===");
			console.log("1. Ensure OAuth Client ID is created");
			console.log("2. Wait 2-3 minutes for OAuth to propagate");
			console.log("3. Share sheet with service account email");
			console.log("4. Check Sheets API is enabled");
		}

		console.log("Switching to demonstration mode...");
		sheets = createMockSheets();
		return false;
	}
}

function createMockSheets() {
	return {
		spreadsheets: {
			values: {
				get: async () => ({
					data: {
						values: [
							["Timestamp", "Organization", "Message"],
							[
								new Date().toISOString(),
								"AU Youth Verification",
								"Configuring OAuth Client ID...",
							],
						],
					},
				}),
			},
		},
	};
}

// Initialize on startup
initializeGoogleSheets();

// ──────────────────────────────────────────────────────────────
// FIXED: Safe date parser – prevents RangeError: Invalid time value
// when Google Sheets timestamp is empty, malformed or invalid
// ──────────────────────────────────────────────────────────────
function safeDateToISO(value) {
	if (!value) return null;

	const str = String(value).trim();
	if (str === "") return null;

	const date = new Date(str);

	if (isNaN(date.getTime())) {
		console.warn(
			`Invalid timestamp in Google Sheet: "${str}" → returning null`,
		);
		return null;
	}

	return date.toISOString();
}

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
		.replace(/\s+/g, " ")
		.replace(/[.,'’"()]/g, "")
		.replace(/\b(mr|ms|mrs|dr|prof|hon|sr|jr|ii|iii|iv)\b/gi, "");
}

function getNameKey(name) {
	const norm = normalizeName(name);
	const parts = norm.split(" ").filter(Boolean);
	if (parts.length === 0) return "";
	if (parts.length === 1) return parts[0];
	return `${parts[0]} ${parts[parts.length - 1]}`;
}

function isLikelyDuplicate(nameA, nameB) {
	if (!nameA || !nameB) return false;

	const keyA = getNameKey(nameA);
	const keyB = getNameKey(nameB);
	if (keyA === keyB) return true;

	const tokensA = normalizeName(nameA).split(" ");
	const tokensB = normalizeName(nameB).split(" ");

	let matches = 0;
	tokensA.forEach((t) => {
		if (tokensB.includes(t)) matches++;
	});

	return matches / Math.max(tokensA.length, tokensB.length) >= 0.7;
}

// Main API endpoint – FIXED VERSION
app.get("/api/applications", async (req, res) => {
	try {
		const sheetData = await testRead();

		if (!sheetData || sheetData.length < 1) {
			return res.status(404).json({ message: "No data found in sheet" });
		}

		const headers = sheetData[0].map((h) => (h || "").trim());
		const headerMap = {};
		headers.forEach((h, i) => {
			if (h) headerMap[h] = i;
		});

		const getValue = (row, headerName) => {
			const col = headerMap[headerName];
			return col !== undefined && row[col] ? String(row[col]).trim() : "";
		};

		const applications = sheetData.slice(1).map((row, index) => {
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

			console.log("Final parsed leadership array (after dedup):");
			leadership.forEach((l, i) => {
				console.log(
					`  ${i + 1}. "${l.name}" | Role: "${l.role || "(none)"}" | Age: ${l.age ?? "?"} | Final: ${l.isFinalDecisionMaker}`,
				);
			});
			console.log(`Total leaders: ${leadership.length}\n`);

			// ──────────────────────────────────────────────────────────────
			// FIXED: Use safeDateToISO instead of direct .toISOString()
			// This prevents crash when timestamp is invalid/empty/malformed
			// Returns null instead → frontend can handle it gracefully
			// ──────────────────────────────────────────────────────────────
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
				submittedAt, // ← safe value now
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

// OAuth status endpoint
app.get("/api/oauth-status", (req, res) => {
	const hasOAuthClient = !!process.env.GOOGLE_CLIENT_ID;
	const hasServiceAccount = !!process.env.GOOGLE_CREDENTIALS;

	let serviceAccountEmail = "Not configured";
	if (hasServiceAccount) {
		try {
			const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
			serviceAccountEmail = creds.client_email;
		} catch (e) {
			serviceAccountEmail = "Error parsing";
		}
	}

	res.json({
		status: "AU Youth Verification System",
		configuration: {
			oauthClientId: hasOAuthClient ? "Configured ✓" : "Missing",
			oauthClientIdPreview: hasOAuthClient
				? process.env.GOOGLE_CLIENT_ID.substring(0, 25) + "..."
				: "N/A",
			serviceAccount: serviceAccountEmail,
			sheetId: process.env.GOOGLE_SHEET_ID ? "Configured ✓" : "Missing",
			sheetName: process.env.GOOGLE_SHEET_NAME || "Not set",
		},
		nextSteps: [
			"1. Finish creating OAuth Client ID in Google Cloud Console",
			"2. Add GOOGLE_CLIENT_ID to Render.com environment variables",
			"3. Wait 2-3 minutes for OAuth to propagate",
			"4. Test: https://au-wgyd-youth-accreditation.onrender.com/api/applications",
		],
		appInfo: {
			url: "https://au-wgyd-youth-accreditation.onrender.com",
			demoLogin: { email: "admin@au.int", password: "admin123" },
			timestamp: new Date().toISOString(),
		},
	});
});

// Setup instructions endpoint
app.get("/api/setup-instructions", (req, res) => {
	const hasApiKey = !!process.env.GOOGLE_API_KEY;
	const hasCredentials = !!process.env.GOOGLE_CREDENTIALS;
	const hasOAuthClient = !!process.env.GOOGLE_CLIENT_ID;

	res.json({
		title: "AU Youth Verification Setup Instructions",
		currentStatus: {
			oauthClientConfigured: hasOAuthClient ? "✓" : "✗",
			serviceAccountConfigured: hasCredentials ? "✓" : "✗",
			apiKeyConfigured: hasApiKey ? "✓" : "✗",
			sheetId: process.env.GOOGLE_SHEET_ID ? "✓" : "✗",
			authenticationMethod: hasOAuthClient
				? "OAuth Client ID"
				: hasApiKey
					? "API Key"
					: hasCredentials
						? "Service Account"
						: "None (Demo Mode)",
		},
		currentAction: "Setting up OAuth Client ID",
		steps: [
			{
				step: 1,
				action: "Complete OAuth Client ID creation",
				details:
					"In Google Cloud Console → Credentials → Create OAuth Client ID",
			},
			{
				step: 2,
				action: "Add to Render.com",
				details:
					"Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables",
			},
			{
				step: 3,
				action: "Wait and test",
				details: "Wait 2-3 minutes, then test /api/oauth-status endpoint",
			},
		],
		testEndpoints: [
			"https://au-wgyd-youth-accreditation.onrender.com/api/oauth-status",
			"https://au-wgyd-youth-accreditation.onrender.com/api/applications",
		],
	});
});

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.json({
		status: "healthy",
		service: "AU Youth Verification System",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
		endpoints: {
			applications: "/api/applications",
			oauthStatus: "/api/oauth-status",
			setup: "/api/setup-instructions",
			health: "/api/health",
		},
	});
});

// React/Vite routing fallback
app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
	const indexPath = path.join(__dirname, "dist", "index.html");
	if (fs.existsSync(indexPath)) {
		res.sendFile(indexPath);
	} else {
		// Helpful response when frontend isn't built yet
		res.status(404).send(
			`Frontend not found on server. To fix:

1) Build the frontend for production and restart the server:
   npm run build && npm start

2) Or run the dev frontend during development and open http://localhost:5173:
   npm run dev

(Alternatively, ensure 'dist/index.html' exists.)`,
		);
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
