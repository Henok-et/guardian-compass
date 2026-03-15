import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { governanceSchema, GovernanceInfo } from "@/schemas/governanceSchema";

export default function GovernanceStep({
	defaultValues,
	onNext,
	onPrev,
	autoSave,
}: {
	defaultValues: GovernanceInfo;
	onNext: (data: GovernanceInfo) => void;
	onPrev: () => void;
	autoSave?: (data: GovernanceInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<GovernanceInfo>({
		resolver: zodResolver(governanceSchema),
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
					<div className="pt-4 border-t border-border/50 space-y-4">
						<label className="flex items-start gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								{...register("governanceDeclaration")} 
								className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
							/>
							<span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
								I confirm that the information provided about the organization's
								leadership structure is accurate and complete.
							</span>
						</label>
						{errors.governanceDeclaration && (
							<div className="text-error text-xs pl-7 font-medium">
								{errors.governanceDeclaration.message}
							</div>
						)}

						<label className="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								{...register("leadershipResponsibilityDeclaration")}
								className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
							/>
							<span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
								I confirm that the individuals listed as executive and board
								members are actively involved in the governance and
								decision-making of the organization.
							</span>
						</label>
						{errors.leadershipResponsibilityDeclaration && (
							<div className="text-error text-xs pl-7 font-medium">
								{errors.leadershipResponsibilityDeclaration.message}
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
