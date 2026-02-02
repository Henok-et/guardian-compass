import { checkNamesAgainstSanctions, SanctionMatch } from "./fuzzyMatch";
import { searchSanctions } from "./sanctionsApi";

/* ===================== TYPES ===================== */

export interface RiskBreakdown {
	sanctionsMatch: number;
	missingId: number;
	noRecentActivity: number;
	nonYouthLeadership: number;
	incompleteFields: number;
	total: number;
}

export interface RiskAssessment {
	score: number;
	level: "low" | "medium" | "high";
	breakdown: RiskBreakdown;
	sanctionMatches: SanctionMatch[];
}

export interface LeadershipInfo {
	name: string;
	role?: string;
	age?: number;
	dob?: string;
	hasId?: boolean;
	isFinalDecisionMaker?: boolean;
}

export interface ApplicationData {
	id: string;
	organizationName: string;
	registrationNumber: string;
	country: string;
	city: string;
	email: string;
	phone: string;
	website?: string;
	leadership: LeadershipInfo[];
	missionStatement: string;
	yearEstablished: number;
	memberCount: number;
	hasRecentActivityProof: boolean;
	submittedAt: string;
	status: "pending" | "approved" | "rejected" | "flagged";
}

export interface ApplicationWithRisk extends ApplicationData {
	riskAssessment: RiskAssessment;
}

/* ===================== CONSTANTS ===================== */

const YOUTH_MIN_AGE = 18;
const YOUTH_MAX_AGE = 35;

/* ===================== LOGIC ===================== */

export async function calculateRiskScore(
	application: ApplicationData,
): Promise<RiskAssessment> {
	const breakdown: RiskBreakdown = {
		sanctionsMatch: 0,
		missingId: 0,
		noRecentActivity: 0,
		nonYouthLeadership: 0,
		incompleteFields: 0,
		total: 0,
	};

	// 1️⃣ Prepare leadership names for sanctions check
	const leadershipNames = application.leadership.map((l) => l.name);

	// 2️⃣ Call sanctions API
	const apiSanctions = await searchSanctions(leadershipNames);
	const apiSanctionNames = apiSanctions.map((p) => p.name);

	const sanctionMatches = checkNamesAgainstSanctions(
		leadershipNames,
		apiSanctionNames,
	);

	if (sanctionMatches.length > 0) breakdown.sanctionsMatch = 70;

	// 3️⃣ Check for missing ID (safe optional chaining)
	const leadersWithoutId = application.leadership.filter((l) => !l.hasId);
	if (leadersWithoutId.length > 0) breakdown.missingId = 15;

	// 4️⃣ Check recent activity
	if (!application.hasRecentActivityProof) breakdown.noRecentActivity = 10;

	// 5️⃣ Check youth leadership
	const youthLeaders = application.leadership.filter(
		(l) =>
			l.age !== undefined && l.age >= YOUTH_MIN_AGE && l.age <= YOUTH_MAX_AGE,
	);
	const youthPercentage =
		application.leadership.length === 0
			? 0
			: youthLeaders.length / application.leadership.length;
	if (youthPercentage < 0.5) breakdown.nonYouthLeadership = 30;

	// 6️⃣ Check incomplete fields
	const requiredFields = [
		application.organizationName,
		application.registrationNumber,
		application.country,
		application.email,
		application.missionStatement,
	];
	const incompleteCount = requiredFields.filter(
		(f) => !f || f.trim() === "",
	).length;
	if (incompleteCount > 0) breakdown.incompleteFields = incompleteCount * 5;

	// 7️⃣ Total score
	breakdown.total =
		breakdown.sanctionsMatch +
		breakdown.missingId +
		breakdown.noRecentActivity +
		breakdown.nonYouthLeadership +
		breakdown.incompleteFields;

	const level: "low" | "medium" | "high" =
		breakdown.total >= 50 ? "high" : breakdown.total >= 25 ? "medium" : "low";

	return {
		score: Math.min(breakdown.total, 100),
		level,
		breakdown,
		sanctionMatches,
	};
}

/* ===================== UTILS ===================== */

export function getRiskBadgeColor(level: "low" | "medium" | "high"): string {
	switch (level) {
		case "low":
			return "bg-green-100 text-green-800 border-green-200";
		case "medium":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "high":
			return "bg-red-100 text-red-800 border-red-200";
	}
}
