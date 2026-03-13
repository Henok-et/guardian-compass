import { MongoClient, GridFSBucket, ObjectId } from "mongodb";

const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || "guardian";

let client;
let db;

function getUri() {
	return process.env.MONGODB_URI || process.env.MONGO_URI;
}

export async function connectDb() {
	const uri = getUri();
	if (!uri) {
		throw new Error(
			"MONGODB_URI or MONGO_URI environment variable is required",
		);
	}

	if (!client) {
		client = new MongoClient(uri);
		await client.connect();
		db = client.db(dbName);
	}

	return { client, db };
}

export async function getDb() {
	if (!db) {
		await connectDb();
	}
	return db;
}

export async function getClient() {
	if (!client) {
		await connectDb();
	}
	return client;
}

export async function getCollection(name) {
	const database = await getDb();
	return database.collection(name);
}

export function getObjectId(id) {
	try {
		return new ObjectId(id);
	} catch {
		return null;
	}
}

export async function getGridFSBucket(bucketName = "uploads") {
	const database = await getDb();
	return new GridFSBucket(database, { bucketName });
}

export async function closeDb() {
	if (client) {
		await client.close();
		client = undefined;
		db = undefined;
	}
}

export async function ping() {
	try {
		const database = await getDb();
		// run a lightweight command to verify connection
		await database.command({ ping: 1 });
		return { ok: true };
	} catch (err) {
		return { ok: false, error: err?.message || String(err) };
	}
}
