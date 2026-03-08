import Fuse from "fuse.js";

const isNode = typeof window === "undefined" && typeof process !== "undefined";

/* ===================== TYPES ===================== */
export interface RiskBreakdown {
	sanctionsMatch: number;
	missingId: number;
	noRecentActivity: number;
	nonYouthLeadership: number;
	incompleteFields: number;
	invalidData: number;
	total: number;
	[key: string]: number;
}

export interface BreakdownReason {
	category:
		| "sanctions"
		| "missingId"
		| "noRecentActivity"
		| "nonYouthLeadership"
		| "incompleteFields"
		| "invalidData";
	reason: string;
	value?: number;
}

export interface RiskAssessment {
	score: number;
	level: "low" | "medium" | "high" | "critical";
	breakdown: RiskBreakdown;
	reasons: BreakdownReason[];
	sanctionMatches: {
		inputName: string;
		sanctionedName: string;
		similarity: number;
	}[];
	autoApproveSuggested?: boolean;
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

/* ===================== CONFIG & STATE ===================== */
const YOUTH_MIN_AGE = 15;
const YOUTH_MAX_AGE = 35;
const MIN_VALID_AGE = 15;
const MAX_VALID_AGE = 100;

const SANCTIONS_CACHE_JSON =
	(isNode && process.env.UN_SANCTIONS_CACHE) || "sanctions.json";
const SANCTIONS_REFRESH_DAYS = Number(
	(isNode && process.env.UN_SANCTIONS_REFRESH_DAYS) ?? "7",
);
const FUZZY_THRESHOLD = Number(
	(isNode && process.env.SANCTIONS_FUZZY_THRESHOLD) ?? "0.45",
);

let sanctionedNames: string[] = [];
let fuse: Fuse<string> | null = null;
let lastLoadedAt: number | null = null;

/* ===================== HELPERS ===================== */
function normalizeNameForMatch(input: string): string {
	return input
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/\b(mr|ms|mrs|dr|prof|hon|sr|jr|ii|iii|iv)\b/gi, "")
		.replace(/[^a-zA-Z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

function parseDOBToDate(dob?: string): Date | null {
	if (!dob) return null;
	const s = dob.trim();
	const iso = /^\d{4}-\d{2}-\d{2}$/;
	if (iso.test(s)) {
		const d = new Date(s);
		if (!isNaN(d.getTime())) return d;
	}
	const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
	const m1 = s.match(dm);
	if (m1) {
		const day = Number(m1[1]);
		const month = Number(m1[2]);
		const year = Number(m1[3]);
		const d = new Date(year, month - 1, day);
		if (!isNaN(d.getTime())) return d;
	}
	const df = new Date(s);
	return isNaN(df.getTime()) ? null : df;
}

export function safeCalculateAge(dob?: string, providedAge?: number): number {
	if (
		typeof providedAge === "number" &&
		providedAge > 0 &&
		providedAge <= MAX_VALID_AGE
	)
		return providedAge;
	if (!dob) return -1;
	const d = parseDOBToDate(dob);
	if (!d) return -1;
	const today = new Date();
	let age = today.getFullYear() - d.getFullYear();
	const m = today.getMonth() - d.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
	if (age < MIN_VALID_AGE || age > MAX_VALID_AGE) return -1;
	return age;
}

const FALLBACK_NAMES = [
	"abdul bari",
	"abdul basir",
	"abdul ghafar",
	"abdul ghani",
	"yahya jammeh",
	"germain katanga",
];

function buildFuse(names: string[]) {
	fuse = new Fuse(names, {
		includeScore: true,
		threshold: FUZZY_THRESHOLD,
		ignoreLocation: true,
		minMatchCharLength: 3,
	});
}

function tokensOf(norm: string) {
	return Array.from(new Set(norm.split(/\s+/).filter(Boolean)));
}

function tokenOverlapScore(aTokens: string[], bTokens: string[]) {
	if (aTokens.length === 0 || bTokens.length === 0) return 0;
	const a = new Set(aTokens);
	const b = new Set(bTokens);
	let matches = 0;
	for (const t of a) if (b.has(t)) matches++;
	return matches / Math.max(a.size, b.size || 1);
}

async function saveSanctionsCache(list: string[]) {
	if (!isNode) return; // do not attempt filesystem writes in browser
	try {
		const fs = await import("fs/promises");
		await fs.writeFile(
			SANCTIONS_CACHE_JSON,
			JSON.stringify({ names: list, loadedAt: Date.now() }),
			"utf-8",
		);
	} catch (err) {
		console.warn("[Sanctions] Failed to write cache:", (err as Error).message);
	}
}

async function loadSanctionsCacheIfFresh(): Promise<string[] | null> {
	if (!isNode) return null;
	try {
		const fs = await import("fs/promises");
		const raw = await fs.readFile(SANCTIONS_CACHE_JSON, "utf-8");
		const parsed = JSON.parse(raw) as { names?: string[]; loadedAt?: number };
		if (
			parsed &&
			parsed.names &&
			parsed.loadedAt &&
			Date.now() - parsed.loadedAt < SANCTIONS_REFRESH_DAYS * 24 * 3600 * 1000
		) {
			return parsed.names;
		}
	} catch {
		// missing
	}
	return null;
}

export async function isSanctioned(inputName: string) {
	const norm = normalizeNameForMatch(inputName);
	if (!norm) return null;
	if (!sanctionedNames || sanctionedNames.length === 0)
		await refreshSanctions();
	if (fuse) {
		const results = fuse.search(norm, { limit: 5 });
		if (results.length > 0) {
			const best = results[0];
			const rawScore = typeof best.score === "number" ? best.score : 1;
			if (rawScore <= FUZZY_THRESHOLD) {
				return {
					sanctionedName: best.item,
					similarity: 1 - rawScore,
					method: "fuzzy",
				};
			}
		}
	}
	const inputTokens = tokensOf(norm);
	for (const s of sanctionedNames) {
		const sTokens = tokensOf(s);
		const overlap = tokenOverlapScore(inputTokens, sTokens);
		if (overlap >= 0.6)
			return {
				sanctionedName: s,
				similarity: overlap,
				method: "token-overlap",
			};
		if (sTokens.length >= 2) {
			const last = sTokens[sTokens.length - 1];
			const first = sTokens[0];
			if (
				inputTokens.includes(last) &&
				(inputTokens.includes(first) ||
					inputTokens.some((t) => first.startsWith(t)))
			) {
				return { sanctionedName: s, similarity: overlap, method: "last-first" };
			}
		}
	}
	return null;
}

export async function refreshSanctions(force = false): Promise<string[]> {
	if (
		!force &&
		lastLoadedAt &&
		Date.now() - lastLoadedAt < SANCTIONS_REFRESH_DAYS * 24 * 3600 * 1000
	)
		return sanctionedNames;
	const cache = await loadSanctionsCacheIfFresh();
	if (cache && !force) {
		sanctionedNames = cache.map(normalizeNameForMatch).filter(Boolean);
		buildFuse(sanctionedNames);
		lastLoadedAt = Date.now();
		return sanctionedNames;
	}
	try {
		if (isNode) {
			const fs = await import("fs/promises");
			const raw = await fs.readFile(SANCTIONS_CACHE_JSON, "utf-8");
			const parsed = JSON.parse(raw) as { names?: string[] } | string[];
			let names: string[] = [];
			if (Array.isArray(parsed)) names = parsed as string[];
			else if (
				parsed &&
				typeof parsed === "object" &&
				Array.isArray((parsed as { names?: string[] }).names)
			)
				names = (parsed as { names?: string[] }).names!;
			if (names.length > 0) {
				sanctionedNames = Array.from(
					new Set(names.map(normalizeNameForMatch)),
				).filter(Boolean);
				buildFuse(sanctionedNames);
				await saveSanctionsCache(sanctionedNames);
				lastLoadedAt = Date.now();
				console.log(
					`[Sanctions] Loaded ${sanctionedNames.length} names (from ${SANCTIONS_CACHE_JSON})`,
				);
				return sanctionedNames;
			}
		}
	} catch (err) {
		// ignore
	}
	console.warn("[Sanctions] Using fallback sanctions list");
	sanctionedNames = Array.from(
		new Set(FALLBACK_NAMES.map(normalizeNameForMatch)),
	).filter(Boolean);
	buildFuse(sanctionedNames);
	lastLoadedAt = Date.now();
	return sanctionedNames;
}

export async function calculateRiskScore(
	application: ApplicationData,
): Promise<RiskAssessment> {
	const breakdown: RiskBreakdown = {
		sanctionsMatch: 0,
		missingId: 0,
		noRecentActivity: 0,
		nonYouthLeadership: 0,
		incompleteFields: 0,
		invalidData: 0,
		total: 0,
	};
	const reasons: BreakdownReason[] = [];
	await refreshSanctions();
	const sanctionMatches: {
		inputName: string;
		sanctionedName: string;
		similarity: number;
	}[] = [];
	for (const leader of application.leadership) {
		const name = leader?.name;
		if (!name) continue;
		const match: Awaited<ReturnType<typeof isSanctioned>> =
			await isSanctioned(name);
		if (match) {
			sanctionMatches.push({
				inputName: name,
				sanctionedName: match.sanctionedName,
				similarity: Math.max(0, Math.min(1, match.similarity)),
			});
			reasons.push({
				category: "sanctions",
				reason: `Sanctions match (${match.method}) for ${name}`,
			});
		}
	}
	if (sanctionMatches.length > 0) breakdown.sanctionsMatch = 80;
	const leadersWithoutId = application.leadership.filter((l) => !l.hasId);
	if (leadersWithoutId.length > 0) {
		breakdown.missingId = leadersWithoutId.length * 20;
		reasons.push({
			category: "missingId",
			reason: `Leaders without ID: ${leadersWithoutId.length}`,
			value: leadersWithoutId.length,
		});
	}
	if (!application.hasRecentActivityProof) {
		breakdown.noRecentActivity = 20;
		reasons.push({
			category: "noRecentActivity",
			reason: "No recent activity proof provided",
			value: 20,
		});
	}
	let invalidAgeCount = 0;
	let youthCount = 0;
	for (const leader of application.leadership) {
		if (
			typeof leader.age === "number" &&
			(leader.age > MAX_VALID_AGE || leader.age < MIN_VALID_AGE)
		) {
			invalidAgeCount++;
			reasons.push({
				category: "invalidData",
				reason: `Unrealistic age (${leader.age}) for ${leader.name}`,
				value: leader.age,
			});
			continue;
		}
		const age = safeCalculateAge(leader.dob, leader.age);
		if (age === -1) {
			invalidAgeCount++;
			reasons.push({
				category: "invalidData",
				reason: `Invalid age/DOB for ${leader.name}`,
				value: 1,
			});
		} else {
			if (age <= YOUTH_MAX_AGE) youthCount++;
		}
	}
	const totalLeaders = application.leadership.length || 1;
	const youthPercentage = youthCount / totalLeaders;
	if (youthPercentage < 0.51) {
		breakdown.nonYouthLeadership = 35;
		reasons.push({
			category: "nonYouthLeadership",
			reason: `Youth leadership ${Math.round(youthPercentage * 100)}% < 51%`,
		});
	}
	if (invalidAgeCount > 0) breakdown.invalidData = invalidAgeCount * 25;
	const requiredFields = [
		application.organizationName?.trim(),
		application.registrationNumber?.trim(),
		application.country?.trim(),
		application.email?.trim(),
		application.missionStatement?.trim(),
	];
	const incompleteCount = requiredFields.filter((f) => !f).length;
	if (incompleteCount > 0) {
		breakdown.incompleteFields = incompleteCount * 10;
		reasons.push({
			category: "incompleteFields",
			reason: `${incompleteCount} required fields missing`,
			value: incompleteCount,
		});
	}
	breakdown.total = Object.values(breakdown).reduce(
		(sum, v) => sum + (typeof v === "number" ? v : 0),
		0,
	);
	const score = Math.min(breakdown.total, 100);
	let level: "low" | "medium" | "high" | "critical" = "low";
	if (
		score >= 85 ||
		sanctionMatches.length > 0 ||
		invalidAgeCount > 2 ||
		breakdown.sanctionsMatch > 0
	) {
		level = "critical";
	} else if (score >= 70 || invalidAgeCount > 0) {
		level = "high";
	} else if (score >= 30) {
		level = "medium";
	}
	const hasRequired = requiredFields.every((f) => !!f);
	const autoApproveSuggested =
		score <= 5 && sanctionMatches.length === 0 && hasRequired;
	return {
		score,
		level,
		breakdown,
		reasons,
		sanctionMatches,
		autoApproveSuggested,
	};
}

export function getRiskBadgeColor(
	level: "low" | "medium" | "high" | "critical",
): string {
	switch (level) {
		case "low":
			return "bg-success/10 text-success border border-success";
		case "medium":
			return "bg-warning/10 text-warning border border-warning";
		case "high":
			return "bg-error/10 text-error border border-error";
		case "critical":
			return "bg-error text-white border border-error";
	}
}

export function formatSanctionsSummary(
	matches: { inputName: string; sanctionedName: string; similarity: number }[],
): string {
	if (!matches || matches.length === 0) return "No sanctions match found";
	const uniq = Array.from(new Set(matches.map((m) => m.inputName)));
	return `Sanctions Match Found: ${uniq.join(", ")}`;
}

export { normalizeNameForMatch, parseDOBToDate };
