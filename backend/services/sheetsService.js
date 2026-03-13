import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Thin service around Google Sheets client initialization and simple read helper.
let sheetsClient = null;

export async function initializeGoogleSheets() {
	try {
		let credentialsRaw = process.env.GOOGLE_CREDENTIALS;

		if (!credentialsRaw && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
			// If a path is provided, load that file.
			const keyPath = path.resolve(
				process.cwd(),
				process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
			);
			if (fs.existsSync(keyPath)) {
				credentialsRaw = fs.readFileSync(keyPath, "utf8");
			}
		}

		if (!credentialsRaw) {
			throw new Error(
				"GOOGLE_CREDENTIALS (JSON) or GOOGLE_SERVICE_ACCOUNT_KEY (path) is required",
			);
		}

		let credentials;
		try {
			credentials = JSON.parse(credentialsRaw);
		} catch (err) {
			throw new Error(
				"Failed to parse GOOGLE_CREDENTIALS JSON: " + err.message,
			);
		}

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
