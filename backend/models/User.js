import bcrypt from "bcryptjs";
import { getCollection, getObjectId } from "../utils/mongo.js";

const COLLECTION = "users";

export const ROLE_ADMIN = "admin";
export const ROLE_OFFICER = "officer";
export const ROLE_USER = "user";

export async function ensureUserIndexes() {
	const col = await getCollection(COLLECTION);
	await col.createIndex({ email: 1 }, { unique: true });
	await col.createIndex({ username: 1 }, { unique: true });
}

export async function createUser({
	username,
	email,
	password,
	role = ROLE_USER,
	emailVerified = false,
	emailVerificationToken = null,
}) {
	const passwordHash = await bcrypt.hash(password, 10);
	const col = await getCollection(COLLECTION);
	const result = await col.insertOne({
		username,
		email,
		passwordHash,
		role,
		createdAt: new Date(),
		emailVerified,
		emailVerificationToken,
	});
	return sanitize(await getUserById(result.insertedId));
}

export async function getUserById(id) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	return col.findOne({ _id: objectId });
}

export async function getUserByEmail(email) {
	const col = await getCollection(COLLECTION);
	return col.findOne({ email: String(email).toLowerCase() });
}

export async function updateUser(id, updates) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	if (updates.password) {
		updates.passwordHash = await bcrypt.hash(updates.password, 10);
		delete updates.password;
	}
	await col.updateOne({ _id: objectId }, { $set: updates });
	return sanitize(await getUserById(objectId));
}

export async function deleteUser(id) {
	const col = await getCollection(COLLECTION);
	const objectId = typeof id === "string" ? getObjectId(id) : id;
	if (!objectId) return null;
	return col.deleteOne({ _id: objectId });
}

export async function listUsers() {
	const col = await getCollection(COLLECTION);
	return col.find().toArray();
}

export function comparePassword(user, candidatePassword) {
	if (!user || !user.passwordHash) return false;
	return bcrypt.compare(candidatePassword, user.passwordHash);
}

export function sanitize(user) {
	if (!user) return null;
	const { passwordHash, ...rest } = user;
	return { ...rest, id: String(user._id) };
}
