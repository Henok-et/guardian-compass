import type { ApplicationWithRisk } from "@/types/application";

export function calculateStatusData(applications: ApplicationWithRisk[]) {
	return [
		{
			name: "Approved",
			value: applications.filter((app) => app.status === "approved").length,
			color: "#22c55e",
		},
		{
			name: "Pending",
			value: applications.filter((app) => app.status === "pending").length,
			color: "#eab308",
		},
		{
			name: "Rejected",
			value: applications.filter((app) => app.status === "rejected").length,
			color: "#ef4444",
		},
		{
			name: "Flagged",
			value: applications.filter((app) => app.status === "flagged").length,
			color: "#f97316",
		},
	].filter((item) => item.value > 0);
}

export function calculateCountryData(applications: ApplicationWithRisk[]) {
	const countryMap = new Map<string, number>();
	applications.forEach((app) => {
		if (app.country) {
			const count = countryMap.get(app.country) || 0;
			countryMap.set(app.country, count + 1);
		}
	});
	// Convert to array, sort by count descending, take top 10
	return Array.from(countryMap.entries())
		.map(([country, count]) => ({ country, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);
}

export function calculateTimelineData(applications: ApplicationWithRisk[]) {
	const months: { [key: string]: number } = {};
	applications.forEach((app) => {
		const date = new Date(app.submittedAt);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		months[monthKey] = (months[monthKey] || 0) + 1;
	});
	return Object.entries(months)
		.map(([month, count]) => ({ month, count }))
		.sort((a, b) => a.month.localeCompare(b.month))
		.slice(-12); // last 12 months
}

export function filterApplications(
	applications: ApplicationWithRisk[],
	selectedCountry: string,
	searchQuery: string,
	africanCountries: string[],
) {
	let filtered = applications;
	if (selectedCountry !== "all") {
		filtered = filtered.filter((app) => app.country === selectedCountry);
	}
	if (searchQuery) {
		const query = searchQuery.toLowerCase();
		filtered = filtered.filter(
			(app) =>
				app.organizationName?.toLowerCase().includes(query) ||
				app.email?.toLowerCase().includes(query) ||
				app.country?.toLowerCase().includes(query) ||
				app.registrationNumber?.toLowerCase().includes(query),
		);
	}
	return filtered;
}

export function getRecentApplications(
	filteredApplications: ApplicationWithRisk[],
	count: number = 5,
) {
	return [...filteredApplications]
		.sort(
			(a, b) =>
				new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
		)
		.slice(0, count);
}

export function getAvailableCountries(
	applications: ApplicationWithRisk[],
	africanCountries: string[],
) {
	const countries = new Set(
		applications.map((app) => app.country).filter(Boolean),
	);
	return Array.from(countries)
		.filter((c) =>
			africanCountries.some((ac) => ac.toLowerCase() === c.toLowerCase()),
		)
		.sort();
}
