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
		if (!autoSave) return;
		const subscription = watch((value) => {
			autoSave(value as any);
		});
		return () => subscription.unsubscribe();
	}, [watch, autoSave]);

	return (
		<form onSubmit={handleSubmit(onNext)} className="space-y-6">
			<div className="card p-6 sm:p-8">
				<div className="space-y-4">
					<div>
						<label className="form-label">
							Legal Name of Organization *
						</label>
						<input
							{...register("legalName")}
							className={`form-input ${errors.legalName ? "form-input-error" : ""}`}
							autoComplete="off"
						/>
						{errors.legalName && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.legalName.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Registration Number *</label>
						<input
							{...register("registrationNumber")}
							className={`form-input ${errors.registrationNumber ? "form-input-error" : ""}`}
							autoComplete="off"
						/>
						{errors.registrationNumber && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.registrationNumber.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Country of Registration *</label>
						<select {...register("country")} className={`form-input ${errors.country ? "form-input-error" : ""}`}>
							<option value="">Select country</option>
							{[
								"Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Republic of the Congo", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
							].map(country => (
								<option key={country} value={country}>{country}</option>
							))}
						</select>
						{errors.country && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.country.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Year Established *</label>
						<input
							type="number"
							{...register("yearEstablished", { valueAsNumber: true })}
							className={`form-input ${errors.yearEstablished ? "form-input-error" : ""}`}
							min={1900}
							max={currentYear}
						/>
						{errors.yearEstablished && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.yearEstablished.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Organization Type *</label>
						<select {...register("organizationType")} className={`form-input ${errors.organizationType ? "form-input-error" : ""}`}>
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
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.organizationType.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Official Website *</label>
						<input
							{...register("website")}
							className={`form-input ${errors.website ? "form-input-error" : ""}`}
							autoComplete="off"
						/>
						{errors.website && (
							<div className="text-error text-xs mt-1.5 font-medium">
								{errors.website.message}
							</div>
						)}
					</div>
					<div>
						<label className="form-label">Social Media Link</label>
						<input
							{...register("socialMedia")}
							className="form-input"
							autoComplete="off"
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="form-label">Organization Email *</label>
							<input {...register("email")} className={`form-input ${errors.email ? "form-input-error" : ""}`} autoComplete="off" />
							{errors.email && (
								<div className="text-error text-xs mt-1.5 font-medium">
									{errors.email.message}
								</div>
							)}
						</div>
						<div>
							<label className="form-label">
								Organization Phone Number *
							</label>
							<input {...register("phone")} className={`form-input ${errors.phone ? "form-input-error" : ""}`} autoComplete="off" />
							{errors.phone && (
								<div className="text-error text-xs mt-1.5 font-medium">
									{errors.phone.message}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			
			<div className="flex justify-between items-center pt-4">
				<button type="button" className="btn btn-secondary invisible">
					Previous
				</button>
				<button type="submit" className="btn btn-primary px-8">
					Continue
				</button>
			</div>
		</form>
	);
}
