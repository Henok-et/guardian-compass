import { z } from "zod";

export const executiveSchema = z.object({
	fullName: z.string().min(3, "Full name must be at least 3 characters"),
	dateOfBirth: z
		.string()
		.refine((val) => !isNaN(Date.parse(val)), {
			message: "Date of birth must be a valid date",
		}),
	gender: z.enum(["Male", "Female"]).optional(),
	role: z.string().min(2, "Role/Title is required"),
	phone: z.string().min(1, "Phone number is required"),
	email: z.string().email("Must be a valid email"),
});

export type ExecutiveInfo = z.infer<typeof executiveSchema> & {
	idDocument?: File | null;
};
