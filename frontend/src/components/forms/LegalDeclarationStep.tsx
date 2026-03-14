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
		organizationName: string;
		country: string;
		executiveHead: string;
		boardCount: number;
		operationalScope: string;
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
		if (autoSave) autoSave(watch());
	}, [watch, autoSave]);

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="card p-4">
				<div className="mb-4">
					<div className="font-bold text-lg mb-2">Application Summary</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<div>
							<span className="font-medium">Organization Name:</span>{" "}
							{summary.organizationName}
						</div>
						<div>
							<span className="font-medium">Country:</span> {summary.country}
						</div>
						<div>
							<span className="font-medium">Executive Head:</span>{" "}
							{summary.executiveHead}
						</div>
						<div>
							<span className="font-medium">Number of Board Members:</span>{" "}
							{summary.boardCount}
						</div>
						<div>
							<span className="font-medium">Operational Scope:</span>{" "}
							{summary.operationalScope}
						</div>
					</div>
				</div>
				<div className="mb-2">
					<label className="flex items-center gap-2">
						<input type="checkbox" {...register("legalDeclaration")} />
						<span>
							I confirm that all information provided in this application is
							true and accurate to the best of my knowledge.
						</span>
					</label>
					{errors.legalDeclaration && (
						<div className="text-red-600 text-xs mt-1">
							{errors.legalDeclaration.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<div className="text-yellow-700 text-xs font-semibold">
						Submitting false or misleading information may result in rejection
						of the application and potential restriction from future AU Youth
						registration processes.
					</div>
				</div>
				<div className="mb-2">
					<label className="flex items-center gap-2">
						<input type="checkbox" {...register("authorization")} />
						<span>
							I authorize the African Union Women, Gender & Youth Directorate to
							review and verify the information submitted in this application.
						</span>
					</label>
					{errors.authorization && (
						<div className="text-red-600 text-xs mt-1">
							{errors.authorization.message}
						</div>
					)}
				</div>
			</div>
			<div className="flex justify-between mt-4">
				<button type="button" className="btn btn-secondary" onClick={onPrev}>
					Previous
				</button>
				<button type="submit" className="btn btn-primary">
					Submit Application
				</button>
			</div>
		</form>
	);
}
