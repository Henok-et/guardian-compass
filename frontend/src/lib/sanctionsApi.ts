// sanctionsApi.ts

export interface SanctionPerson {
	name: string;
	country?: string;
	program?: string;
}

/**
 * This function simulates calling a sanctions database.
 * Later you can replace this with a real API.
 */
export async function searchSanctions(
	names: string[],
): Promise<SanctionPerson[]> {
	// Mock sanctions list
	const sanctionsDatabase: SanctionPerson[] = [
		{ name: "John Doe" },
		{ name: "Ali Hassan" },
		{ name: "Mohamed Ibrahim" },
	];

	// Match by name (simple contains)
	const matches = sanctionsDatabase.filter((person) =>
		names.some((n) => person.name.toLowerCase().includes(n.toLowerCase())),
	);

	return matches;
}
