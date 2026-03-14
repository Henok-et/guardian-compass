import { OrganizationInfo } from "@/components/registration/Step1Organization";
import { ExecutiveInfo } from "@/schemas/executiveSchema";
import { BoardMember } from "@/schemas/boardMembersSchema";
import { ActivitiesInfo } from "@/schemas/activitiesSchema";
import { LegalDeclarationInfo } from "@/schemas/legalDeclarationSchema";
import { GovernanceInfo } from "@/schemas/governanceSchema";
export interface RegistrationFormState {
	organization: OrganizationInfo;
	executive: ExecutiveInfo;
	boardMembers: BoardMember[];
	governance: GovernanceInfo;
	youthVerification: unknown;
	activities: ActivitiesInfo;
	documents: unknown;
	legalDeclaration: LegalDeclarationInfo;
}

export const initialRegistrationState: RegistrationFormState = {
	organization: {
		legalName: "",
		registrationNumber: "",
		country: "",
		yearEstablished: new Date().getFullYear(),
		organizationType: "NGO",
		website: "",
		socialMedia: "",
		email: "",
		phone: "",
	},
	executive: {
		fullName: "",
		dateOfBirth: "",
		gender: undefined,
		role: "",
		phone: "",
		email: "",
		idDocument: null,
	},
	boardMembers: [],
	governance: {
		decisionAuthority: "",
		boardSize: 0,
		governanceDeclaration: false,
		leadershipResponsibilityDeclaration: false,
	},
	youthVerification: {},
	activities: {
		activitiesDescription: "",
		impactDescription: "",
		operationalPresence: "Local community",
		partnerships: "",
		verificationLinks: "",
		transparencyDeclaration: false,
	},
	documents: {},
	legalDeclaration: {
		legalDeclaration: false,
		authorization: false,
	},
};
