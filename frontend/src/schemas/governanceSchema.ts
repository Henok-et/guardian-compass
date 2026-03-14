import { z } from "zod";

export const governanceSchema = z.object({
	decisionAuthority: z.string().min(2, "Decision authority is required"),
	boardSize: z.number().int().min(1, "Board size is required"),
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
