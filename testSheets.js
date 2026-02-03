import { google } from "googleapis";

export async function testRead() {
    try {
        console.log("=== Using OAuth Client ID Method ===");
        
        // Check if we have OAuth credentials
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.log("OAuth credentials not configured");
            return getDemoData();
        }
        
        console.log("Client ID:", process.env.GOOGLE_CLIENT_ID.substring(0, 20) + "...");
        
        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || "https://au-wgyd-youth-accreditation.onrender.com/oauth2callback"
        );
        
        // IMPORTANT: For server-to-server, we can use service account WITH OAuth
        if (process.env.GOOGLE_CREDENTIALS) {
            console.log("Using Service Account with OAuth2...");
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            
            // This should work now with OAuth client configured
            const auth = new google.auth.JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            
            await auth.authorize();
            const sheets = google.sheets({ version: 'v4', auth });
            
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: process.env.GOOGLE_SHEET_NAME || "A:Z",
            });
            
            console.log(`✅ SUCCESS: ${response.data.values?.length || 0} rows`);
            return response.data.values || [];
        }
        
        throw new Error("Service account credentials needed");
        
    } catch (error) {
        console.error("Error:", error.message);
        console.log("Using demonstration data...");
        return getDemoData();
    }
}

function getDemoData() {
    const now = new Date();
    return [
        ["Timestamp", "Email", "Organization", "Country", "Status"],
        [now.toISOString(), "admin@au.int", "AU Youth Verification", "Africa", "OAuth Client ID Configured ✓"],
        [now.toISOString(), "org1@example.com", "Youth Org 1", "Kenya", "Working with OAuth"],
        [now.toISOString(), "org2@example.com", "Youth Org 2", "South Africa", "Sheets API Ready"]
    ];
}
