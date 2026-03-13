// parseLeadershipFromSheet.ts

export interface SheetRow {
	[key: string]: string | undefined;

	"Full Name of Executive Head"?: string;
	"Date of Birth"?: string;
	"Role/Title"?: string;

	"Board Member 1 Full Name"?: string;
	"Board Member 1 Date of Birth"?: string;
	"Board Member 1 Role"?: string;

	"Board Member 2 Full Name"?: string;
	"Board Member 2 Date of Birth"?: string;
	"Board Member 2 Role"?: string;

	"Board Member 3 Full Name"?: string;
	"Board Member 3 Date of Birth"?: string;
	"Board Member 3 Role"?: string;

	"Who has final decision-making authority?"?: string;
}

import { LeadershipInfo } from "./riskScoring";

function calculateAge(dob?: string): number | undefined {
	if (!dob?.trim()) return undefined;
	const birthDate = new Date(dob.trim());
	if (isNaN(birthDate.getTime())) return undefined;
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
	return Math.max(0, age);
}

function getNameKey(name: string): string {
	if (!name?.trim()) return "";
	const cleaned = name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ")
		.replace(/kinde/gi, "") // remove middle name variation
		.replace(/demelash/gi, "demelash");
	return cleaned.split(" ").slice(0, 2).join(" ");
}

export function parseLeadershipFromSheet(row: SheetRow): LeadershipInfo[] {
	console.log(
		"%c=== PARSE LEADERSHIP FUNCTION CALLED ===",
		"background: #ff0000; color: white; font-size: 18px; padding: 8px; font-weight: bold;",
	);
	console.log("PARSE INPUT ────────────────────────────────");
	console.log("Full row object:", row);
	console.log("JSON version:", JSON.stringify(row, null, 2));
	console.log("Executive DOB:", row["Date of Birth"]);
	console.log("Executive role:", row["Role/Title"]);
	console.log("Board 1 name:", row["Board Member 1 Full Name"]);
	console.log("Board 1 DOB:", row["Board Member 1 Date of Birth"]);
	console.log("Board 2 name:", row["Board Member 2 Full Name"]);
	const leaders: (LeadershipInfo & { _priority: number })[] = [];
	const seenNames = new Set<string>();

	const finalDecision = (
		row["Who has final decision-making authority?"] || ""
	).trim();
	const finalDecisionKey = getNameKey(finalDecision);

	const addLeader = (
		name: string | undefined,
		dob: string | undefined,
		role: string | undefined,
		priority: number = 0,
	) => {
		if (!name?.trim()) return;

		const trimmedName = name.trim();
		const nameKey = getNameKey(trimmedName);

		if (seenNames.has(nameKey)) return;
		seenNames.add(nameKey);

		const isFinalMaker =
			finalDecisionKey === nameKey ||
			finalDecision
				.toLowerCase()
				.includes(trimmedName.toLowerCase().split(" ")[0]);

		leaders.push({
			name: trimmedName,
			dob: dob?.trim(),
			role: role?.trim() || "Board Member",
			age: calculateAge(dob),
			hasId: true,
			isFinalDecisionMaker: isFinalMaker,
			_priority: priority,
		});
	};

	// Executive Head
	addLeader(
		row["Full Name of Executive Head"],
		row["Date of Birth"],
		row["Role/Title"],
		10,
	);

	// Board Members 1–3
	// Replace the entire board members loop with this:

	for (let i = 1; i <= 3; i++) {
		const nameKey = `Board Member ${i} Full Name` as keyof SheetRow;
		const dobKey = `Board Member ${i} Date of Birth` as keyof SheetRow;
		const roleKey = `Board Member ${i} Role` as keyof SheetRow;

		const name = row[nameKey]?.trim();
		const dob = row[dobKey]?.trim();
		const role = row[roleKey]?.trim();

		// Only add if we have name AND (dob OR role) to avoid orphans
		if (!name || (!dob && !role)) {
			console.warn(`Skipping incomplete board member ${i}:`, {
				name,
				dob,
				role,
			});
			continue;
		}

		addLeader(name, dob, role, 5 - i);
	}

	// Fallback final decision maker
	if (finalDecision && !seenNames.has(finalDecisionKey)) {
		addLeader(finalDecision, undefined, "Final Decision Maker", 9);
	}

	// Sort by priority (descending) – no 'any' needed
	leaders.sort((a, b) => b._priority - a._priority);

	// Remove temporary _priority field
	return leaders.map(
		({ _priority, ...cleanLeader }) => cleanLeader as LeadershipInfo,
	);
}
