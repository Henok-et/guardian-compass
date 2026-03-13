// Script to fix users missing emailVerificationExpires
const { getCollection } = require("../utils/mongo");

async function fixUsers() {
	const col = await getCollection("users");
	const EMAIL_TOKEN_EXPIRY_HOURS = 24;
	const now = Date.now();
	const expires = new Date(now + EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

	const result = await col.updateMany(
		{
			emailVerificationToken: { $exists: true, $ne: null },
			emailVerificationExpires: { $exists: false },
		},
		{
			$set: { emailVerificationExpires: expires },
		},
	);
	console.log(`Updated ${result.modifiedCount} users.`);
}

fixUsers().then(() => process.exit());
