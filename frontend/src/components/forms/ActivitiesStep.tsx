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
		if (autoSave) autoSave(watch());
	}, [watch, autoSave]);

	return (
		<form onSubmit={handleSubmit(onNext)} className="space-y-4">
			<div className="card p-4">
				<div className="mb-2">
					<label className="block font-medium">
						Describe the activities your organization conducted in the last 12
						months *
					</label>
					<textarea
						{...register("activitiesDescription")}
						className="input min-h-[120px]"
						minLength={150}
						maxLength={2000}
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Include projects, community initiatives, partnerships, or events
						your organization has implemented.
					</div>
					{errors.activitiesDescription && (
						<div className="text-red-600 text-xs mt-1">
							{errors.activitiesDescription.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">
						What impact has your organization had on youth or communities? *
					</label>
					<textarea
						{...register("impactDescription")}
						className="input min-h-[100px]"
						minLength={100}
						maxLength={2000}
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Explain how your work benefits youth, communities, or social
						development.
					</div>
					{errors.impactDescription && (
						<div className="text-red-600 text-xs mt-1">
							{errors.impactDescription.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">
						Where does your organization primarily operate? *
					</label>
					<select {...register("operationalPresence")} className="input">
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
						<div className="text-red-600 text-xs mt-1">
							{errors.operationalPresence.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">
						List any partners, institutions, or organizations you collaborate
						with (optional)
					</label>
					<textarea
						{...register("partnerships")}
						className="input min-h-[60px]"
						maxLength={1000}
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Examples: Universities, government agencies, NGOs, youth networks,
						international organizations.
					</div>
				</div>
				<div className="mb-2">
					<label className="block font-medium">
						Provide links where your organization's activities can be verified *
					</label>
					<textarea
						{...register("verificationLinks")}
						className="input min-h-[60px]"
						minLength={20}
						maxLength={1000}
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Examples: Website, Facebook, LinkedIn, Instagram, news coverage.
					</div>
					{errors.verificationLinks && (
						<div className="text-red-600 text-xs mt-1">
							{errors.verificationLinks.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="flex items-center gap-2">
						<input type="checkbox" {...register("transparencyDeclaration")} />
						<span>
							I confirm that the activities described above accurately reflect
							the work of the organization.
						</span>
					</label>
					{errors.transparencyDeclaration && (
						<div className="text-red-600 text-xs mt-1">
							{errors.transparencyDeclaration.message}
						</div>
					)}
				</div>
			</div>
			<div className="flex justify-between mt-4">
				<button type="button" className="btn btn-secondary" onClick={onPrev}>
					Previous
				</button>
				<button type="submit" className="btn btn-primary">
					Next Step
				</button>
			</div>
		</form>
	);
}
