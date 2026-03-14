import { z } from "zod";

export const activitiesSchema = z.object({
	activitiesDescription: z
		.string()
		.min(150, "Activities description must be at least 150 characters")
		.max(2000, "Maximum 2000 characters"),
	impactDescription: z
		.string()
		.min(100, "Impact description must be at least 100 characters")
		.max(2000, "Maximum 2000 characters"),
	operationalPresence: z.enum([
		"Local community",
		"City level",
		"National level",
		"Regional (multiple countries)",
		"Continental",
	]),
	partnerships: z.string().max(1000, "Maximum 1000 characters").optional(),
	verificationLinks: z
		.string()
		.min(20, "Verification links must be at least 20 characters")
		.max(1000, "Maximum 1000 characters"),
	transparencyDeclaration: z
		.boolean()
		.refine((val) => val, {
			message: "You must confirm the transparency declaration",
		}),
});

export type ActivitiesInfo = z.infer<typeof activitiesSchema>;
