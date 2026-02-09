import {
	Application,
	TrackedApplication,
	RejectedRecord,
} from "@/types/application";

/* eslint-disable @typescript-eslint/no-explicit-any */
class ApplicationTracker {
	private approvedApplications: TrackedApplication[] = [];
	private flaggedApplications: TrackedApplication[] = [];
	private rejectedApplications: TrackedApplication[] = [];
	private rejectedRecords: RejectedRecord[] = [];

	constructor() {
		this.loadFromStorage();
	}

	private loadFromStorage() {
		try {
			const approved = localStorage.getItem("approved_applications");
			const flagged = localStorage.getItem("flagged_applications");
			const rejected = localStorage.getItem("rejected_applications");
			const records = localStorage.getItem("rejected_records");

			if (approved) this.approvedApplications = JSON.parse(approved);
			if (flagged) this.flaggedApplications = JSON.parse(flagged);
			if (rejected) this.rejectedApplications = JSON.parse(rejected);
			if (records) this.rejectedRecords = JSON.parse(records);
		} catch (error) {
			console.error("Error loading from storage:", error);
			this.clearStorage();
		}
	}

	private saveToStorage() {
		try {
			localStorage.setItem(
				"approved_applications",
				JSON.stringify(this.approvedApplications),
			);
			localStorage.setItem(
				"flagged_applications",
				JSON.stringify(this.flaggedApplications),
			);
			localStorage.setItem(
				"rejected_applications",
				JSON.stringify(this.rejectedApplications),
			);
			localStorage.setItem(
				"rejected_records",
				JSON.stringify(this.rejectedRecords),
			);
		} catch (error) {
			console.error("Error saving to storage:", error);
		}
	}

	private clearStorage() {
		this.approvedApplications = [];
		this.flaggedApplications = [];
		this.rejectedApplications = [];
		this.rejectedRecords = [];
	}

	// Track an action
	trackAction(
		application: Application,
		actionType: "approved" | "flagged" | "rejected",
		notes?: string,
	): TrackedApplication {
		const trackedApp: TrackedApplication = {
			...application,
			actionDate: new Date().toISOString(),
			actionType,
			notes,
			status: actionType,
		};

		console.log(
			`[Tracker] Tracking ${actionType} for app ID: ${application.id}, name: ${application.organizationName}`,
		);

		if (actionType === "approved") {
			this.approvedApplications.push(trackedApp);
			// Remove from flagged if it was there
			this.flaggedApplications = this.flaggedApplications.filter(
				(app) => app.id !== application.id,
			);
		} else if (actionType === "flagged") {
			this.flaggedApplications.push(trackedApp);
		} else if (actionType === "rejected") {
			this.rejectedApplications.push(trackedApp);

			const rejectedRecord: RejectedRecord = {
				organizationName: application.organizationName,
				registrationNumber: application.registrationNumber,
				email: application.email,
				phone: application.phone,
				country: application.country,
				rejectedDate: new Date().toISOString(),
				reason: notes,
			};
			this.rejectedRecords.push(rejectedRecord);
		}

		this.saveToStorage();
		return trackedApp;
	}

	// Check for duplicates (stricter logic)
	checkForDuplicates(application: Application): {
		isDuplicate: boolean;
		isStrongDuplicate: boolean;
		previousStatus?: "approved" | "flagged" | "rejected";
		previousDate?: string;
		matchingRecord?: any;
		reason?: string;
	} {
		const normalizedEmail = application.email?.toLowerCase().trim() || "";
		const regNumber =
			application.registrationNumber?.toLowerCase().trim() || "";
		const normalizedName = application.organizationName.toLowerCase().trim();

		console.log(
			`[Tracker] Checking duplicates for: ${application.organizationName} (ID: ${application.id})`,
		);
		console.log(`[Tracker] Email: ${normalizedEmail}, Reg: ${regNumber}`);

		// Helper to find match in a list
		const findMatch = (list: TrackedApplication[], listName: string) => {
			const match = list.find(
				(app) =>
					(normalizedEmail &&
						app.email?.toLowerCase().trim() === normalizedEmail) ||
					(regNumber &&
						app.registrationNumber?.toLowerCase().trim() === regNumber),
			);

			if (match) {
				console.log(
					`[Tracker] Strong match found in ${listName}: ${match.organizationName}`,
				);
				return { match, listName };
			}
			return null;
		};

		// Check approved (strong match only)
		let matchResult = findMatch(this.approvedApplications, "approved");
		if (matchResult) {
			return {
				isDuplicate: true,
				isStrongDuplicate: true,
				previousStatus: "approved",
				previousDate: matchResult.match.actionDate,
				matchingRecord: matchResult.match,
				reason: "Exact match on email or registration number",
			};
		}

		// Check flagged
		matchResult = findMatch(this.flaggedApplications, "flagged");
		if (matchResult) {
			return {
				isDuplicate: true,
				isStrongDuplicate: true,
				previousStatus: "flagged",
				previousDate: matchResult.match.actionDate,
				matchingRecord: matchResult.match,
				reason: "Exact match on email or registration number",
			};
		}

		// Check rejected records
		const rejectedMatch = this.rejectedRecords.find(
			(record) =>
				(normalizedEmail &&
					record.email?.toLowerCase().trim() === normalizedEmail) ||
				(regNumber &&
					record.registrationNumber?.toLowerCase().trim() === regNumber),
		);

		if (rejectedMatch) {
			console.log(
				`[Tracker] Match found in rejected records: ${rejectedMatch.organizationName}`,
			);
			return {
				isDuplicate: true,
				isStrongDuplicate: true,
				previousStatus: "rejected",
				previousDate: rejectedMatch.rejectedDate,
				matchingRecord: rejectedMatch,
				reason: "Exact match on email or registration number",
			};
		}

		// Optional: loose name match as warning only (not duplicate)
		const nameMatch = [
			...this.approvedApplications,
			...this.flaggedApplications,
			...this.rejectedApplications,
		].find(
			(app) => app.organizationName.toLowerCase().trim() === normalizedName,
		);

		if (nameMatch) {
			console.log(
				`[Tracker] Loose name match (warning only): ${nameMatch.organizationName}`,
			);
			return {
				isDuplicate: false,
				isStrongDuplicate: false,
				previousStatus: nameMatch.status as any,
				previousDate: (nameMatch as TrackedApplication).actionDate,
				matchingRecord: nameMatch,
				reason: "Similar organization name (review recommended)",
			};
		}

		return { isDuplicate: false, isStrongDuplicate: false };
	}

