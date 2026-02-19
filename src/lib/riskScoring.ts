import Fuse from "fuse.js";

// Detect Node vs Browser runtime (safe check)
const isNode = (() => {
	try {
		if (typeof process === "undefined") return false;
		const p = process as unknown as { versions?: { node?: string } };
		return typeof p.versions?.node === "string";
	} catch {
		return false;
	}
})();

function getEnvVar(key: string): string | undefined {
	// Node: check process.env safely
	try {
		if (
			typeof process !== "undefined" &&
			typeof (process as unknown) === "object"
		) {
			const p = process as unknown as { env?: Record<string, string> };
			if (p.env && p.env[key]) return p.env[key];
		}
	} catch (err) {
		// Avoid logging sensitive values; log only that reading process.env failed for the key
		console.debug?.(
			`[getEnvVar] Failed to read process.env for key=${key}: ${(err as Error).message}`,
		);
	}

	// Vite/browser: check import.meta.env
	try {
		const me = import.meta as unknown as { env?: Record<string, string> };
		if (me.env && me.env[key]) return me.env[key];
	} catch (err) {
		// Avoid logging sensitive values; log only that reading import.meta.env failed for the key
		console.debug?.(
			`[getEnvVar] Failed to read import.meta.env for key=${key}: ${(err as Error).message}`,
		);
	}

	return undefined;
}

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
	// Normalize to UI-friendly shape
	sanctionMatches: {
		inputName: string;
		sanctionedName: string;
		similarity: number;
	}[];
}

