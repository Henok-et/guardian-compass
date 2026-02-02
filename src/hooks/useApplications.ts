import { useState, useEffect, useCallback } from "react";
import {
	ApplicationData,
	calculateRiskScore,
	RiskAssessment,
} from "@/lib/riskScoring";
import { getMockApplications } from "@/data/mockApplications";
import { parseLeadershipFromSheet } from "@/lib/parseLeadershipFromSheet";

export interface ApplicationWithRisk extends ApplicationData {
	riskAssessment: RiskAssessment;
}

const STORAGE_KEY = "au_verification_applications";
const VERIFIED_KEY = "au_verified_organizations";
const FLAGGED_KEY = "au_flagged_applications";
const REJECTED_KEY = "au_rejected_applications";

export function useApplications() {
	const [applications, setApplications] = useState<ApplicationWithRisk[]>([]);
	const [verifiedOrgs, setVerifiedOrgs] = useState<ApplicationWithRisk[]>([]);
	const [flaggedApps, setFlaggedApps] = useState<ApplicationWithRisk[]>([]);
	const [rejectedApps, setRejectedApps] = useState<ApplicationWithRisk[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);

			let apps: ApplicationData[] = [];

			try {
				const response = await fetch("http://localhost:5000/api/applications");
				if (!response.ok)
					throw new Error(`HTTP error! status: ${response.status}`);

				apps = await response.json();
			} catch (error) {
				console.warn("Failed to fetch applications, using mock data", error);
				apps = getMockApplications();
			}

			// 🔥 ASYNC risk calculation (THE FIX)
			const appsWithRisk: ApplicationWithRisk[] = await Promise.all(
				apps.map(async (app) => {
					const riskAssessment = await calculateRiskScore(app);
					return {
						...app,
						riskAssessment,
					};
				}),
			);

			setApplications(appsWithRisk);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(appsWithRisk));

			// Load workflow states
			const storedVerified = localStorage.getItem(VERIFIED_KEY);
			if (storedVerified) setVerifiedOrgs(JSON.parse(storedVerified));

			const storedFlagged = localStorage.getItem(FLAGGED_KEY);
			if (storedFlagged) setFlaggedApps(JSON.parse(storedFlagged));

			const storedRejected = localStorage.getItem(REJECTED_KEY);
			if (storedRejected) setRejectedApps(JSON.parse(storedRejected));

			setIsLoading(false);
		};

		loadData();
	}, []);

	// Persist updates
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
			if (app)
				setVerifiedOrgs((prevV) => [...prevV, { ...app, status: "approved" }]);
			return prev.filter((a) => a.id !== id);
		});
	}, []);

	const rejectApplication = useCallback((id: string) => {
		setApplications((prev) => {
			const app = prev.find((a) => a.id === id);
			if (app)
				setRejectedApps((prevR) => [...prevR, { ...app, status: "rejected" }]);
			return prev.filter((a) => a.id !== id);
		});
	}, []);

	const flagApplication = useCallback((id: string) => {
		setApplications((prev) => {
			const app = prev.find((a) => a.id === id);
			if (app)
				setFlaggedApps((prevF) => [...prevF, { ...app, status: "flagged" }]);
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
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(VERIFIED_KEY);
		localStorage.removeItem(FLAGGED_KEY);
		localStorage.removeItem(REJECTED_KEY);
		window.location.reload();
	}, []);

	return {
		applications,
		verifiedOrgs,
		flaggedApps,
		rejectedApps,
		isLoading,
		stats,
		approveApplication,
		rejectApplication,
		flagApplication,
		resetData,
		getApplicationById,
	};
}
