import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activitiesSchema, ActivitiesInfo } from "@/schemas/activitiesSchema";

export default function ActivitiesStep({
	defaultValues,
	onNext,
	onPrev,
	autoSave,
}: {
	defaultValues: ActivitiesInfo;
	onNext: (data: ActivitiesInfo) => void;
	onPrev: () => void;
	autoSave?: (data: ActivitiesInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<ActivitiesInfo>({
		resolver: zodResolver(activitiesSchema),
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
		<form onSubmit={handleSubmit(onNext)} className="space-y-6">
			<div className="card p-6 sm:p-8">
				<div className="space-y-6">
					<div>
						<label className="form-label">
							Describe the activities your organization conducted in the last 12
							months *
						</label>
						<textarea
							{...register("activitiesDescription")}
							className={`form-input min-h-[120px] resize-y ${errors.activitiesDescription ? "form-input-error" : ""}`}
							minLength={150}
							maxLength={2000}
						/>
						<div className="text-xs text-muted-foreground mt-2">
							Include projects, community initiatives, partnerships, or events
							your organization has implemented. (Min 150 chars, Max 2000 chars)
						</div>
						{errors.activitiesDescription && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.activitiesDescription.message}
							</div>
						)}
					</div>
					
					<div>
						<label className="form-label">
							What impact has your organization had on youth or communities? *
						</label>
						<textarea
							{...register("impactDescription")}
							className={`form-input min-h-[100px] resize-y ${errors.impactDescription ? "form-input-error" : ""}`}
							minLength={100}
							maxLength={2000}
						/>
						<div className="text-xs text-muted-foreground mt-2">
							Explain how your work benefits youth, communities, or social
							development.
						</div>
						{errors.impactDescription && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.impactDescription.message}
							</div>
						)}
					</div>
					
					<div>
						<label className="form-label">
							Where does your organization primarily operate? *
						</label>
						<select {...register("operationalPresence")} className={`form-input ${errors.operationalPresence ? "form-input-error" : ""}`}>
							<option value="">Select presence</option>
							<option value="Local community">Local community</option>
							<option value="City level">City level</option>
							<option value="National level">National level</option>
							<option value="Regional (multiple countries)">
								Regional (multiple countries)
							</option>
							<option value="Continental">Continental</option>
						</select>
						{errors.operationalPresence && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.operationalPresence.message}
							</div>
						)}
					</div>
					
					<div className="pt-4 border-t border-border/50">
						<label className="form-label">
							List any partners, institutions, or organizations you collaborate
							with (optional)
						</label>
						<textarea
							{...register("partnerships")}
							className="form-input min-h-[80px] resize-y"
							maxLength={1000}
						/>
						<div className="text-xs text-muted-foreground mt-2">
							Examples: Universities, government agencies, NGOs, youth networks,
							international organizations.
						</div>
					</div>
					
					<div>
						<label className="form-label">
							Provide links where your organization's activities can be verified *
						</label>
						<textarea
							{...register("verificationLinks")}
							className={`form-input min-h-[80px] resize-y ${errors.verificationLinks ? "form-input-error" : ""}`}
							minLength={20}
							maxLength={1000}
						/>
						<div className="text-xs text-muted-foreground mt-2">
							Examples: Website, Facebook, LinkedIn, Instagram, news coverage. Include full URLs.
						</div>
						{errors.verificationLinks && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.verificationLinks.message}
							</div>
						)}
					</div>
					
					<div className="pt-4 border-t border-border/50">
						<label className="flex items-start gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								{...register("transparencyDeclaration")} 
								className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
							/>
							<span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
								I confirm that the activities described above accurately reflect
								the work of the organization.
							</span>
						</label>
						{errors.transparencyDeclaration && (
							<div className="text-error text-xs pl-7 mt-1 font-medium">
								{errors.transparencyDeclaration.message}
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
					Continue
				</button>
			</div>
		</form>
	);
}