export interface LeadershipInfo {
	name: string;
	role?: string;
	age?: number;
	dob?: string;
	hasId?: boolean; // may be undefined from form; will treat as false if not set
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

/* ===================== CONSTANTS & CONFIG ===================== */
const YOUTH_MIN_AGE = 15;
const YOUTH_MAX_AGE = 35;
const MIN_VALID_AGE = 15;
const MAX_VALID_AGE = 100;


const SANCTIONS_XML_PATH = getEnvVar("UN_SANCTIONS_PATH") || "consolidated.xml";
const SANCTIONS_XML_URL = getEnvVar("UN_SANCTIONS_URL") || ""; // optional online source
const SANCTIONS_CACHE_JSON =
	getEnvVar("UN_SANCTIONS_CACHE") || ".sanctions.cache.json";
const SANCTIONS_REFRESH_DAYS = Number(
	getEnvVar("UN_SANCTIONS_REFRESH_DAYS") ?? "7",
);
const FUZZY_THRESHOLD = Number(
	getEnvVar("SANCTIONS_FUZZY_THRESHOLD") ?? "0.35",
);

/* ===================== CACHE ===================== */
let sanctionedNames: string[] = [];
let fuse: Fuse<string> | null = null;
let lastLoadedAt: number | null = null; // epoch ms

/* ===================== HELPERS ===================== */

// Normalize names for fuzzy matching (remove diacritics, punctuation, titles, extra spaces)
function normalizeNameForMatch(input: string): string {
	return input
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "") // remove accents
		.replace(/\b(mr|ms|mrs|dr|prof|hon|sr|jr|ii|iii|iv)\b/gi, "")
		.replace(/[^a-zA-Z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

// Try various date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, and fallback to Date constructor)
function parseDOBToDate(dob?: string): Date | null {
	if (!dob) return null;
	const s = dob.trim();
	// ISO-like
	const iso = /^\d{4}-\d{2}-\d{2}$/;
	if (iso.test(s)) {
		const d = new Date(s);
		if (!isNaN(d.getTime())) return d;
	}
	// DD/MM/YYYY or D/M/YYYY
	const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
	const m1 = s.match(dm);
	if (m1) {
		const day = Number(m1[1]);
		const month = Number(m1[2]);
		const year = Number(m1[3]);
		const d = new Date(year, month - 1, day);
		if (!isNaN(d.getTime())) return d;
	}
	// MM/DD/YYYY ambiguous - only accept if month <=12 and day<=31 and year reasonable
	const mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
	const m2 = s.match(mm);
	if (m2) {
		const part1 = Number(m2[1]);
		const part2 = Number(m2[2]);
		const year = Number(m2[3]);
		// heuristic: if part1 > 12 then it's DD/MM/YYYY handled above. If part1 <= 12 and part2 > 12 maybe MM/DD
		if (part1 >= 1 && part1 <= 12 && part2 >= 1 && part2 <= 31) {
			const d = new Date(year, part1 - 1, part2);
			if (!isNaN(d.getTime())) return d;
		}
	}
	// Fallback to Date constructor
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

// Save parsed sanctions list to JSON cache for faster loads
async function saveSanctionsCache(list: string[]) {
	if (!isNode) return; // don't attempt file writes in browsers
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
	if (!isNode) return null; // no filesystem in browser
	try {
		const fs = await import("fs/promises");
		const stat = await fs.stat(SANCTIONS_CACHE_JSON);
		const raw = await fs.readFile(SANCTIONS_CACHE_JSON, "utf-8");
		const parsed = JSON.parse(raw) as { names: string[]; loadedAt: number };
		if (
			parsed &&
			parsed.loadedAt &&
			Date.now() - parsed.loadedAt < SANCTIONS_REFRESH_DAYS * 24 * 3600 * 1000
		) {
			return parsed.names;
		}
	} catch {
		// ignore - no cache or invalid
	}
	return null;
}

// Minimal fallback list (in case parsing fails)
const FALLBACK_NAMES = [
	"abdul bari",
	"abdul basir",
	"abdul ghafar",
	"abdul ghani",
];

// Build Fuse index
function buildFuse(names: string[]) {
	fuse = new Fuse(names, {
		includeScore: true,
		threshold: FUZZY_THRESHOLD,
		ignoreLocation: true,
		minMatchCharLength: 3,
	});
}

// Refresh sanctions list (publicly exported)
export async function refreshSanctions(force = false): Promise<string[]> {
	// If already loaded recently, skip unless forced
	if (
		!force &&
		lastLoadedAt &&
		Date.now() - lastLoadedAt < SANCTIONS_REFRESH_DAYS * 24 * 3600 * 1000
	) {
		return sanctionedNames;
	}

	// Try cache
	const cache = await loadSanctionsCacheIfFresh();
	if (cache && !force) {
		sanctionedNames = cache;
		buildFuse(sanctionedNames);
		lastLoadedAt = Date.now();
		return sanctionedNames;
	}

	// If running in a browser environment, prefer a lightweight approach and avoid filesystem access
	if (!isNode) {
		if (SANCTIONS_XML_URL) {
			try {
				const resp = await fetch(SANCTIONS_XML_URL);
				if (resp.ok) {
					const text = await resp.text();
					// naive alias extraction (best-effort in browser)
					const matches = Array.from(
						text.matchAll(/<ALIAS_NAME>([^<]+)<\/ALIAS_NAME>/gi),
					).map((m) => m[1]);
					if (matches.length > 0) {
						sanctionedNames = Array.from(
							new Set(matches.map(normalizeNameForMatch)),
						).filter(Boolean);
						buildFuse(sanctionedNames);
						lastLoadedAt = Date.now();
						return sanctionedNames;
					}
				}
			} catch (e) {
				console.warn("[Sanctions] Browser fetch failed:", (e as Error).message);
			}
		}

		// fallback in browser
		sanctionedNames = FALLBACK_NAMES;
		buildFuse(sanctionedNames);
		lastLoadedAt = Date.now();
		return sanctionedNames;
	}

	// Node: attempt to read local XML or fetch remote XML
	try {
		let xmlContent: string | null = null;
		try {
			const fs = await import("fs/promises");
			xmlContent = await fs.readFile(SANCTIONS_XML_PATH, "utf-8");
		} catch (err) {
			if (SANCTIONS_XML_URL) {
				// try download
				try {
					const resp = await fetch(SANCTIONS_XML_URL);
					if (resp.ok) xmlContent = await resp.text();
				} catch (e) {
					console.warn(
						"[Sanctions] Failed to download from URL:",
						(e as Error).message,
					);
				}
			}
		}

		if (!xmlContent) throw new Error("No XML content available");

		const { parseStringPromise } = await import("xml2js");
		const parsed = await parseStringPromise(xmlContent, {
			explicitArray: false,
			mergeAttrs: true,
			normalize: true,
			trim: true,
		});
		const individuals =
			(parsed.CONSOLIDATED_LIST?.INDIVIDUALS?.INDIVIDUAL as unknown) || [];
		const entities =
			(parsed.CONSOLIDATED_LIST?.ENTITIES?.ENTITY as unknown) || [];

		const names: string[] = [];

		// helper to push normalized name
		const pushName = (n?: string) => {
			if (!n) return;
			const norm = normalizeNameForMatch(n);
			if (norm) names.push(norm);
		};

		const arrify = (x: unknown): unknown[] =>
			x === undefined || x === null ? [] : Array.isArray(x) ? x : [x];

		function getStringProp(obj: unknown, key: string): string | undefined {
			if (!obj || typeof obj !== "object") return undefined;
			const v = (obj as Record<string, unknown>)[key];
			return typeof v === "string" ? v : undefined;
		}

		for (const ind of arrify(individuals)) {
			if (ind && typeof ind === "object") {
				const first = getStringProp(ind, "FIRST_NAME");
				const second = getStringProp(ind, "SECOND_NAME");
				const third = getStringProp(ind, "THIRD_NAME");
				if (first || second)
					pushName(`${first || ""} ${second || ""} ${third || ""}`);

				const aliasContainer = (ind as Record<string, unknown>)[
					"INDIVIDUAL_ALIAS"
				];
				const aliasNode =
					aliasContainer && typeof aliasContainer === "object"
						? (aliasContainer as Record<string, unknown>)["ALIAS"]
						: undefined;
				for (const a of arrify(aliasNode)) {
					const aliasName = getStringProp(a, "ALIAS_NAME");
					if (aliasName) pushName(aliasName);
				}
			}
		}

		for (const ent of arrify(entities)) {
			if (ent && typeof ent === "object") {
				const name = getStringProp(ent, "FIRST_NAME");
				if (name) pushName(name);
			}
		}

		sanctionedNames = Array.from(new Set(names)).filter(Boolean);
		if (sanctionedNames.length === 0) {
			// fallback
			sanctionedNames = FALLBACK_NAMES;
		}
		buildFuse(sanctionedNames);
		await saveSanctionsCache(sanctionedNames);
		lastLoadedAt = Date.now();
		console.log(
			`[Sanctions] Loaded ${sanctionedNames.length} names (from XML or download)`,
		);
		return sanctionedNames;
	} catch (err) {
		console.warn(
			"[Sanctions] Error parsing or loading sanctions list; using fallback list",
			(err as Error).message,
		);
		sanctionedNames = FALLBACK_NAMES;
		buildFuse(sanctionedNames);
		lastLoadedAt = Date.now();
		return sanctionedNames;
	}
}

/* ===================== MAIN RISK SCORING FUNCTION ===================== */

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

	// Ensure sanctions list is loaded (with cache/refresh logic)
	await refreshSanctions();

	// SANCTIONS CHECK
	const sanctionMatches: {
		inputName: string;
		sanctionedName: string;
		similarity: number;
	}[] = [];
	for (const leader of application.leadership) {
		const norm = normalizeNameForMatch(leader.name);
		if (fuse) {
			const results = fuse.search(norm);
			if (
				results.length > 0 &&
				typeof results[0].score === "number" &&
				results[0].score <= FUZZY_THRESHOLD
			) {
				const rawScore = results[0].score ?? 1;
				const similarity = Math.max(0, Math.min(1, 1 - rawScore)); // 0..1 where 1 = exact
				sanctionMatches.push({
					inputName: leader.name,
					sanctionedName: results[0].item,
					similarity,
				});
				// concise reason only (no NaN/percentage/details)
				reasons.push({
					category: "sanctions",
					reason: `Sanctions Match Found: ${leader.name}`,
				});
			}
		}
	}

	// Filter out any empty or invalid matches (defensive)
	const filteredSanctionMatches = sanctionMatches.filter(
		(m) => m.inputName && m.sanctionedName && Number.isFinite(m.similarity),
	);
	if (filteredSanctionMatches.length > 0) {
		breakdown.sanctionsMatch = 80;
	}

	// MISSING ID — treat undefined as false (form asks for first leader only sometimes)
	const leadersWithoutId = application.leadership.filter((l) => !l.hasId);
	if (leadersWithoutId.length > 0) {
		breakdown.missingId = leadersWithoutId.length * 20;
		reasons.push({
			category: "missingId",
			reason: `Leaders without ID: ${leadersWithoutId.length}`,
			value: leadersWithoutId.length,
		});
	}

	// NO RECENT ACTIVITY
	if (!application.hasRecentActivityProof) {
		breakdown.noRecentActivity = 20;
		reasons.push({
			category: "noRecentActivity",
			reason: "No recent activity proof provided",
			value: 20,
		});
	}

	// AGE VALIDATION & YOUTH CHECK
	let invalidAgeCount = 0;
	let youthCount = 0;

	for (const leader of application.leadership) {
		// Explicitly flag unrealistic provided ages (e.g., 225)
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
			continue; // skip further checks for this leader
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
	if (invalidAgeCount > 0) {
		breakdown.invalidData = invalidAgeCount * 25;
	}

	// INCOMPLETE FIELDS
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


	// TOTAL & LEVEL
	breakdown.total = Object.values(breakdown).reduce(
		(sum, v) => sum + (typeof v === "number" ? v : 0),
		0,
	);
	const score = Math.min(breakdown.total, 100);
	let level: "low" | "medium" | "high" | "critical" = "low";

	// Determine risk level with "critical" criteria
	if (
		score >= 85 ||
		sanctionMatches.length > 0 ||
		invalidAgeCount > 2 ||
		(breakdown.sanctionsMatch > 0)
	) {
		level = "critical";
	} else if (score >= 70 || invalidAgeCount > 0 ) {
		level = "high";
	} else if (score >= 30) {
		level = "medium";
	}

	return {
		score,
		level,
		breakdown,
		reasons,
		sanctionMatches: filteredSanctionMatches,
	};
}

/* ===================== UTILS ===================== */

export function getRiskBadgeColor(
	level: "low" | "medium" | "high" | "critical",
): string {
	switch (level) {
		case "low":
			return "bg-green-100 text-green-800 border-green-200";
		case "medium":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "high":
			return "bg-red-100 text-red-800 border-red-200";
		case "critical":
			return "bg-red-900 text-white border-red-900"; // Dark red for critical
	}
}

/**
 * Returns a concise sanctions summary string.
 * - If matches exist: "Sanctions Match Found: NAME[, OTHER]"
 * - If none: "No sanctions match found"
 */
export function formatSanctionsSummary(
	matches: { inputName: string; sanctionedName: string; similarity: number }[],
): string {
	if (!matches || matches.length === 0) return "No sanctions match found";
	const uniq = Array.from(new Set(matches.map((m) => m.inputName)));
	return `Sanctions Match Found: ${uniq.join(", ")}`;
}

// Exported helpers for testing
export { normalizeNameForMatch, parseDOBToDate };
