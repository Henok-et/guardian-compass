import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKFLOW_JSON = path.join(__dirname, "..", "workflow.json");

export async function readWorkflow() {
	try {
		if (!fs.existsSync(WORKFLOW_JSON))
			return { verified: [], flagged: [], rejected: [] };
		const raw = await fs.promises.readFile(WORKFLOW_JSON, "utf-8");
		return JSON.parse(raw);
	} catch (e) {
		return { verified: [], flagged: [], rejected: [] };
	}
}

export async function writeWorkflow(data) {
	try {
		await fs.promises.writeFile(
			WORKFLOW_JSON,
			JSON.stringify(data, null, 2),
			"utf-8",
		);
	} catch (e) {
		console.warn("Failed to write workflow.json", e?.message || e);
	}
}
