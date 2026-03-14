import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boardMembersSchema, BoardMember } from "@/schemas/boardMembersSchema";

function calculateAge(dateOfBirth: string) {
	if (!dateOfBirth) return null;
	const dob = new Date(dateOfBirth);
	const diff = Date.now() - dob.getTime();
	const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
	return age;
}

function isYouth(age: number | null) {
	return age !== null && age >= 15 && age <= 35;
}

export default function BoardMembersStep({
	defaultValues,
	onNext,
	onPrev,
	autoSave,
}: {
	defaultValues: BoardMember[];
	onNext: (data: BoardMember[]) => void;
	onPrev: () => void;
	autoSave?: (data: BoardMember[]) => void;
}) {
	const {
		control,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<{ boardMembers: BoardMember[] }>({
		resolver: zodResolver(boardMembersSchema),
		defaultValues: { boardMembers: defaultValues },
		mode: "onBlur",
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "boardMembers",
	});

	// Auto-save draft
	React.useEffect(() => {
		if (autoSave) autoSave(watch("boardMembers"));
	}, [watch, autoSave]);

	// Youth ratio calculation
	const boardMembers = watch("boardMembers") || [];
	const youthCount = boardMembers.filter((bm) =>
		isYouth(calculateAge(bm.dateOfBirth)),
	).length;
	const youthPercent =
		boardMembers.length > 0
			? Math.round((youthCount / boardMembers.length) * 100)
			: 0;

	return (
		<form
			onSubmit={handleSubmit((data) => onNext(data.boardMembers))}
			className="space-y-4"
		>
			<div className="card p-4">
				<div className="mb-2">
					<div className="font-bold mb-2">Board Members</div>
					<div className="mb-4">
						<button
							type="button"
							className="btn btn-outline"
							onClick={() =>
								append({
									fullName: "",
									dateOfBirth: "",
									gender: "Male",
									role: "",
									phone: "",
									email: "",
								})
							}
							disabled={fields.length >= 15}
						>
							+ Add Board Member
						</button>
					</div>
					{fields.map((field, idx) => (
						<div key={field.id} className="mb-4 border rounded p-3 bg-muted/10">
							<div className="flex justify-between items-center mb-2">
								<div className="font-semibold">Board Member {idx + 1}</div>
								<button
									type="button"
									className="btn btn-sm btn-danger"
									onClick={() => remove(idx)}
									disabled={fields.length <= 3}
								>
									Remove
								</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								<div>
									<label className="block font-medium">Full Name *</label>
									<input
										{...control.register(`boardMembers.${idx}.fullName`)}
										className="input"
										autoComplete="off"
									/>
									{errors.boardMembers &&
										errors.boardMembers[idx]?.fullName && (
											<div className="text-red-600 text-xs mt-1">
												{errors.boardMembers[idx].fullName?.message}
											</div>
										)}
								</div>
								<div>
									<label className="block font-medium">Date of Birth *</label>
									<input
										type="date"
										{...control.register(`boardMembers.${idx}.dateOfBirth`)}
										className="input"
									/>
									{errors.boardMembers &&
										errors.boardMembers[idx]?.dateOfBirth && (
											<div className="text-red-600 text-xs mt-1">
												{errors.boardMembers[idx].dateOfBirth?.message}
											</div>
										)}
								</div>
								<div>
									<label className="block font-medium">Gender *</label>
									<select
										{...control.register(`boardMembers.${idx}.gender`)}
										className="input"
									>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
									</select>
									{errors.boardMembers && errors.boardMembers[idx]?.gender && (
										<div className="text-red-600 text-xs mt-1">
											{errors.boardMembers[idx].gender?.message}
										</div>
									)}
								</div>
								<div>
									<label className="block font-medium">Role / Position *</label>
									<input
										{...control.register(`boardMembers.${idx}.role`)}
										className="input"
										autoComplete="off"
									/>
									{errors.boardMembers && errors.boardMembers[idx]?.role && (
										<div className="text-red-600 text-xs mt-1">
											{errors.boardMembers[idx].role?.message}
										</div>
									)}
								</div>
								<div>
									<label className="block font-medium">Phone Number</label>
									<input
										{...control.register(`boardMembers.${idx}.phone`)}
										className="input"
										autoComplete="off"
									/>
								</div>
								<div>
									<label className="block font-medium">Email</label>
									<input
										{...control.register(`boardMembers.${idx}.email`)}
										className="input"
										autoComplete="off"
									/>
									{errors.boardMembers && errors.boardMembers[idx]?.email && (
										<div className="text-red-600 text-xs mt-1">
											{errors.boardMembers[idx].email?.message}
										</div>
									)}
								</div>
							</div>
							<div className="mt-2 text-sm">
								Age: {calculateAge(field.dateOfBirth) || "-"}{" "}
								{isYouth(calculateAge(field.dateOfBirth)) ? (
									<span className="text-green-600">(Youth)</span>
								) : (
									<span className="text-muted-foreground">(Non-Youth)</span>
								)}
							</div>
						</div>
					))}
					{errors.boardMembers &&
						typeof errors.boardMembers.message === "string" && (
							<div className="text-red-600 text-xs mt-1">
								{errors.boardMembers.message}
							</div>
						)}
				</div>
				<div className="mb-2">
					<div className="font-medium">
						Youth Board Members: {youthCount} / {boardMembers.length}
					</div>
					<div className="flex items-center gap-2">
						<div className="w-32 h-2 bg-muted rounded">
							<div
								className="h-2 bg-primary rounded"
								style={{ width: `${youthPercent}%` }}
							></div>
						</div>
						<span className="text-xs font-semibold">{youthPercent}%</span>
					</div>
					<div className="mt-1 text-xs">
						{youthPercent >= 51 ? (
							<span className="text-green-600">
								Eligible for AU Youth Leadership Requirement
							</span>
						) : (
							<span className="text-yellow-600">
								Does not meet AU youth leadership threshold (51%)
							</span>
						)}
					</div>
				</div>
			</div>
			<div className="flex justify-between mt-4">
				<button type="button" className="btn btn-secondary" onClick={onPrev}>
					Previous
				</button>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={fields.length < 3}
				>
					Next Step
				</button>
			</div>
		</form>
	);
}
