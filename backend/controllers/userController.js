import {
	createUser,
	getUserById,
	listUsers,
	updateUser,
	deleteUser,
	sanitize,
	ROLE_ADMIN,
} from "../models/User.js";

// ───── List all users ─────
// Admin only
export async function listUsersHandler(req, res) {
	try {
		const users = await listUsers();
		// sanitize all users before sending
		return res.json(users.map(sanitize));
	} catch (err) {
		console.error("Failed to list users", err);
		return res.status(500).json({ message: "Failed to list users" });
	}
}

// ───── Get a single user ─────
// Admins can fetch any user, others can fetch only themselves
export async function getUserHandler(req, res) {
	const { id } = req.params;
	const requester = req.user;

	if (!requester) return res.status(401).json({ message: "Unauthorized" });

	if (requester.role !== ROLE_ADMIN && requester.id !== id)
		return res.status(403).json({ message: "Forbidden" });

	const user = await getUserById(id);
	if (!user) return res.status(404).json({ message: "User not found" });

	return res.json(sanitize(user));
}

// ───── Create a user ─────
// Admin only: prevents normal users from creating accounts with admin role
export async function createUserHandler(req, res) {
	const requester = req.user;
	if (!requester || requester.role !== ROLE_ADMIN) {
		return res.status(403).json({ message: "Forbidden" });
	}

	const { username, email, password, role } = req.body || {};
	if (!username || !email || !password || !role) {
		return res
			.status(400)
			.json({ message: "username, email, password, and role are required" });
	}

	try {
		const user = await createUser({
			username: String(username),
			email: String(email).toLowerCase(),
			password: String(password),
			role: String(role),
		});
		return res.status(201).json(sanitize(user)); // always sanitize before sending
	} catch (err) {
		console.error("Failed to create user", err);
		return res.status(500).json({ message: "Failed to create user" });
	}
}

// ───── Update a user ─────
// Admins can update any user, others can update only themselves
export async function updateUserHandler(req, res) {
	const { id } = req.params;
	const requester = req.user;
	if (!requester) return res.status(401).json({ message: "Unauthorized" });

	const updates = { ...req.body };
	if (requester.role !== ROLE_ADMIN) delete updates.role; // prevent role escalation

	if (requester.role !== ROLE_ADMIN && requester.id !== id)
		return res.status(403).json({ message: "Forbidden" });

	try {
		const updated = await updateUser(id, updates);
		if (!updated) return res.status(404).json({ message: "User not found" });
		return res.json(sanitize(updated)); // sanitize output
	} catch (err) {
		console.error("Failed to update user", err);
		return res.status(500).json({ message: "Failed to update user" });
	}
}

// ───── Delete a user ─────
// Admins can delete any user, users can delete only themselves
export async function deleteUserHandler(req, res) {
	const { id } = req.params;
	const requester = req.user;
	if (!requester) return res.status(401).json({ message: "Unauthorized" });

	if (requester.role !== ROLE_ADMIN && requester.id !== id)
		return res.status(403).json({ message: "Forbidden" });

	try {
		const deleted = await deleteUser(id);
		if (!deleted) return res.status(404).json({ message: "User not found" });
		return res.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete user", err);
		return res.status(500).json({ message: "Failed to delete user" });
	}
}
