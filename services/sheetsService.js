import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Thin service around Google Sheets client initialization and simple read helper.
let sheetsClient = null;

export async function initializeGoogleSheets() {
	try {
		if (!process.env.GOOGLE_CREDENTIALS) {
			throw new Error("GOOGLE_CREDENTIALS environment variable is missing");
		}

		const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
		const auth = new google.auth.JWT({
			email: credentials.client_email,
			key: credentials.private_key.replace(/\\n/g, "\n"),
			scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
		});

		await auth.authorize();
		sheetsClient = google.sheets({ version: "v4", auth });
		console.log("✅ Sheets client initialized");
		return true;
	} catch (err) {
		console.error("Google Sheets initialization failed:", err?.message || err);
		console.log("Switching to mock Sheets client...");
		sheetsClient = createMockSheets();
		return false;
	}
}

export function getSheetsClient() {
	return sheetsClient;
}

export async function getSheetValues(range = "A1:Z") {
	if (!sheetsClient) throw new Error("Sheets client not initialized");
	const spreadsheetId = process.env.GOOGLE_SHEET_ID;
	const sheetName = process.env.GOOGLE_SHEET_NAME;
	if (!spreadsheetId || !sheetName)
		throw new Error("Sheet ID/Name not configured");
	const response = await sheetsClient.spreadsheets.values.get({
		spreadsheetId,
		range: `${sheetName}!${range}`,
		valueRenderOption: "FORMATTED_VALUE",
	});
	return response.data.values;
}

function createMockSheets() {
	return {
		spreadsheets: {
			values: {
				get: async () => ({
					data: {
						values: [
							["Timestamp", "Organization", "Message"],
							[new Date().toISOString(), "AU Youth Verification", "Demo row"],
						],
					},
				}),
			},
		},
	};
}
