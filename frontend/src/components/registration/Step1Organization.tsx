import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const currentYear = new Date().getFullYear();

const schema = z.object({
	legalName: z
		.string()
		.min(3, "Organization name must be at least 3 characters"),
	registrationNumber: z.string().min(1, "Registration number is required"),
	country: z.string().min(1, "Country is required"),
	yearEstablished: z
		.number({ error: "Year must be a number" })
		.int()
		.lte(currentYear, `Year must be ≤ ${currentYear}`),
	organizationType: z.enum([
		"NGO",
		"Youth Network",
		"Community Organization",
		"Social Enterprise",
		"Other",
	]),
	website: z.string().url("Must be a valid URL"),
	socialMedia: z.string().optional(),
	email: z.string().email("Must be a valid email"),
	phone: z.string().min(1, "Phone number is required"),
});

export type OrganizationInfo = z.infer<typeof schema>;

export default function Step1Organization({
	defaultValues,
	onNext,
	autoSave,
}: {
	defaultValues: OrganizationInfo;
	onNext: (data: OrganizationInfo) => void;
	autoSave?: (data: OrganizationInfo) => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<OrganizationInfo>({
		resolver: zodResolver(schema),
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
						Legal Name of Organization *
					</label>
					<input
						{...register("legalName")}
						className="input"
						autoComplete="off"
					/>
					{errors.legalName && (
						<div className="text-red-600 text-xs mt-1">
							{errors.legalName.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Registration Number *</label>
					<input
						{...register("registrationNumber")}
						className="input"
						autoComplete="off"
					/>
					{errors.registrationNumber && (
						<div className="text-red-600 text-xs mt-1">
							{errors.registrationNumber.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Country of Registration *</label>
					<select {...register("country")} className="input">
						<option value="">Select country</option>
						{/* TODO: Add searchable dropdown with country list */}
						<option value="Ethiopia">Ethiopia</option>
						<option value="Nigeria">Nigeria</option>
						<option value="Kenya">Kenya</option>
						<option value="South Africa">South Africa</option>
						{/* ... */}
					</select>
					{errors.country && (
						<div className="text-red-600 text-xs mt-1">
							{errors.country.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Year Established *</label>
					<input
						type="number"
						{...register("yearEstablished", { valueAsNumber: true })}
						className="input"
						min={1900}
						max={currentYear}
					/>
					{errors.yearEstablished && (
						<div className="text-red-600 text-xs mt-1">
							{errors.yearEstablished.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Organization Type *</label>
					<select {...register("organizationType")} className="input">
						<option value="">Select type</option>
						<option value="NGO">NGO</option>
						<option value="Youth Network">Youth Network</option>
						<option value="Community Organization">
							Community Organization
						</option>
						<option value="Social Enterprise">Social Enterprise</option>
						<option value="Other">Other</option>
					</select>
					{errors.organizationType && (
						<div className="text-red-600 text-xs mt-1">
							{errors.organizationType.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Official Website *</label>
					<input
						{...register("website")}
						className="input"
						autoComplete="off"
					/>
					{errors.website && (
						<div className="text-red-600 text-xs mt-1">
							{errors.website.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">Social Media Link</label>
					<input
						{...register("socialMedia")}
						className="input"
						autoComplete="off"
					/>
				</div>
				<div className="mb-2">
					<label className="block font-medium">Organization Email *</label>
					<input {...register("email")} className="input" autoComplete="off" />
					{errors.email && (
						<div className="text-red-600 text-xs mt-1">
							{errors.email.message}
						</div>
					)}
				</div>
				<div className="mb-2">
					<label className="block font-medium">
						Organization Phone Number *
					</label>
					<input {...register("phone")} className="input" autoComplete="off" />
					{errors.phone && (
						<div className="text-red-600 text-xs mt-1">
							{errors.phone.message}
						</div>
					)}
				</div>
			</div>
			<div className="flex justify-between mt-4">
				<button type="button" className="btn btn-secondary" disabled>
					Previous
				</button>
				<button type="submit" className="btn btn-primary">
					Next
				</button>
			</div>
		</form>
	);
}
