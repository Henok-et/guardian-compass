import { z } from "zod";

export const boardMemberSchema = z.object({
	fullName: z.string().min(3, "Full name must be at least 3 characters"),
	dateOfBirth: z
		.string()
		.refine((val) => !isNaN(Date.parse(val)), {
			message: "Date of birth must be a valid date",
		}),
	gender: z.enum(["Male", "Female"]),
	role: z.string().min(2, "Role/Position is required"),
	phone: z.string().optional(),
	email: z.string().email("Must be a valid email").optional(),
});

export const boardMembersSchema = z
	.array(boardMemberSchema)
	.min(3, "At least 3 board members required")
	.max(15, "Maximum 15 board members allowed");

export type BoardMember = z.infer<typeof boardMemberSchema>;
