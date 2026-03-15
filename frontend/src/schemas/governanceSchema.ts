import { z } from "zod";

export const governanceSchema = z.object({
	governanceDeclaration: z
		.boolean()
		.refine((val) => val, {
			message: "You must confirm the governance declaration",
		}),
	leadershipResponsibilityDeclaration: z
		.boolean()
		.refine((val) => val, {
			message: "You must confirm the leadership responsibility declaration",
		}),
});

export type GovernanceInfo = z.infer<typeof governanceSchema>;
