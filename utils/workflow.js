import { getCollection } from "./mongo.js";

const WORKFLOW_COLLECTION = "workflow";
const WORKFLOW_ID = "workflow";

export async function readWorkflow() {
	try {
		const col = await getCollection(WORKFLOW_COLLECTION);
		const doc = await col.findOne({ _id: WORKFLOW_ID });
		return doc || { verified: [], flagged: [], rejected: [] };
	} catch (e) {
		console.warn("Failed to read workflow from MongoDB:", e?.message || e);
		return { verified: [], flagged: [], rejected: [] };
	}
}

export async function writeWorkflow(data) {
	try {
		const col = await getCollection(WORKFLOW_COLLECTION);
		await col.updateOne(
			{ _id: WORKFLOW_ID },
			{ $set: { ...data, _id: WORKFLOW_ID } },
			{ upsert: true },
		);
	} catch (e) {
		console.warn("Failed to write workflow to MongoDB:", e?.message || e);
	}
}
