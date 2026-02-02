/* ================= TYPES ================= */
export interface SheetRow {
	[key: string]: string | undefined;
	"Leader 1 Full Name"?: string;
	"Leader 1 Date of Birth"?: string;
	"Leader 1 Role"?: string;
	"Leader 2 Full Name"?: string;
	"Leader 2 Date of Birth"?: string;
	"Leader 2 Role"?: string;
	"Leader 3 Full Name"?: string;
	"Leader 3 Date of Birth"?: string;
	"Leader 3 Role"?: string;
	"Who has final decision-making authority"?: string;

	// Executive Head columns
	"Full Name of Executive Head"?: string;
	"Date of Birth"?: string;
	"Role/Title"?: string;
}

/* ================= LOGIC ================= */

import { LeadershipInfo } from "./riskScoring";

export function parseLeadershipFromSheet(row: SheetRow): LeadershipInfo[] {
	const leaders: LeadershipInfo[] = [];

	// Leader 1–3
	for (let i = 1; i <= 3; i++) {
		const name = row[`Leader ${i} Full Name`]?.trim();
		const dob = row[`Leader ${i} Date of Birth`]?.trim();
		const role = row[`Leader ${i} Role`]?.trim();

		if (!name) continue;

		let age: number | undefined;
		if (dob) {
			const birthDate = new Date(dob);
			const today = new Date();
			age = today.getFullYear() - birthDate.getFullYear();
			const m = today.getMonth() - birthDate.getMonth();
			if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
		}

		leaders.push({
			name,
			dob,
			role,
			age,
			hasId: true,
			isFinalDecisionMaker:
				row["Who has final decision-making authority"]?.trim() === name,
		});
	}

	// Add Executive Head if not already included
	const execHead = row["Full Name of Executive Head"]?.trim();
	if (execHead && !leaders.find((l) => l.name === execHead)) {
		const dob = row["Date of Birth"]?.trim();
		const role = row["Role/Title"]?.trim();

		let age: number | undefined;
		if (dob) {
			const birthDate = new Date(dob);
			const today = new Date();
			age = today.getFullYear() - birthDate.getFullYear();
			const m = today.getMonth() - birthDate.getMonth();
			if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
		}

		leaders.push({
			name: execHead,
			dob,
			role,
			age,
			hasId: true,
			isFinalDecisionMaker:
				row["Who has final decision-making authority"]?.trim() === execHead,
		});
	}

	return leaders;
}
