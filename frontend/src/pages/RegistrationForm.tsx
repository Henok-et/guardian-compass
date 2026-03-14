import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import Step1Organization, {
	OrganizationInfo,
} from "@/components/registration/Step1Organization";
import ExecutiveStep from "@/components/forms/ExecutiveStep";
import { ExecutiveInfo } from "@/schemas/executiveSchema";
import BoardMembersStep from "@/components/forms/BoardMembersStep";
import { BoardMember } from "@/schemas/boardMembersSchema";
import GovernanceStep from "@/components/forms/GovernanceStep";
import { GovernanceInfo } from "@/schemas/governanceSchema";
import ActivitiesStep from "@/components/forms/ActivitiesStep";
import { ActivitiesInfo } from "@/schemas/activitiesSchema";
import LegalDeclarationStep from "@/components/forms/LegalDeclarationStep";
function RegistrationForm() {
	const steps = [
		"Organization Information",
		"Executive Leadership",
		"Board Members",
		"Youth Leadership Verification",
		"Activities and Impact",
		"Document Verification",
		"Legal Declaration",
	];

	const initialFormState = {
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

	const { user } = useAuthContext();
	const [step, setStep] = useState(0);
	const [formState, setFormState] = useState(() => {
		// Load draft from localStorage
		const draft = localStorage.getItem("registrationDraft");
		return draft ? JSON.parse(draft) : initialFormState;
	});
	const navigate = useNavigate();
	// Auto-save draft
	useEffect(() => {
		localStorage.setItem("registrationDraft", JSON.stringify(formState));
	}, [formState]);

	// Step completion indicator
	const stepCompleted =
		!!formState.organization.legalName &&
		!!formState.organization.registrationNumber &&
		!!formState.organization.country &&
		!!formState.organization.yearEstablished &&
		!!formState.organization.organizationType &&
		!!formState.organization.website &&
		!!formState.organization.email &&
		!!formState.organization.phone;

	// Role-based access control
	if (!user || user.role !== "user") {
		return <Navigate to="/dashboard" replace />;
	}

	// Step rendering
	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<Step1Organization
						defaultValues={formState.organization}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, organization: data }));
							setStep(1);
						}}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, organization: data }))
						}
					/>
				);
			case 1:
				return (
					<ExecutiveStep
						defaultValues={formState.executive}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, executive: data }));
							setStep(2);
						}}
						onPrev={() => setStep(0)}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, executive: data }))
						}
					/>
				);
			case 2:
				return (
					<BoardMembersStep
						defaultValues={formState.boardMembers}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, boardMembers: data }));
							setStep(3);
						}}
						onPrev={() => setStep(1)}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, boardMembers: data }))
						}
					/>
				);
			case 3:
				return (
					<GovernanceStep
						defaultValues={formState.governance}
						minBoardSize={formState.boardMembers.length}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, governance: data }));
							setStep(4);
						}}
						onPrev={() => setStep(2)}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, governance: data }))
						}
					/>
				);
			case 4:
				return (
					<ActivitiesStep
						defaultValues={formState.activities}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, activities: data }));
							setStep(5);
						}}
						onPrev={() => setStep(3)}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, activities: data }))
						}
					/>
				);
			case 5:
				return (
					<LegalDeclarationStep
						summary={{
							organizationName: formState.organization.legalName,
							country: formState.organization.country,
							executiveHead: formState.executive.fullName,
							boardCount: formState.boardMembers.length,
							operationalScope: formState.activities.operationalPresence,
						}}
						defaultValues={formState.legalDeclaration}
						onSubmit={async (data) => {
							setFormState((prev) => ({ ...prev, legalDeclaration: data }));
							// Submit application
							const res = await fetch("/api/applications", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ ...formState, legalDeclaration: data }),
							});
							if (res.ok) {
								navigate("/register/confirmation");
							} else {
								alert("Submission failed. Please try again.");
							}
						}}
						onPrev={() => setStep(4)}
						autoSave={(data) =>
							setFormState((prev) => ({ ...prev, legalDeclaration: data }))
						}
					/>
				);
			default:
				return <div>Unknown Step</div>;
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
			<h2 className="text-xl font-bold mb-4">
				Youth-Led Organization Registration
			</h2>
			<div className="mb-6">
				<div className="flex items-center flex-wrap">
					<span className="mr-2 font-semibold">
						Step {step + 1} of {steps.length}
					</span>
					{steps.map((label, idx) => (
						<React.Fragment key={label}>
							<div
								className={`flex items-center ${idx === step ? "font-bold text-primary" : "text-muted-foreground"}`}
							>
								{label}
							</div>
							{idx < steps.length - 1 && <span className="mx-2">→</span>}
						</React.Fragment>
					))}
				</div>
				{stepCompleted && (
					<div className="mt-2 text-green-600 text-sm">Step 1 completed</div>
				)}
			</div>
			<div className="mb-8">{renderStep()}</div>
		</div>
	);
}

export default RegistrationForm;
