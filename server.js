import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { testRead } from "./testSheets.js"; // function you wrote to read the sheet

import fs from "fs";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME;

// --- Google Sheets auth ---
const auth = new google.auth.GoogleAuth({
	keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// --- Utility to calculate age from DOB ---
function calculateAge(dobString) {
	const dob = new Date(dobString);
	const diff = Date.now() - dob.getTime();
	return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// --- Risk scoring function ---
function calculateRisk(app) {
	const ageScore = Math.min(10, new Date().getFullYear() - app.yearEstablished);
	const idScore =
		(app.leadership.filter((l) => l.hasId).length / app.leadership.length) * 10;
	const activityScore = app.hasRecentActivityProof ? 10 : 0;

	const totalScore = 30 - (ageScore + idScore + activityScore); // higher = higher risk
	let riskLevel = "low";
	if (totalScore >= 20) riskLevel = "high";
	else if (totalScore >= 10) riskLevel = "medium";

	return { riskScore: totalScore, riskLevel };
}

// --- API route to fetch applications ---
app.get("/api/applications", async (req, res) => {
	try {
		const sheetData = await testRead();

		const applications = sheetData.slice(1).map((row, index) => {
			const app = {
				id: `app-${index + 100}`,
				organizationName: row[2],
				registrationNumber: row[3],
				country: row[4],
				city: row[4],
				email: row[1],
				phone: "",
				website: row[6],
				leadership: [
					{
						name: row[7],
						age: calculateAge(row[8]),
						hasId: true,
						role: row[9],
					},
					{
						name: row[11],
						age: calculateAge(row[12]),
						hasId: true,
						role: row[13],
					},
					{
						name: row[15],
						age: calculateAge(row[16]),
						hasId: true,
						role: row[17],
					},
				],
				missionStatement: row[22],
				yearEstablished: new Date(row[5]).getFullYear(),
				memberCount: Number(row[21]),
				hasRecentActivityProof: !!row[23],
				submittedAt: new Date(row[0]).toISOString(),
				status: "pending",
			};

			// ✅ CALCULATE RISK HERE (backend)
			const risk = calculateRisk(app);

			return {
				...app,
				riskAssessment: {
					score: risk.riskScore,
					level: risk.riskLevel,
				},
			};
		});

		res.json(applications);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Failed to fetch applications" });
	}
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
