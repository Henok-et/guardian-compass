import { useState, useEffect, useCallback, useMemo } from "react";
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

// Cache so switching between tabs doesn't refetch every time.
// This keeps the app snappy by reusing the last loaded data.
let cachedApplications: ApplicationWithRisk[] | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
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
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Load data from API + localStorage
	const loadData = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		// If we already have cached data, use it and avoid refetching.
		// This makes tab switching fast and avoids redundant network requests.
		if (cachedApplications) {
			setAllApplications(cachedApplications);
			setApplications(cachedApplications.filter((a) => a.status === "pending"));
			setIsLoading(false);
			return;
		}

		try {
			const token = getStoredToken();
			const headers = token ? { Authorization: `Bearer ${token}` } : {};

			// Fetch from backend
			const appsResp = await fetch("/api/applications", { headers });

			if (!appsResp.ok) {
				throw new Error(`HTTP error! status: ${appsResp.status}`);
			}

			const rawApps: ApplicationData[] = await appsResp.json();

			// Calculate risk for each
			const appsWithRisk: ApplicationWithRisk[] = await Promise.all(
				rawApps.map(async (rawApp: any) => {
					const riskAssessment = await calculateRiskScore(rawApp);
					
					// Safely extract from nested backend structure OR fallback to flat structure
					const org = rawApp.organization || rawApp;
					const exec = rawApp.executive;
					
					const leadership = [];
					if (exec) {
						leadership.push({
							name: exec.fullName || "Executive",
							role: exec.role || "Executive",
							dob: exec.dateOfBirth,
							hasId: !!exec.idDocument,
							isFinalDecisionMaker: true,
						});
					}
					if (Array.isArray(rawApp.boardMembers)) {
						rawApp.boardMembers.forEach((m: any) => {
							leadership.push({
								name: m.fullName,
								role: m.role || "Board Member",
								dob: m.dateOfBirth,
								hasId: false,
							});
						});
					}
					if (Array.isArray(rawApp.leadership) && leadership.length === 0) {
						leadership.push(...rawApp.leadership);
					}

					return {
						id: rawApp.id || (rawApp._id ? String(rawApp._id) : ""),
						applicationId: rawApp.applicationId,
						organizationName: org.legalName || org.organizationName || "Unnamed",
						registrationNumber: org.registrationNumber || "",
						country: org.country || "",
						city: org.city || "",
						email: org.email || exec?.email || "",
						phone: org.phone || exec?.phone || "",
						website: org.website || "",
						socialMedia: org.socialMedia || "",
						organizationType: org.organizationType || "",
						memberCount: rawApp.boardMembers?.length || rawApp.memberCount || leadership.length || 0,
						yearEstablished: org.yearEstablished || rawApp.yearEstablished,
						missionStatement: org.missionStatement || "",
						// Activities section
						activitiesDescription: rawApp.activities?.activitiesDescription || "",
						impactDescription: rawApp.activities?.impactDescription || "",
						operationalPresence: rawApp.activities?.operationalPresence || "",
						partnerships: rawApp.activities?.partnerships || "",
						verificationLinks: rawApp.activities?.verificationLinks || "",
						transparencyDeclaration: rawApp.activities?.transparencyDeclaration || false,
						// Governance section
						governanceDeclaration: rawApp.governance?.governanceDeclaration || false,
						leadershipResponsibilityDeclaration: rawApp.governance?.leadershipResponsibilityDeclaration || false,
						// Legal section
						legalDeclaration: rawApp.legalDeclaration?.legalDeclaration || false,
						authorization: rawApp.legalDeclaration?.authorization || false,
						leadership,
						status: rawApp.status || "pending",
						submittedAt: rawApp.submittedAt || new Date().toISOString(),
						actionDate: rawApp.actionDate,
						riskAssessment,
					} as ApplicationWithRisk;
				}),
			);

			const updatedApps = appsWithRisk;

			// Cache for fast tab switching; keeps data available between mounts.
			cachedApplications = updatedApps;

			// Store ALL applications and keep derived lists in sync
			setAllApplications(updatedApps);
			setApplications(updatedApps.filter((a) => a.status === "pending"));
			console.log(
				"[useApplications] loaded apps:",
				updatedApps.length,
				"(pending:",
				updatedApps.filter((a) => a.status === "pending").length,
				"flagged:",
				updatedApps.filter((a) => a.status === "flagged").length,
				"rejected:",
				updatedApps.filter((a) => a.status === "rejected").length,
				")",
			);
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

	// ── Actions ────────────────────────────────────────────────

	const approveApplication = useCallback(
		async (id: string) => {
			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/status`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
					body: JSON.stringify({ status: "approved" }),
				});
				cachedApplications = null;
				await loadData();
			} catch (e) {
				console.warn("Failed to persist approve to server:", e);
			}
		},
		[loadData],
	);

	const rejectApplication = useCallback(
		async (id: string) => {
			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/status`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
					body: JSON.stringify({ status: "rejected" }),
				});
				cachedApplications = null;
				await loadData();
			} catch (e) {
				console.warn("Failed to persist reject to server:", e);
			}
		},
		[loadData],
	);

	const flagApplication = useCallback(
		async (id: string) => {
			try {
				const token = getStoredToken();
				await fetch(`/api/applications/${encodeURIComponent(id)}/status`, {
					method: "POST",
					headers: Object.assign(
						{ "Content-Type": "application/json" },
						token ? { Authorization: `Bearer ${token}` } : {},
					),
					body: JSON.stringify({ status: "flagged" }),
				});
				cachedApplications = null;
				await loadData();
			} catch (e) {
				console.warn("Failed to persist flag to server:", e);
			}
		},
		[loadData],
	);

	// ── Refetch ─────────────────────────────────────────────────

	const refetch = useCallback(() => {
		loadData();
	}, [loadData]);

	// ── Getters ────────────────────────────────────────────────

	const getApplicationById = useCallback(
		(id: string) => {
			return allApplications.find((a) => a.id === id);
		},
		[allApplications],
	);

	// ── Stats ──────────────────────────────────────────────────
	const stats = useMemo(() => {
		const base = {
			total: 0,
			pending: 0,
			approved: 0,
			flagged: 0,
			rejected: 0,
			highRisk: 0,
		};

		return allApplications.reduce((acc, app) => {
			acc.total += 1;
			switch (app.status) {
				case "approved":
					acc.approved += 1;
					break;
				case "flagged":
					acc.flagged += 1;
					break;
				case "rejected":
					acc.rejected += 1;
					break;
				case "pending":
				default:
					acc.pending += 1;
			}

			if (
				app.riskAssessment?.level === "high" ||
				app.riskAssessment?.level === "critical"
			) {
				acc.highRisk += 1;
			}

			return acc;
		}, base);
	}, [allApplications]);

	const resetData = useCallback(() => {
		loadData();
	}, [loadData]);

	const verifiedOrgs = useMemo(
		() => allApplications.filter((a) => a.status === "approved"),
		[allApplications],
	);
	const flaggedApps = useMemo(
		() => allApplications.filter((a) => a.status === "flagged"),
		[allApplications],
	);
	const rejectedApps = useMemo(
		() => allApplications.filter((a) => a.status === "rejected"),
		[allApplications],
	);

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
