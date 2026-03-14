import { z } from "zod";

export const legalDeclarationSchema = z.object({
	legalDeclaration: z
		.boolean()
		.refine((val) => val, {
			message: "You must confirm the legal declaration",
		}),
	authorization: z
		.boolean()
		.refine((val) => val, {
			message:
				"You must authorize AU Youth Directorate to review your application",
		}),
});

export type LegalDeclarationInfo = z.infer<typeof legalDeclarationSchema>;
