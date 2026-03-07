import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || "guardian";

if (!uri) {
	throw new Error("MONGODB_URI or MONGO_URI environment variable is required");
}

let client;
let db;

export async function getDb() {
	if (!db) {
		client = new MongoClient(uri);
		await client.connect();
		db = client.db(dbName);
	}
	return db;
}

export async function getCollection(name) {
	const database = await getDb();
	return database.collection(name);
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
