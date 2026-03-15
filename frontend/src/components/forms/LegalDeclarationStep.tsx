import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	legalDeclarationSchema,
	LegalDeclarationInfo,
} from "@/schemas/legalDeclarationSchema";

export default function LegalDeclarationStep({
	summary,
	defaultValues,
	onSubmit,
	onPrev,
	autoSave,
}: {
	summary: {
		organization: any;
		executive: any;
		boardCount: number;
		activities: any;
	};
	defaultValues: LegalDeclarationInfo;
	onSubmit: (data: LegalDeclarationInfo) => void;
	onPrev: () => void;
	autoSave?: (data: LegalDeclarationInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<LegalDeclarationInfo>({
		resolver: zodResolver(legalDeclarationSchema),
		defaultValues,
		mode: "onBlur",
	});

	// Auto-save draft
	React.useEffect(() => {
		if (!autoSave) return;
		const subscription = watch((value) => {
			autoSave(value as any);
		});
		return () => subscription.unsubscribe();
	}, [watch, autoSave]);

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="card p-6 sm:p-8">
				<div className="mb-6 pb-6 border-b border-border/50">
					<div className="font-bold text-lg text-foreground mb-4">Application Summary</div>
					<div className="space-y-6 text-sm">
						{/* Organization Section */}
						<div className="bg-muted/30 rounded-xl p-4 border border-border/50">
							<h4 className="font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
								Organization Details
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
								<div>
									<span className="text-muted-foreground block text-xs">Legal Name</span>
									<span className="font-medium">{summary.organization.legalName}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Type</span>
									<span className="font-medium">{summary.organization.organizationType}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Registration #</span>
									<span className="font-medium">{summary.organization.registrationNumber}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Country</span>
									<span className="font-medium">{summary.organization.country}</span>
								</div>
							</div>
						</div>

						{/* Leadership & Board Section */}
						<div className="bg-muted/30 rounded-xl p-4 border border-border/50">
							<h4 className="font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
								Leadership & Governance
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
								<div>
									<span className="text-muted-foreground block text-xs">Executive Head</span>
									<span className="font-medium">{summary.executive.fullName}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Board Members</span>
									<span className="font-medium">{summary.boardCount} listed</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">ID Document</span>
									<span className="text-success font-medium flex items-center gap-1">
										<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
										Uploaded
									</span>
								</div>
							</div>
						</div>

						{/* Activities Section */}
						<div className="bg-muted/30 rounded-xl p-4 border border-border/50">
							<h4 className="font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2 2 0 012 2v.653a2 2 0 01-.732 1.545l-1.618 1.292a2 2 0 01-1.242.433L10 18a2 2 0 01-2-2 2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-2-2 2 2 0 012-2 2 2 0 002-2V4.5A2.5 2.5 0 004.5 2 2.25 2.25 0 003 3.935z" /></svg>
								Impact & Activities
							</h4>
							<div className="space-y-3">
								<div>
									<span className="text-muted-foreground block text-xs">Operational Presence</span>
									<span className="font-medium">{summary.activities.operationalPresence}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Thematic Focus</span>
									<span className="font-medium line-clamp-2">{summary.activities.activitiesDescription}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div>
						<label className="flex items-start gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								{...register("legalDeclaration")} 
								className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
							/>
							<span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
								I confirm that all information provided in this application is
								true and accurate to the best of my knowledge.
							</span>
						</label>
						{errors.legalDeclaration && (
							<div className="text-error text-xs pl-7 mt-1.5 font-medium">
								{errors.legalDeclaration.message}
							</div>
						)}
					</div>

					<div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
						<div className="flex gap-3">
							<svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<div className="text-warning-foreground text-sm font-medium leading-relaxed">
								Submitting false or misleading information may result in rejection
								of the application and potential restriction from future AU Youth
								registration processes.
							</div>
						</div>
					</div>

					<div>
						<label className="flex items-start gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								{...register("authorization")} 
								className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
							/>
							<span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
								I authorize the African Union Women, Gender & Youth Directorate to
								review and verify the information submitted in this application.
							</span>
						</label>
						{errors.authorization && (
							<div className="text-error text-xs pl-7 mt-1.5 font-medium">
								{errors.authorization.message}
							</div>
						)}
					</div>
				</div>
			</div>
			
			<div className="flex justify-between items-center pt-4">
				<button type="button" className="btn btn-secondary px-6" onClick={onPrev}>
					Previous
				</button>
				<button type="submit" className="btn btn-primary px-8">
					Submit Application
				</button>
			</div>
		</form>
	);
}
