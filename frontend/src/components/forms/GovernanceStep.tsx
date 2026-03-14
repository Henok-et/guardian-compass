import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { governanceSchema, GovernanceInfo } from "@/schemas/governanceSchema";

export default function GovernanceStep({
	defaultValues,
	minBoardSize,
	onNext,
	onPrev,
	autoSave,
}: {
	defaultValues: GovernanceInfo;
	minBoardSize: number;
	onNext: (data: GovernanceInfo) => void;
	onPrev: () => void;
	autoSave?: (data: GovernanceInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		watch,
	} = useForm<GovernanceInfo>({
		resolver: zodResolver(governanceSchema),
		defaultValues,
		mode: "onBlur",
	});

	// Auto-save draft
	React.useEffect(() => {
		if (autoSave) autoSave(watch());
	}, [watch, autoSave]);

	// Board size validation
	const boardSize = watch("boardSize");
	React.useEffect(() => {
		if (boardSize < minBoardSize) {
			setValue("boardSize", minBoardSize);
		}
	}, [boardSize, minBoardSize, setValue]);

	return (
		<form onSubmit={handleSubmit(onNext)} className="space-y-4">
			<div className="card p-4">
				<div className="mb-2">
					<label className="block font-medium">Decision Authority *</label>
					<input
						{...register("decisionAuthority")}
						className="input"
						autoComplete="off"
					/>
					{errors.decisionAuthority && (
						<div className="text-red-600 text-xs mt-1">
							{errors.decisionAuthority.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Total Board Size *</label>
					<input
						type="number"
						{...register("boardSize", { valueAsNumber: true })}
						className="input"
						min={minBoardSize}
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Must be ≥ number of board members submitted ({minBoardSize})
					</div>
					{errors.boardSize && (
						<div className="text-red-600 text-xs mt-1">
							{errors.boardSize.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="flex items-center gap-2">
						<input type="checkbox" {...register("governanceDeclaration")} />
						<span>
							I confirm that the information provided about the organization's
							leadership structure is accurate and complete.
						</span>
					</label>
					{errors.governanceDeclaration && (
						<div className="text-red-600 text-xs mt-1">
							{errors.governanceDeclaration.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							{...register("leadershipResponsibilityDeclaration")}
						/>
						<span>
							I confirm that the individuals listed as executive and board
							members are actively involved in the governance and
							decision-making of the organization.
						</span>
					</label>
					{errors.leadershipResponsibilityDeclaration && (
						<div className="text-red-600 text-xs mt-1">
							{errors.leadershipResponsibilityDeclaration.message}
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
