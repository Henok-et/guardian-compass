import Fuse from "fuse.js";

// Lightweight risk service: expose calculateRisk and allow a sanctions index to be set
let fuseIndex = null;

export function buildSanctionsIndex(list = []) {
	fuseIndex = new Fuse(list, { threshold: 0.45 });
}

export function isSanctioned(name) {
	if (!name || !fuseIndex) return false;
	const res = fuseIndex.search(name);
	return res.length > 0 && (res[0].score || 0) <= 0.45;
}

export function calculateRisk(app) {
	const ageScore = Math.min(
		10,
		new Date().getFullYear() - (app.yearEstablished || 2000),
	);
	const idScore =
		(app.leadership.filter((l) => l.hasId).length /
			(app.leadership.length || 1)) *
		10;
	const activityScore = app.hasRecentActivityProof ? 10 : 0;
	const totalScore = 30 - (ageScore + idScore + activityScore);
	let riskLevel = "low";
	if (totalScore >= 20) riskLevel = "high";
	else if (totalScore >= 10) riskLevel = "medium";
	return { riskScore: Math.max(0, totalScore), riskLevel };
}
