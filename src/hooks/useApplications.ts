import { useState, useEffect, useCallback } from "react";
import {
	ApplicationData,
	calculateRiskScore,
	RiskAssessment,
} from "@/lib/riskScoring";

export interface ApplicationWithRisk extends ApplicationData {
	riskAssessment: RiskAssessment;
}

const VERIFIED_KEY = "au_verified_organizations";
const FLAGGED_KEY = "au_flagged_applications";
const REJECTED_KEY = "au_rejected_applications";
// We no longer use STORAGE_KEY for full list — only workflow states

export function useApplications() {
	const [applications, setApplications] = useState<ApplicationWithRisk[]>([]);
	const [verifiedOrgs, setVerifiedOrgs] = useState<ApplicationWithRisk[]>([]);
	const [flaggedApps, setFlaggedApps] = useState<ApplicationWithRisk[]>([]);
	const [rejectedApps, setRejectedApps] = useState<ApplicationWithRisk[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);

			// One-time cleanup: remove old persisted full list (prevents fake data from coming back)
			localStorage.removeItem("au_verification_applications");

			try {
				const response = await fetch("http://localhost:5000/api/applications");
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const rawApps: ApplicationData[] = await response.json();
				// DEBUG: Log exactly what the server sent
				console.log("[HOOK] Raw API response - count:", rawApps.length);
				console.log(
					"[HOOK] Raw API org names:",
					rawApps.map((a) => a.organizationName || "Unnamed"),
				);
				console.log(
					"[HOOK] First few apps IDs:",
					rawApps.slice(0, 3).map((a) => a.id),
				);
				// Debug: show what the API actually returns
				console.log("Fresh API response - count:", rawApps.length);
				console.log(
					"API org names:",
					rawApps.map((a) => a.organizationName),
				);

				// Calculate risk scores async
				const appsWithRisk: ApplicationWithRisk[] = await Promise.all(
					rawApps.map(async (app) => {
						const riskAssessment = await calculateRiskScore(app);
						return {
							...app,
							riskAssessment,
						};
					}),
				);
				console.log(
					"[HOOK] After risk calculation - count:",
					appsWithRisk.length,
				);
				console.log(
					"[HOOK] Final apps to set:",
					appsWithRisk.map((a) => ({
						id: a.id,
						name: a.organizationName,
						leaders: a.leadership?.length || 0,
						riskLevel: a.riskAssessment?.level,
						score: a.riskAssessment?.score,
					})),
				);
				setApplications(appsWithRisk);

				// DO NOT save full list to localStorage anymore
				// localStorage.setItem(STORAGE_KEY, JSON.stringify(appsWithRisk)); // REMOVED
			} catch (err: unknown) {
				console.error("Failed to load applications:", err);
				let errorMessage = "Failed to load applications from server.";
				if (err instanceof Error) {
					errorMessage += ` ${err.message}`;
				}
				setError(errorMessage);
				setApplications([]); // Force empty list on error - no old data
			} finally {
				setIsLoading(false);
			}

			// Load only workflow states (keep these - they are small and useful)
			const storedVerified = localStorage.getItem(VERIFIED_KEY);
			if (storedVerified) setVerifiedOrgs(JSON.parse(storedVerified));

			const storedFlagged = localStorage.getItem(FLAGGED_KEY);
			if (storedFlagged) setFlaggedApps(JSON.parse(storedFlagged));

			const storedRejected = localStorage.getItem(REJECTED_KEY);
			if (storedRejected) setRejectedApps(JSON.parse(storedRejected));
		};

		loadData();
	}, []);

	// Persist only workflow states
	useEffect(() => {
		if (!isLoading) {
			localStorage.setItem(VERIFIED_KEY, JSON.stringify(verifiedOrgs));
			localStorage.setItem(FLAGGED_KEY, JSON.stringify(flaggedApps));
			localStorage.setItem(REJECTED_KEY, JSON.stringify(rejectedApps));
		}
	}, [verifiedOrgs, flaggedApps, rejectedApps, isLoading]);

	/* ================= ACTIONS ================= */

	const approveApplication = useCallback((id: string) => {
		setApplications((prev) => {
			const app = prev.find((a) => a.id === id);
			if (app) {
				setVerifiedOrgs((prevV) => [...prevV, { ...app, status: "approved" }]);
			}
			return prev.filter((a) => a.id !== id);
		});
	}, []);

	const rejectApplication = useCallback((id: string) => {
		setApplications((prev) => {
			const app = prev.find((a) => a.id === id);
			if (app) {
				setRejectedApps((prevR) => [...prevR, { ...app, status: "rejected" }]);
			}
			return prev.filter((a) => a.id !== id);
		});
	}, []);

	const flagApplication = useCallback((id: string) => {
		setApplications((prev) => {
			const app = prev.find((a) => a.id === id);
			if (app) {
				setFlaggedApps((prevF) => [...prevF, { ...app, status: "flagged" }]);
			}
			return prev.filter((a) => a.id !== id);
		});
	}, []);

	const getApplicationById = useCallback(
		(id: string) => {
			return (
				applications.find((a) => a.id === id) ||
				verifiedOrgs.find((a) => a.id === id) ||
				flaggedApps.find((a) => a.id === id) ||
				rejectedApps.find((a) => a.id === id)
			);
		},
		[applications, verifiedOrgs, flaggedApps, rejectedApps],
	);

	/* ================= STATS ================= */

	const stats = {
		total:
			applications.length +
			verifiedOrgs.length +
			flaggedApps.length +
			rejectedApps.length,
		pending: applications.filter((a) => a.status === "pending").length,
		approved: verifiedOrgs.length,
		flagged: flaggedApps.length,
		rejected: rejectedApps.length,
		highRisk: applications.filter((a) => a.riskAssessment?.level === "high")
			.length,
	};

	const resetData = useCallback(() => {
		localStorage.removeItem(VERIFIED_KEY);
		localStorage.removeItem(FLAGGED_KEY);
		localStorage.removeItem(REJECTED_KEY);
		// Also clear the full list key (for safety)
		localStorage.removeItem("au_verification_applications");
		window.location.reload();
	}, []);

	return {
		applications,
		verifiedOrgs,
		flaggedApps,
		rejectedApps,
		isLoading,
		error,
		stats,
		approveApplication,
		rejectApplication,
		flagApplication,
		resetData,
		getApplicationById,
	};
}
