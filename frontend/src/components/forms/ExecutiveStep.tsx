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
		formState: { errors },
		watch,
	} = useForm<ExecutiveInfo>({
		resolver: zodResolver(executiveSchema),
		defaultValues,
		mode: "onBlur",
	});

	// Track idDocument separately to avoid Zod v4 resolver conflict
	const [idFile, setIdFile] = useState<File | null>(defaultValues?.idDocument ?? null);
	const [idError, setIdError] = useState<string | null>(null);
	const [idPreview, setIdPreview] = useState<string | null>(null);

	// Auto-save draft
	React.useEffect(() => {
		if (!autoSave) return;
		const subscription = watch((value) => {
			autoSave({ ...(value as any), idDocument: idFile });
		});
		return () => subscription.unsubscribe();
	}, [watch, autoSave, idFile]);

	// ID upload handler
	const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setIdFile(file);
		setIdError(null);
		if (file && file.type.startsWith("image")) {
			const reader = new FileReader();
			reader.onload = () => setIdPreview(reader.result as string);
			reader.readAsDataURL(file);
		} else {
			setIdPreview(null);
		}
	};

	const removeIdDocument = () => {
		setIdFile(null);
		setIdPreview(null);
		setIdError(null);
		const fileInput = document.getElementById("idDocumentInput") as HTMLInputElement;
		if (fileInput) fileInput.value = "";
	};

	// Guard submit — validate file manually
	const onSubmit = (data: ExecutiveInfo) => {
		if (!idFile) {
			setIdError("ID Document is required");
			document.getElementById("idDocumentInput")?.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}
		const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
		if (!allowedTypes.includes(idFile.type)) {
			setIdError("Accepted formats: PDF, PNG, JPG, JPEG");
			return;
		}
		if (idFile.size > 3 * 1024 * 1024) {
			setIdError("File size must be ≤ 3MB");
			return;
		}
		onNext({ ...data, idDocument: idFile });
	};

	// Age calculation (kept internal, not shown to users)
	const _age = calculateAge(watch("dateOfBirth"));


	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="card p-6 sm:p-8">
				<div className="space-y-4">
					<div>
						<label className="form-label">Full Name *</label>
						<input
							{...register("fullName")}
							className={`form-input ${errors.fullName ? "form-input-error" : ""}`}
							autoComplete="off"
						/>
						{errors.fullName && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.fullName.message}
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="form-label">Date of Birth *</label>
							<input type="date" {...register("dateOfBirth")} className={`form-input ${errors.dateOfBirth ? "form-input-error" : ""}`} />
							{errors.dateOfBirth && (
								<div className="text-error text-xs mt-1.5 font-medium">
									{errors.dateOfBirth.message}
								</div>
							)}
						</div>
						<div>
							<label className="form-label">Gender</label>
							<select {...register("gender")} className="form-input">
								<option value="">Select gender</option>
								<option value="Male">Male</option>
								<option value="Female">Female</option>
							</select>
						</div>
					</div>
					<div>
						<label className="form-label">Role / Title *</label>
						<input {...register("role")} className={`form-input ${errors.role ? "form-input-error" : ""}`} autoComplete="off" />
						{errors.role && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.role.message}
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="form-label">Executive Phone Number *</label>
							<input {...register("phone")} className={`form-input ${errors.phone ? "form-input-error" : ""}`} autoComplete="off" />
							{errors.phone && (
								<div className="text-error text-xs mt-1.5 font-medium">
									{errors.phone.message}
								</div>
							)}
						</div>
						<div>
							<label className="form-label">Executive Email *</label>
							<input {...register("email")} className={`form-input ${errors.email ? "form-input-error" : ""}`} autoComplete="off" />
							{errors.email && (
								<div className="text-error text-xs mt-1.5 font-medium">
									{errors.email.message}
								</div>
							)}
						</div>
					</div>
					<div>
						<label className="form-label">Upload Executive ID *</label>
						<input
							type="file"
							id="idDocumentInput"
							accept=".pdf,.png,.jpg,.jpeg"
							onChange={handleIdChange}
							className={`form-input file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 ${idError ? "form-input-error border-destructive/50" : ""}`}
						/>
						<div className="text-xs text-muted-foreground mt-2">
							Upload a clear copy of the Executive Head’s National ID or Passport.
							Accepted formats: PDF, PNG, JPG, JPEG. Max size: 3MB.
						</div>
						{idPreview && (
							<div className="mt-4 relative inline-block group">
								<img
									src={idPreview}
									alt="ID Preview"
									className="max-h-40 rounded-lg border border-border/50 object-cover shadow-sm transition-opacity group-hover:opacity-90"
								/>
								<button
									type="button"
									onClick={removeIdDocument}
									className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all outline-none"
									title="Remove image"
								>
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						)}
						{idError && (
							<div className="text-error text-xs mt-1.5 font-medium">{idError}</div>
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
