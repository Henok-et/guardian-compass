import { checkNamesAgainstSanctions, SanctionMatch } from './fuzzyMatch';

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
  level: 'low' | 'medium' | 'high';
  breakdown: RiskBreakdown;
  sanctionMatches: SanctionMatch[];
}

export interface LeadershipInfo {
  name: string;
  age: number;
  hasId: boolean;
  role: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  riskAssessment?: RiskAssessment;
}

// AU Youth age rule: 18-35 years old
const YOUTH_MIN_AGE = 18;
const YOUTH_MAX_AGE = 35;

export function calculateRiskScore(
  application: ApplicationData,
  sanctionsList: string[]
): RiskAssessment {
  const breakdown: RiskBreakdown = {
    sanctionsMatch: 0,
    missingId: 0,
    noRecentActivity: 0,
    nonYouthLeadership: 0,
    incompleteFields: 0,
    total: 0,
  };

  // Check leadership names against sanctions list
  const leadershipNames = application.leadership.map((l) => l.name);
  const sanctionMatches = checkNamesAgainstSanctions(leadershipNames, sanctionsList);

  if (sanctionMatches.length > 0) {
    breakdown.sanctionsMatch = 70;
  }

  // Check for missing IDs
  const leadersWithoutId = application.leadership.filter((l) => !l.hasId);
  if (leadersWithoutId.length > 0) {
    breakdown.missingId = 15;
  }

  // Check for recent activity proof
  if (!application.hasRecentActivityProof) {
    breakdown.noRecentActivity = 10;
  }

  // Check youth majority in leadership
  const youthLeaders = application.leadership.filter(
    (l) => l.age >= YOUTH_MIN_AGE && l.age <= YOUTH_MAX_AGE
  );
  const youthPercentage = youthLeaders.length / application.leadership.length;
  if (youthPercentage < 0.5) {
    breakdown.nonYouthLeadership = 30;
  }

  // Check for incomplete required fields
  const requiredFields = [
    application.organizationName,
    application.registrationNumber,
    application.country,
    application.email,
    application.missionStatement,
  ];
  const incompleteCount = requiredFields.filter((f) => !f || f.trim() === '').length;
  if (incompleteCount > 0) {
    breakdown.incompleteFields = incompleteCount * 5;
  }

  // Calculate total
  breakdown.total =
    breakdown.sanctionsMatch +
    breakdown.missingId +
    breakdown.noRecentActivity +
    breakdown.nonYouthLeadership +
    breakdown.incompleteFields;

  // Determine risk level
  let level: 'low' | 'medium' | 'high';
  if (breakdown.total >= 50) {
    level = 'high';
  } else if (breakdown.total >= 25) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    score: Math.min(breakdown.total, 100),
    level,
    breakdown,
    sanctionMatches,
  };
}

export function getRiskBadgeColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
  }
}
