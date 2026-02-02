import "dotenv/config";
import { google } from "googleapis";

export async function testRead() {
	const auth = new google.auth.GoogleAuth({
		keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});

	const client = await auth.getClient();
	const sheets = google.sheets({ version: "v4", auth: client });

	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: process.env.GOOGLE_SHEET_ID,
		range: `${process.env.GOOGLE_SHEET_NAME}!A1:Z1000`,
	});

	return res.data.values; // ✅ THIS IS CRITICAL
}
