import jwt from "jsonwebtoken";
import { getUserById } from "../models/User.js";

const secret = process.env.JWT_SECRET;

if (!secret) {
	console.warn("JWT_SECRET is not defined. Authentication may fail.");
}

/**
 * Authenticate JWT token
 */
export async function authenticateToken(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		const token = authHeader?.split(" ")[1];

		if (!token) {
			return res.status(401).json({
				message: "Missing authorization token",
			});
		}

		const payload = jwt.verify(token, secret);

		if (!payload || typeof payload !== "object") {
			return res.status(401).json({
				message: "Invalid token",
			});
		}

		const userId = payload.id;

		if (!userId) {
			return res.status(401).json({
				message: "Invalid token payload",
			});
		}

		const user = await getUserById(userId);

		if (!user) {
			return res.status(401).json({
				message: "User no longer exists",
			});
		}

		/**
		 * Optional Security Feature:
		 * tokenVersion allows revoking old tokens
		 */
		if (payload.tokenVersion !== user.tokenVersion) {
			return res.status(401).json({
				message: "Token has been revoked",
			});
		}

		req.user = {
			id: String(user._id),
			role: user.role,
		};

		next();
	} catch (err) {
		return res.status(401).json({
			message: "Invalid or expired token",
		});
	}
}

/**
 * Role-based Authorization Middleware
 */
export function authorizeRoles(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				message: "Unauthorized",
			});
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({
				message: "Forbidden",
			});
		}

		next();
	};
}