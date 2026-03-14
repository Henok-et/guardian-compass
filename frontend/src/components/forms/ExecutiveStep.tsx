import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { executiveSchema, ExecutiveInfo } from "@/schemas/executiveSchema";

function calculateAge(dateOfBirth: string) {
	if (!dateOfBirth) return null;
	const dob = new Date(dateOfBirth);
	const diff = Date.now() - dob.getTime();
	const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
	return age;
}

export default function ExecutiveStep({
	defaultValues,
	onNext,
	onPrev,
	autoSave,
}: {
	defaultValues: ExecutiveInfo;
	onNext: (data: ExecutiveInfo) => void;
	onPrev: () => void;
	autoSave?: (data: ExecutiveInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		watch,
	} = useForm<ExecutiveInfo>({
		resolver: zodResolver(executiveSchema),
		defaultValues,
		mode: "onBlur",
	});

	const [idPreview, setIdPreview] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);

	// Auto-save draft
	React.useEffect(() => {
		if (autoSave) autoSave(watch());
	}, [watch, autoSave]);

	// ID upload preview
	const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		setValue("idDocument", file);
		if (file && file.type.startsWith("image")) {
			const reader = new FileReader();
			reader.onload = () => setIdPreview(reader.result as string);
			reader.readAsDataURL(file);
		} else {
			setIdPreview(null);
		}
	};

	// Age calculation
	const age = calculateAge(watch("dateOfBirth"));

	return (
		<form onSubmit={handleSubmit(onNext)} className="space-y-4">
			<div className="card p-4">
				<div className="mb-2">
					<label className="block font-medium">Full Name *</label>
					<input
						{...register("fullName")}
						className="input"
						autoComplete="off"
					/>
					{errors.fullName && (
						<div className="text-red-600 text-xs mt-1">
							{errors.fullName.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Date of Birth *</label>
					<input type="date" {...register("dateOfBirth")} className="input" />
					{errors.dateOfBirth && (
						<div className="text-red-600 text-xs mt-1">
							{errors.dateOfBirth.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Gender</label>
					<select {...register("gender")} className="input">
						<option value="">Select gender</option>
						<option value="Male">Male</option>
						<option value="Female">Female</option>
					</select>
				</div>
				<div className="mb-2">
					<label className="block font-medium">Role / Title *</label>
					<input {...register("role")} className="input" autoComplete="off" />
					{errors.role && (
						<div className="text-red-600 text-xs mt-1">
							{errors.role.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Executive Phone Number *</label>
					<input {...register("phone")} className="input" autoComplete="off" />
					{errors.phone && (
						<div className="text-red-600 text-xs mt-1">
							{errors.phone.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Executive Email *</label>
					<input {...register("email")} className="input" autoComplete="off" />
					{errors.email && (
						<div className="text-red-600 text-xs mt-1">
							{errors.email.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Upload Executive ID *</label>
					<input
						type="file"
						accept=".pdf,.png,.jpg,.jpeg"
						onChange={handleIdChange}
						className="input"
					/>
					<div className="text-xs text-muted-foreground mt-1">
						Upload a clear copy of the Executive Head’s National ID or Passport.
						Accepted formats: PDF, PNG, JPG, JPEG. Max size: 3MB.
					</div>
					{idPreview && (
						<div className="mt-2">
							<img
								src={idPreview}
								alt="ID Preview"
								className="max-h-32 rounded border"
							/>
						</div>
					)}
					{errors.idDocument &&
						typeof errors.idDocument.message === "string" && (
							<div className="text-red-600 text-xs mt-1">
								{errors.idDocument.message}
							</div>
						)}
				</div>
				<div className="mb-2">
					<div className="text-sm text-blue-600">
						{age !== null && `Calculated Age: ${age}`}
					</div>
					<div className="text-xs text-muted-foreground">
						Final youth eligibility will be checked at Step 4.
					</div>
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
