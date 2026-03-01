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

// helper moved out of the hook so callbacks can reference it without having to
// add it to every dependency list. returning `string | null` matches the
// original behaviour.
function getStoredToken(): string | null {
	try {
		const raw = localStorage.getItem("au_verification_auth");
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed?.token || null;
	} catch {
		return null;
	}
}

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

			// Load workflow states from localStorage early so we can merge and apply auto-approve
			let storedVerifiedList: ApplicationWithRisk[] = [];
			let storedFlaggedList: ApplicationWithRisk[] = [];
			let storedRejectedList: ApplicationWithRisk[] = [];
			try {
				const sv = localStorage.getItem(VERIFIED_KEY);
				if (sv) storedVerifiedList = JSON.parse(sv) as ApplicationWithRisk[];
				const sf = localStorage.getItem(FLAGGED_KEY);
				if (sf) storedFlaggedList = JSON.parse(sf) as ApplicationWithRisk[];
				const sr = localStorage.getItem(REJECTED_KEY);
				if (sr) storedRejectedList = JSON.parse(sr) as ApplicationWithRisk[];
			} catch (e) {
				console.error("Error reading workflow localStorage during load:", e);
			}

			// Apply auto-approve suggestions: if risk suggests auto-approve and not already in any list
			const idsInWorkflow = new Set([
				...storedVerifiedList.map((a) => a.id),
				...storedFlaggedList.map((a) => a.id),
				...storedRejectedList.map((a) => a.id),
			]);

			// Build id->status map from stored workflow lists
			const idToStoredStatus = new Map<string, ApplicationWithRisk["status"]>();
			storedVerifiedList.forEach((a) => idToStoredStatus.set(a.id, "approved"));
			storedFlaggedList.forEach((a) => idToStoredStatus.set(a.id, "flagged"));
			storedRejectedList.forEach((a) => idToStoredStatus.set(a.id, "rejected"));

			const updatedApps = appsWithRisk.map((app) => {
				const stored = idToStoredStatus.get(app.id);
				if (stored) return { ...app, status: stored } as ApplicationWithRisk;
				if (
					app.riskAssessment?.autoApproveSuggested &&
					!idsInWorkflow.has(app.id)
				) {
					// mark approved locally
					storedVerifiedList.push({ ...app, status: "approved" });
					idsInWorkflow.add(app.id);
					return { ...app, status: "approved" } as ApplicationWithRisk;
				}
				return app;
			});

			// Store ALL applications and apply merged statuses
			setAllApplications(updatedApps);

			// Only keep pending applications in the main list
			setApplications(updatedApps.filter((a) => a.status === "pending"));

			// initialize workflow lists from localStorage + auto-approvals
			setVerifiedOrgs(storedVerifiedList);
			setFlaggedApps(storedFlaggedList);
			setRejectedApps(storedRejectedList);
		} catch (err: unknown) {
			console.error("Failed to load applications:", err);
			const message = err instanceof Error ? err.message : "Unknown error";
			setError(`Failed to load applications: ${message}`);
			setAllApplications([]);
			setApplications([]);
		} finally {
			setIsLoading(false);
		}

		// workflow state already merged/initialized above
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

	// helper for removing an application from the pending list. extracted so
	// the same implementation can be shared by all three action helpers.
	const removeFromPending = useCallback((id: string) => {
		setApplications((prev) => prev.filter((a) => a.id !== id));
	}, []);

	const approveApplication = useCallback(
		async (id: string) => {
			// update the global list first so every consumer sees the new status
			setAllApplications((prev) =>
				prev.map((app) =>
					app.id === id ? { ...app, status: "approved" as const } : app,
				),
			);

			// remove it from the pending list
			removeFromPending(id);

			// find the application info in the master list so we can persist to
			// the verified array (use the previous value of allApplications
			// which will always contain the record, even if it has already been
			// processed elsewhere)
			const appToMove = allApplications.find((a) => a.id === id);
			if (appToMove) {
				const copy = { ...appToMove, status: "approved" as const };
				setVerifiedOrgs((prevV) => {
					const updated = [...prevV, copy];
					localStorage.setItem(VERIFIED_KEY, JSON.stringify(updated));
					return updated;
				});
			}

			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/approve`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
				});
			} catch (e) {
				console.warn("Failed to persist approve to server:", e);
			}
		},
		[allApplications, removeFromPending],
	);

	const rejectApplication = useCallback(
		async (id: string) => {
			setAllApplications((prev) =>
				prev.map((app) =>
					app.id === id ? { ...app, status: "rejected" as const } : app,
				),
			);

			removeFromPending(id);

			const appToMove = allApplications.find((a) => a.id === id);
			if (appToMove) {
				const copy = { ...appToMove, status: "rejected" as const };
				setRejectedApps((prevR) => {
					const updated = [...prevR, copy];
					localStorage.setItem(REJECTED_KEY, JSON.stringify(updated));
					return updated;
				});
			}

			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/reject`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
				});
			} catch (e) {
				console.warn("Failed to persist reject to server:", e);
			}
		},
		[allApplications, removeFromPending],
	);

	const flagApplication = useCallback(
		async (id: string) => {
			setAllApplications((prev) =>
				prev.map((app) =>
					app.id === id ? { ...app, status: "flagged" as const } : app,
				),
			);

			removeFromPending(id);

			const appToMove = allApplications.find((a) => a.id === id);
			if (appToMove) {
				const copy = { ...appToMove, status: "flagged" as const };
				setFlaggedApps((prevF) => {
					const updated = [...prevF, copy];
					localStorage.setItem(FLAGGED_KEY, JSON.stringify(updated));
					return updated;
				});
			}

			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/flag`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
				});
			} catch (e) {
				console.warn("Failed to persist flag to server:", e);
			}
		},
		[allApplications, removeFromPending],
	);

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
