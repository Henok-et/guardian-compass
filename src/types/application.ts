// src/types/application.ts
import { RiskBreakdown } from "@/lib/riskScoring";

// Base shared fields for all applications
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BaseApplication {
	id: string;
	organizationName: string;
	registrationNumber?: string;
	email: string;
	phone?: string;
	country: string;
	city?: string;
	website?: string;
	memberCount: number;
	yearEstablished?: string | number;
	missionStatement?: string;
	leadership: Array<{
		name: string;
		role?: string;
		age?: number;
		dob?: string;
		hasId?: boolean;
		isFinalDecisionMaker?: boolean;
	}>;
	status: "pending" | "approved" | "rejected" | "flagged";
	submittedAt: string;
}

// Application from API (with computed risk)
export interface ApplicationWithRisk extends BaseApplication {
	riskAssessment: {
		autoApproveSuggested: boolean;
		score: number;
		level: "low" | "medium" | "high" | "critical";
		breakdown: RiskBreakdown;
		sanctionMatches: Array<{
			inputName: string;
			sanctionedName: string;
			similarity: number;
		}>;
	};
}

// Tracked application (after approve/flag/reject)
export interface TrackedApplication extends BaseApplication {
	// Risk is optional (might not be recalculated)
	riskAssessment?: {
		score: number;
		level: "low" | "medium" | "high" | "critical";
		breakdown: RiskBreakdown;
		sanctionMatches: Array<{
			inputName: string;
			sanctionedName: string;
			similarity: number;
		}>;
	};

	// Tracking metadata – now OPTIONAL
	actionDate?: string;
	actionBy?: string;
	notes?: string;
	actionType?: "approved" | "flagged" | "rejected" | "created" | "updated";
}
// Union type — use this everywhere as "Application"
export type Application = ApplicationWithRisk | TrackedApplication;

// Type guard: check if app is tracked (has action metadata)
export function isTrackedApplication(
	app: Application,
): app is TrackedApplication {
	return "actionDate" in app && "actionType" in app;
}

// Helper: safely get status (works for both types)
export function getStatus(app: Application): Application["status"] {
	return app.status;
}

// Helper: safely get action date (falls back to submittedAt)
export function getActionDate(app: Application): string {
	return isTrackedApplication(app) ? app.actionDate : app.submittedAt;
}

// Helper: convert any app to tracked version (for actions)
export function toTrackedApplication(
	app: Partial<ApplicationWithRisk>,
	actionType: TrackedApplication["actionType"] = "created",
	notes?: string,
	actionBy?: string,
): TrackedApplication {
	const now = new Date().toISOString();

	return {
		id: app.id || "",
		organizationName: app.organizationName || "",
		email: app.email || "",
		country: app.country || "",
		memberCount: app.memberCount || 0,
		leadership: app.leadership || [],
		status: (app.status as any) || "pending",
		submittedAt: app.submittedAt || now,

		// Optional fields
		registrationNumber: app.registrationNumber,
		phone: app.phone,
		city: app.city,
		website: app.website,
		yearEstablished: app.yearEstablished,
		missionStatement: app.missionStatement,

		// Risk (if available)
		riskAssessment: app.riskAssessment,

		// Tracking fields
		actionDate: now,
		actionType,
		notes: notes || "",
		actionBy,
	};
}

// Rejected record (for duplicate detection)
export interface RejectedRecord {
	organizationName: string;
	registrationNumber?: string;
	email: string;
	phone?: string;
	country: string;
	rejectedDate: string;
	reason?: string;
}
