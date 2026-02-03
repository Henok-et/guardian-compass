import { google } from "googleapis";

export async function testRead() {
    try {
        console.log("=== Using OAuth Client ID Method ===");
        
        // Check if we have OAuth credentials
        if (process.env.GOOGLE_CLIENT_ID) {
            console.log("OAuth Client ID detected:", process.env.GOOGLE_CLIENT_ID.substring(0, 20) + "...");
        }
        
        // We need service account credentials for server-to-server
        if (!process.env.GOOGLE_CREDENTIALS) {
            console.log("Service account credentials not configured");
            return getDemoData();
        }
        
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        console.log("Service Account:", credentials.client_email);
        
        // Now that OAuth Client ID is configured, JWT should work
        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        
        console.log("Authorizing...");
        await auth.authorize();
        console.log("✅ Authorization successful!");
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: process.env.GOOGLE_SHEET_NAME || "A:Z",
        });
        
        const rows = response.data.values || [];
        console.log(`✅ SUCCESS: Retrieved ${rows.length} rows from Google Sheets`);
        
        if (rows.length > 0) {
            console.log("First row headers:", rows[0]);
        }
        
        return rows;
        
    } catch (error) {
        console.error("❌ Error reading Google Sheets:", error.message);
        
        if (error.message.includes("invalid_grant")) {
            console.log("\n=== OAUTH SETUP REQUIRED ===");
            console.log("1. Finish creating OAuth Client ID");
            console.log("2. Add GOOGLE_CLIENT_ID to Render.com");
            console.log("3. Wait 2-3 minutes");
            console.log("4. Share sheet with service account");
        }
        
        console.log("Using demonstration data...");
        return getDemoData();
    }
}

function getDemoData() {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    return [
        ["Timestamp", "Email", "Organization", "Country", "Status"],
        [timestamp, "admin@au.int", "AU Youth Verification", "Africa", "Configuring OAuth Client ID..."],
        [timestamp, "test@example.com", "Demo Youth Org", "Kenya", "Complete OAuth setup in Google Cloud"],
        [timestamp, "user@test.org", "Test Organization", "South Africa", "Add OAuth credentials to Render.com"]
    ];
}
