import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { BoardMember } from "@/schemas/boardMembersSchema";

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
		register,
		formState: { errors },
		watch,
		setError,
	} = useForm<{ boardMembers: BoardMember[] }>({
		defaultValues: { boardMembers: defaultValues },
		mode: "onBlur",
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "boardMembers",
	});

	// Auto-save draft
	React.useEffect(() => {
		if (!autoSave) return;
		const subscription = watch((value) => {
			autoSave((value.boardMembers || []) as any);
		});
		return () => subscription.unsubscribe();
	}, [watch, autoSave]);

	// Youth ratio (internal only — not shown to user)
	const boardMembers = watch("boardMembers") || [];
	const _youthCount = boardMembers.filter((bm) =>
		isYouth(calculateAge(bm.dateOfBirth)),
	).length;

	// Manual submit guard — validates required fields without Zod v4 resolver
	const onSubmit = (data: { boardMembers: BoardMember[] }) => {
		let hasError = false;
		data.boardMembers.forEach((member, idx) => {
			if (!member.fullName?.trim()) {
				setError(`boardMembers.${idx}.fullName`, { message: "Full name is required" });
				hasError = true;
			}
			if (!member.dateOfBirth) {
				setError(`boardMembers.${idx}.dateOfBirth`, { message: "Date of birth is required" });
				hasError = true;
			}
			if (!member.role?.trim()) {
				setError(`boardMembers.${idx}.role`, { message: "Role/Position is required" });
				hasError = true;
			}
		});
		if (hasError) return;
		onNext(data.boardMembers);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-6"
		>
			<div className="card p-6 sm:p-8">
				<div className="space-y-6">
					<div className="flex justify-between items-center pb-4 border-b border-border/50">
						<h2 className="text-xl font-semibold text-foreground">Board Members</h2>
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
							disabled={fields.length >= 50}
						>
							+ Add Member
						</button>
					</div>

					<div className="space-y-6">
						{fields.map((field, idx) => (
							<div key={field.id} className="relative rounded-xl border border-border/60 bg-muted/20 p-5 transition-all hover:border-primary/30">
								<div className="flex justify-between items-center mb-4 pb-3 border-b border-border/40">
									<div className="font-semibold text-foreground/90">Board Member {idx + 1}</div>
									<button
										type="button"
										className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
										onClick={() => remove(idx)}
										disabled={fields.length <= 3}
									>
										Remove
									</button>
								</div>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div>
										<label className="form-label">Full Name *</label>
										<input
											{...control.register(`boardMembers.${idx}.fullName`)}
											className={`form-input ${errors.boardMembers?.[idx]?.fullName ? "form-input-error" : ""}`}
											autoComplete="off"
										/>
										{errors.boardMembers?.[idx]?.fullName && (
											<div className="text-error text-xs mt-1.5 font-medium">
												{errors.boardMembers[idx].fullName?.message}
											</div>
										)}
									</div>
									<div>
										<label className="form-label">Date of Birth *</label>
										<input
											type="date"
											{...control.register(`boardMembers.${idx}.dateOfBirth`)}
											className={`form-input ${errors.boardMembers?.[idx]?.dateOfBirth ? "form-input-error" : ""}`}
										/>
										{errors.boardMembers?.[idx]?.dateOfBirth && (
											<div className="text-error text-xs mt-1.5 font-medium">
												{errors.boardMembers[idx].dateOfBirth?.message}
											</div>
										)}
									</div>
									<div>
										<label className="form-label">Gender *</label>
										<select
											{...control.register(`boardMembers.${idx}.gender`)}
											className={`form-input ${errors.boardMembers?.[idx]?.gender ? "form-input-error" : ""}`}
										>
											<option value="Male">Male</option>
											<option value="Female">Female</option>
										</select>
										{errors.boardMembers?.[idx]?.gender && (
											<div className="text-error text-xs mt-1.5 font-medium">
												{errors.boardMembers[idx].gender?.message}
											</div>
										)}
									</div>
									<div>
										<label className="form-label">Role / Position *</label>
										<input
											{...control.register(`boardMembers.${idx}.role`)}
											className={`form-input ${errors.boardMembers?.[idx]?.role ? "form-input-error" : ""}`}
											autoComplete="off"
										/>
										{errors.boardMembers?.[idx]?.role && (
											<div className="text-error text-xs mt-1.5 font-medium">
												{errors.boardMembers[idx].role?.message}
											</div>
										)}
									</div>
									<div>
										<label className="form-label">Phone Number</label>
										<input
											{...control.register(`boardMembers.${idx}.phone`)}
											className="form-input"
											autoComplete="off"
										/>
									</div>
									<div>
										<label className="form-label">Email</label>
										<input
											{...control.register(`boardMembers.${idx}.email`)}
											className={`form-input ${errors.boardMembers?.[idx]?.email ? "form-input-error" : ""}`}
											autoComplete="off"
										/>
										{errors.boardMembers?.[idx]?.email && (
											<div className="text-error text-xs mt-1.5 font-medium">
												{errors.boardMembers[idx].email?.message}
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
					
					{errors.boardMembers &&
						typeof errors.boardMembers.message === "string" && (
							<div className="text-error text-sm font-medium p-3 bg-error/10 border border-error/20 rounded-lg">
								{errors.boardMembers.message}
							</div>
						)}
				</div>
			</div>
			<div className="flex justify-between items-center pt-4">
				<button type="button" className="btn btn-secondary px-6" onClick={onPrev}>
					Previous
				</button>
				<div className="flex items-center gap-3">
					{Object.keys(errors).length > 0 && (
						<span className="text-sm font-semibold text-destructive animate-pulse">
							Please fill all required fields correctly.
						</span>
					)}
					<button
						type="submit"
						className="btn btn-primary px-8"
						disabled={fields.length < 3}
					>
						Continue
					</button>
				</div>
			</div>
		</form>
	);
}