	// Get all tracked applications
	getApprovedApplications(): TrackedApplication[] {
		return [...this.approvedApplications];
	}

	getFlaggedApplications(): TrackedApplication[] {
		return [...this.flaggedApplications];
	}

	getRejectedApplications(): TrackedApplication[] {
		return [...this.rejectedApplications];
	}

	// Remove from flagged (when approved from flagged view)
	removeFromFlagged(applicationId: string): void {
		this.flaggedApplications = this.flaggedApplications.filter(
			(app) => app.id !== applicationId,
		);
		this.saveToStorage();
	}

	// Export to Excel
	exportToExcel(type: "approved" | "flagged" | "rejected" | "all"): void {
		let data: any[] = [];

		if (type === "approved" || type === "all") {
			data = [
				...data,
				...this.approvedApplications.map((app) => ({
					Type: "Approved",
					"Organization Name": app.organizationName,
					"Registration Number": app.registrationNumber || "N/A",
					Email: app.email,
					Phone: app.phone || "N/A",
					Country: app.country,
					"Risk Score": app.riskAssessment?.score ?? "N/A",
					"Risk Level": app.riskAssessment?.level ?? "N/A",
					"Action Date": new Date(app.actionDate).toLocaleDateString(),
					Notes: app.notes || "N/A",
					"Application ID": app.id,
				})),
			];
		}

		if (type === "flagged" || type === "all") {
			data = [
				...data,
				...this.flaggedApplications.map((app) => ({
					Type: "Flagged",
					"Organization Name": app.organizationName,
					"Registration Number": app.registrationNumber || "N/A",
					Email: app.email,
					Phone: app.phone || "N/A",
					Country: app.country,
					"Risk Score": app.riskAssessment?.score ?? "N/A",
					"Risk Level": app.riskAssessment?.level ?? "N/A",
					"Action Date": new Date(app.actionDate).toLocaleDateString(),
					Notes: app.notes || "N/A",
					"Flag Reason": app.notes || "Requires investigation",
					"Application ID": app.id,
				})),
			];
		}

		if (type === "rejected" || type === "all") {
			data = [
				...data,
				...this.rejectedApplications.map((app) => ({
					Type: "Rejected",
					"Organization Name": app.organizationName,
					"Registration Number": app.registrationNumber || "N/A",
					Email: app.email,
					Phone: app.phone || "N/A",
					Country: app.country,
					"Risk Score": app.riskAssessment?.score ?? "N/A",
					"Risk Level": app.riskAssessment?.level ?? "N/A",
					"Action Date": new Date(app.actionDate).toLocaleDateString(),
					"Rejection Reason": app.notes || "N/A",
					"Application ID": app.id,
				})),
			];
		}

		this.generateExcel(data);
	}

	private generateExcel(data: any[]): void {
		if (data.length === 0) {
			alert("No data to export");
			return;
		}

		// Create CSV content
		const headers = Object.keys(data[0]);
		const csvRows = [
			headers.join(","),
			...data.map((row) =>
				headers
					.map((header) => {
						const value = row[header];
						const escaped = String(value).replace(/"/g, '""');
						return escaped.includes(",") ? `"${escaped}"` : escaped;
					})
					.join(","),
			),
		];

		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");

		const timestamp = new Date().toISOString().split("T")[0];
		const filename = `applications_${timestamp}.csv`;

		if (window.navigator && (window.navigator as any).msSaveBlob) {
			(window.navigator as any).msSaveBlob(blob, filename);
		} else {
			link.href = URL.createObjectURL(blob);
			link.setAttribute("download", filename);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	// Clear all data (for testing/reset)
	clearAllData(): void {
		this.clearStorage();
		this.saveToStorage();
	}
}

export const applicationTracker = new ApplicationTracker();
