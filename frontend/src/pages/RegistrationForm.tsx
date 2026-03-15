// Removed corrupted fragment
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import Step1Organization from "@/components/registration/Step1Organization";
import ExecutiveStep from "@/components/forms/ExecutiveStep";
import BoardMembersStep from "@/components/forms/BoardMembersStep";
import ActivitiesStep from "@/components/forms/ActivitiesStep";
import LegalDeclarationStep from "@/components/forms/LegalDeclarationStep";
import GovernanceStep from "@/components/forms/GovernanceStep";

function RegistrationForm() {
	const steps = [
		"Organization Information",
		"Executive Leadership",
		"Board Members",
		"Governance & Youth Compliance",
		"Activities & Impact",
		"Legal Declaration",
	];
	
	const { user, isLoading } = useAuthContext();
	const [step, setStep] = useState(0);
	const [formState, setFormState] = useState(() => {
		const draft = localStorage.getItem("registrationDraft");
		return draft ? JSON.parse(draft) : {
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
	});
	const navigate = useNavigate();
	const [isDark, setIsDark] = useState(false);
	useEffect(() => {
		localStorage.setItem("registrationDraft", JSON.stringify(formState));
	}, [formState]);
	useEffect(() => {
		const saved = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const initialDark = saved === "dark" || (!saved && prefersDark);
		setIsDark(initialDark);
		document.documentElement.classList.toggle("dark", initialDark);
	}, []);
	const toggleTheme = () => {
		const newDark = !isDark;
		setIsDark(newDark);
		localStorage.setItem("theme", newDark ? "dark" : "light");
		document.documentElement.classList.toggle("dark", newDark);
	};

	const handleLogout = () => {
		localStorage.removeItem("au_verification_auth");
		navigate("/login");
	};

	const autoSaveOrganization = React.useCallback((data: any) => setFormState((prev) => ({ ...prev, organization: data })), []);
	const autoSaveExecutive = React.useCallback((data: any) => setFormState((prev) => ({ ...prev, executive: data })), []);
	const autoSaveBoardMembers = React.useCallback((data: any) => setFormState((prev) => ({ ...prev, boardMembers: data })), []);
	const autoSaveGovernance = React.useCallback((data: any) => setFormState((prev) => ({ ...prev, governance: data })), []);
	const autoSaveActivities = React.useCallback((data: any) => setFormState((prev) => ({ ...prev, activities: data })), []);

	const clearDraft = () => {
		if (window.confirm("Are you sure you want to clear your current progress? All data will be lost.")) {
			localStorage.removeItem("registrationDraft");
			setFormState({
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
			});
			setStep(0);
		}
	};

	const validateStep = () => {
		switch (step) {
			case 0:
				return (
					!!formState.organization.legalName &&
					!!formState.organization.registrationNumber &&
					!!formState.organization.country
				);
			case 1:
				return !!formState.executive.fullName && !!formState.executive.email;
			case 2:
				return formState.boardMembers.length > 0;
			case 3:
				return !!formState.governance.decisionAuthority;
			case 4:
				return !!formState.activities.activitiesDescription;
			case 5:
				return !!formState.legalDeclaration.legalDeclaration;
			default:
				return true;
		}
	};

	const goNext = () => {
		if (validateStep()) setStep((s) => Math.min(s + 1, steps.length - 1));
	};
	const goPrev = () => {
		setStep((s) => Math.max(s - 1, 0));
	};

	const stepCompleted =
		!!formState.organization.legalName &&
		!!formState.organization.registrationNumber &&
		!!formState.organization.country &&
		!!formState.organization.yearEstablished &&
		!!formState.organization.organizationType &&
		!!formState.organization.website &&
		!!formState.organization.email &&
		!!formState.organization.phone;

	if (isLoading) {
		return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
	}

	if (!user || user.role !== "user") {
		return <Navigate to="/dashboard" replace />;
	}

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
						autoSave={autoSaveOrganization}
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
						autoSave={autoSaveExecutive}
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
						autoSave={autoSaveBoardMembers}
					/>
				);
			case 3:
				return (
					<GovernanceStep
						defaultValues={formState.governance}
						onNext={(data) => {
							setFormState((prev) => ({ ...prev, governance: data }));
							setStep(4);
						}}
						onPrev={() => setStep(2)}
						autoSave={autoSaveGovernance}
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
						autoSave={autoSaveActivities}
					/>
				);
			case 5:
				return (
					<LegalDeclarationStep
						summary={{
							organization: formState.organization,
							executive: formState.executive,
							boardCount: formState.boardMembers.length,
							activities: formState.activities,
						}}
						defaultValues={formState.legalDeclaration}
						onPrev={() => setStep(4)}
						onSubmit={async (data) => {
							setFormState((prev) => ({ ...prev, legalDeclaration: data }));
							// Get the authentication token from localStorage
							const storedAuth = localStorage.getItem("au_verification_auth");
							let token = "";
							if (storedAuth) {
								try {
									const parsed = JSON.parse(storedAuth);
									if (parsed.token) token = parsed.token;
								} catch (e) {
									console.error("Failed to parse auth token", e);
								}
							}

							const res = await fetch("/api/applications", {
								method: "POST",
								headers: { 
									"Content-Type": "application/json",
									"Authorization": `Bearer ${token}`
								},
								body: JSON.stringify({ ...formState, legalDeclaration: data }),
							});
							if (res.ok) {
								localStorage.removeItem("registrationDraft"); // clear draft on success
								navigate("/success");
							} else {
								console.error("Failed to submit application");
							}
						}}
					/>
				);
			default:
				return null;
		}
	};

	const getStepGuidance = () => {
		switch (step) {
			case 0:
				return "Verify your organization's legal status. Have your registration certificate ready.";
			case 1:
				return "Provide details for the top executive. You'll need to upload their legal ID.";
			case 2:
				return "List at least 3 board members.";
			case 3:
				return "Confirm how decisions are made and declare your governance structure.";
			case 4:
				return "Describe your impact over the last 12 months with verifiable links.";
			case 5:
				return "Review your application summary and sign the final legal declaration.";
			default:
				return "Complete the required fields to continue.";
		}
	};

	return (
		<div className="min-h-screen bg-muted/30 flex flex-col md:flex-row md:h-screen md:overflow-hidden">
			{/* Left Sidebar */}
			<div className="w-full md:w-[320px] lg:w-[380px] bg-card border-r border-border/40 flex flex-col shrink-0 h-auto md:h-full">
				{/* Sidebar Header */}
				<div className="p-6 md:p-8 border-b border-border/40">
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
									<span className="font-bold text-lg text-primary leading-none">AU</span>
								</div>
								<div>
									<h1 className="font-bold text-lg text-foreground tracking-tight leading-tight">Registration</h1>
									<p className="text-xs text-muted-foreground font-medium">Youth Organization</p>
								</div>
							</div>
							
							{/* Utility Nav (Mobile only, hidden on desktop as it moves to bottom) */}
							<div className="md:hidden flex items-center gap-2">
								<button
									onClick={clearDraft}
									className="text-xs font-semibold text-destructive hover:text-destructive/80 mr-2"
								>
									Clear Form
								</button>
								<button
									className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/70 hover:bg-muted"
								>
									{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
								</button>
								<button onClick={handleLogout} className="text-xs font-semibold text-muted-foreground">
									Logout
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar Content (Scrollable on desktop) */}
				<div className="flex-1 p-6 md:p-8 overflow-y-auto hidden md:flex md:flex-col gap-8">
					{/* Progress Overview */}
					<div>
						<div className="flex items-end justify-between mb-2">
							<div className="text-sm font-bold text-primary">
								Step {step + 1} of {steps.length}
							</div>
							<div className="text-sm font-medium text-muted-foreground">
								{Math.round(((step) / (steps.length - 1)) * 100)}%
							</div>
						</div>
						<div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
							<div 
								className="h-full bg-primary transition-all duration-500 ease-out"
								style={{ width: `${((step) / (steps.length - 1)) * 100}%` }}
							/>
						</div>
					</div>

					{/* Vertical Stepper List */}
					<div className="space-y-1 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/40 before:to-transparent hidden">
						{/* Keeping it simple instead of complex timeline */}
					</div>
					
					<div className="space-y-4">
						{steps.map((label, idx) => {
							const completed = idx < step;
							const current = idx === step;
							const pending = idx > step;
							
							return (
								<div key={label} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${current ? "bg-primary/5 border-primary/30" : "border-transparent"}`}>
									<div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completed ? "bg-primary text-primary-foreground" : current ? "bg-background border-2 border-primary text-primary" : "bg-muted text-muted-foreground"}`}>
										{completed ? "✓" : idx + 1}
									</div>
									<div className="pt-0.5">
										<p className={`text-sm font-medium ${current ? "text-primary" : pending ? "text-muted-foreground" : "text-foreground"}`}>
											{label}
										</p>
										{current && (
											<p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
												{getStepGuidance()}
											</p>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Eligibility Reminder Card */}
					<div className="mt-auto pt-6">
						<div className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
							<div className="flex items-start gap-3">
								<svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<h4 className="text-sm font-bold text-foreground">Youth-Led Criteria</h4>
									<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
										Organizations must demonstrate at least 51% youth ownership (ages 15-35) in board and executive roles.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar Footer (Desktop) */}
				<div className="hidden md:flex flex-col gap-3 p-6 border-t border-border/40 bg-muted/10">
					<div className="flex items-center gap-2">
						<button onClick={clearDraft} className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-background border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-foreground">
							Clear Form
						</button>
					</div>
					<div className="flex items-center justify-between pt-2">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
								{user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
							</div>
							<span className="truncate max-w-[120px]">{user?.name || user?.email || "User"}</span>
						</div>
						<div className="flex items-center gap-2">
							<button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
								{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							</button>
							<span className="w-px h-4 bg-border"></span>
							<button onClick={handleLogout} className="text-xs font-semibold text-muted-foreground hover:text-destructive">
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Form Content Area */}
			<div className="flex-1 flex flex-col overflow-y-auto">
				{/* Mobile Stepper Header (visible only on small screens) */}
				<div className="md:hidden p-4 border-b border-border/40 bg-card sticky top-0 z-10">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-bold text-primary">Step {step + 1} of {steps.length}</span>
						<span className="text-sm font-bold text-foreground">{steps[step]}</span>
					</div>
					<div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
						<div 
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${((step) / (steps.length - 1)) * 100}%` }}
						/>
					</div>
				</div>

				<div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
					<div className="max-w-3xl mx-auto">
						{/* Desktop Header for active step */}
						<div className="hidden md:block mb-8">
							<h2 className="text-3xl font-bold text-foreground tracking-tight">{steps[step]}</h2>
							<p className="text-muted-foreground mt-2 text-lg">
								{getStepGuidance()}
							</p>
						</div>

						{/* Ensure active form step takes full width of container */}
						<div className="w-full">
							{renderStep()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
export default RegistrationForm;
