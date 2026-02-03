import { google } from "googleapis";

export async function testRead() {
    try {
        console.log("testRead() called");
        console.log("GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "Set" : "Missing");
        console.log("GOOGLE_SHEET_NAME:", process.env.GOOGLE_SHEET_NAME ? "Set" : "Missing");
        
        let authClient; // Changed from 'auth' to 'authClient'
        
        // Check if we have JSON credentials (Render.com)
        if (process.env.GOOGLE_CREDENTIALS) {
            console.log("Using GOOGLE_CREDENTIALS from environment");
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            
            // JWT auth returns the client directly
            authClient = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key.replace(/\\n/g, "\n"),
                ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            );
        }
        // Check if we have individual variables (local development)
        else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
            console.log("Using individual environment variables");
            authClient = new google.auth.JWT(
                process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                null,
                process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            );
        }
        // Legacy GoogleAuth approach (if you have a file locally)
        else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            console.log("Using GoogleAuth with keyFile");
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
                scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
            });
            authClient = await auth.getClient(); // This needs .getClient()
        }
        else {
            throw new Error("No Google authentication method found");
        }

        const sheets = google.sheets({ version: "v4", auth: authClient });

        console.log(`Fetching sheet: ${process.env.GOOGLE_SHEET_ID}, range: ${process.env.GOOGLE_SHEET_NAME}`);
        
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: process.env.GOOGLE_SHEET_NAME,
        });

        console.log("Sheet data fetched successfully, rows:", res.data.values?.length || 0);
        return res.data.values || [];
        
    } catch (error) {
        console.error("Error in testRead():", error.message);
        console.error("Full error:", error);
        throw error;
    }
}
