import { useState, useEffect, useCallback } from "react";
import {
	ApplicationData,
	calculateRiskScore,
	RiskAssessment,
} from "@/lib/riskScoring";
import type {
	Application,
	ApplicationWithRisk,
	TrackedApplication,
} from "@/types/application";

const VERIFIED_KEY = "au_verified_organizations";
const FLAGGED_KEY = "au_flagged_applications";
const REJECTED_KEY = "au_rejected_applications";

export function useApplications() {
	const [allApplications, setAllApplications] = useState<ApplicationWithRisk[]>(
		[],
	);
	const [applications, setApplications] = useState<ApplicationWithRisk[]>([]);
	const [verifiedOrgs, setVerifiedOrgs] = useState<ApplicationWithRisk[]>([]);
	const [flaggedApps, setFlaggedApps] = useState<ApplicationWithRisk[]>([]);
	const [rejectedApps, setRejectedApps] = useState<ApplicationWithRisk[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Load data from API + localStorage
	const loadData = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		// One-time cleanup of old full list key
		localStorage.removeItem("au_verification_applications");

		try {
			// Fetch from backend
			const response = await fetch("/api/applications");

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const rawApps: ApplicationData[] = await response.json();

			// Calculate risk for each
			const appsWithRisk: ApplicationWithRisk[] = await Promise.all(
				rawApps.map(async (app) => {
					const riskAssessment = await calculateRiskScore(app);
					return {
						...app,
						riskAssessment,
					} as ApplicationWithRisk;
				}),
			);

			// Store ALL applications
			setAllApplications(appsWithRisk);

			// Only keep pending applications in the main list
			setApplications(appsWithRisk.filter((a) => a.status === "pending"));
		} catch (err: unknown) {
			console.error("Failed to load applications:", err);
			const message = err instanceof Error ? err.message : "Unknown error";
			setError(`Failed to load applications: ${message}`);
			setAllApplications([]);
			setApplications([]);
		} finally {
			setIsLoading(false);
		}

		// Load workflow states from localStorage
		try {
			const storedVerified = localStorage.getItem(VERIFIED_KEY);
			if (storedVerified) {
				setVerifiedOrgs(JSON.parse(storedVerified) as ApplicationWithRisk[]);
			}

			const storedFlagged = localStorage.getItem(FLAGGED_KEY);
			if (storedFlagged) {
				setFlaggedApps(JSON.parse(storedFlagged) as ApplicationWithRisk[]);
			}

			const storedRejected = localStorage.getItem(REJECTED_KEY);
			if (storedRejected) {
				setRejectedApps(JSON.parse(storedRejected) as ApplicationWithRisk[]);
			}
		} catch (err) {
			console.error("Error loading workflow states:", err);
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Persist workflow states
	useEffect(() => {
		if (!isLoading) {
			localStorage.setItem(VERIFIED_KEY, JSON.stringify(verifiedOrgs));
			localStorage.setItem(FLAGGED_KEY, JSON.stringify(flaggedApps));
			localStorage.setItem(REJECTED_KEY, JSON.stringify(rejectedApps));
		}
	}, [verifiedOrgs, flaggedApps, rejectedApps, isLoading]);

	// ── Actions ────────────────────────────────────────────────

	const approveApplication = useCallback((id: string) => {
		setAllApplications((prev) =>
			prev.map((app) =>
				app.id === id ? { ...app, status: "approved" as const } : app,
			),
		);

		setApplications((prev) => {
			const newApps = [...prev];
			const appIndex = newApps.findIndex((a) => a.id === id);
			if (appIndex === -1) return prev;

			const appCopy = structuredClone(newApps[appIndex]) as ApplicationWithRisk;
			appCopy.status = "approved";

			newApps.splice(appIndex, 1);

			setVerifiedOrgs((prevV) => [...prevV, appCopy]);

			return newApps;
		});
	}, []);

	const rejectApplication = useCallback((id: string) => {
		setAllApplications((prev) =>
			prev.map((app) =>
				app.id === id ? { ...app, status: "rejected" as const } : app,
			),
		);

		setApplications((prev) => {
			const newApps = [...prev];
			const appIndex = newApps.findIndex((a) => a.id === id);
			if (appIndex === -1) return prev;

			const appCopy = structuredClone(newApps[appIndex]) as ApplicationWithRisk;
			appCopy.status = "rejected";

			newApps.splice(appIndex, 1);

			setRejectedApps((prevR) => [...prevR, appCopy]);

			return newApps;
		});
	}, []);

	const flagApplication = useCallback((id: string) => {
		setAllApplications((prev) =>
			prev.map((app) =>
				app.id === id ? { ...app, status: "flagged" as const } : app,
			),
		);

		setApplications((prev) => {
			const newApps = [...prev];
			const appIndex = newApps.findIndex((a) => a.id === id);
			if (appIndex === -1) return prev;

			const appCopy = structuredClone(newApps[appIndex]) as ApplicationWithRisk;
			appCopy.status = "flagged";

			newApps.splice(appIndex, 1);

			setFlaggedApps((prevF) => [...prevF, appCopy]);

			return newApps;
		});
	}, []);

	// ── Refetch ─────────────────────────────────────────────────

	const refetch = useCallback(() => {
		loadData();
	}, [loadData]);

	// ── Getters ────────────────────────────────────────────────

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

	// ── Stats ──────────────────────────────────────────────────

	const stats = {
		// Combine ALL sources for total count
		total: allApplications.length,
		// Pending from server
		pending: applications.length,
		// Approved from localStorage
		approved: verifiedOrgs.length,
		// Flagged from localStorage
		flagged: flaggedApps.length,
		// Rejected from localStorage
		rejected: rejectedApps.length,
		// High risk from allApplications
		highRisk: allApplications.filter(
			(a) =>
				a.riskAssessment?.level === "high" ||
				a.riskAssessment?.level === "critical",
		).length,
	};

	const resetData = useCallback(() => {
		localStorage.removeItem(VERIFIED_KEY);
		localStorage.removeItem(FLAGGED_KEY);
		localStorage.removeItem(REJECTED_KEY);
		localStorage.removeItem("au_verification_applications");
		loadData();
	}, [loadData]);

	return {
		// For dashboard: use allApplications to get everything
		applications: allApplications, // Return ALL apps for dashboard stats
		pendingApplications: applications, // Only pending apps for review
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
		refetch,
	};
}
