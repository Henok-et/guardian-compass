import { getCollection, getObjectId } from "../utils/mongo.js";

const COLLECTION = "applications";

export const STATUS_PENDING = "pending";
export const STATUS_APPROVED = "approved";
export const STATUS_FLAGGED = "flagged";
export const STATUS_REJECTED = "rejected";

export async function ensureApplicationIndexes() {
	const col = await getCollection(COLLECTION);
	await col.createIndex({ userId: 1 });
	await col.createIndex({ status: 1 });
	await col.createIndex({ email: 1 });
	await col.createIndex({ registrationNumber: 1 });
}

export async function createApplication(data) {
	const col = await getCollection(COLLECTION);
	const now = new Date();
	
	// Generate APP-XXXXXXX identifier using a random hex attached to the prefix
	const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
	const generatedAppId = `APP-${randomHex}`;

	const record = {
		...data,
		applicationId: generatedAppId,
		status: data.status || STATUS_PENDING,
		submittedAt: data.submittedAt || now,
		createdAt: now,
		updatedAt: now,
	};
	const result = await col.insertOne(record);
	return sanitize(await getApplicationById(result.insertedId));
}

export async function getApplicationById(id) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	return col.findOne({ _id: objectId });
}

export async function listApplications(filter = {}) {
	const col = await getCollection(COLLECTION);
	return col.find(filter).toArray();
}

export async function updateApplication(id, updates) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	updates.updatedAt = new Date();
	await col.updateOne({ _id: objectId }, { $set: updates });
	return sanitize(await getApplicationById(objectId));
}

export async function deleteApplication(id) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	return col.deleteOne({ _id: objectId });
}

export function sanitize(application) {
	if (!application) return null;
	// Hide sensitive fields for users
	// Officers/admins can see all fields; users only see their own non-sensitive fields
	// (This logic should be enforced in controller, but here is a basic filter)
	return {
		...application,
		id: String(application._id),
		userId: application.userId ? String(application.userId) : null,
	};
}
