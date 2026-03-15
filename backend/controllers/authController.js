import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
	createUser,
	comparePassword,
	ROLE_USER,
	getUserByEmail,
	sanitize,
} from "../models/User.js";
import { getCollection } from "../utils/mongo.js"; //

import { sendEmail } from "../services/emailService.js";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const EMAIL_TOKEN_EXPIRY_HOURS = 24;
/**
 * Generates a signed JWT token for authenticated users
 */
function createToken(user) {
	if (!JWT_SECRET) {
		throw new Error("JWT_SECRET is not configured");
	}

	return jwt.sign(
		{
			id: user.id,
			role: user.role,
		},
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN },
	);
}

/**
 * Generate email verification token + hashed storage version
 */
function generateEmailToken() {
	const rawToken = crypto.randomBytes(32).toString("hex");

	const hashedToken = crypto
		.createHash("sha256")
		.update(rawToken)
		.digest("hex");

	const expires = new Date(
		Date.now() + EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
	);

	return {
		rawToken,
		hashedToken,
		expires,
	};
}

/**
 * Normalize email input
 */
function normalizeEmail(email) {
	return String(email).trim().toLowerCase();
}

/* -------------------------------------------------- */
/* REGISTER */
/* -------------------------------------------------- */

export async function register(req, res) {
	const { username, email, password } = req.body || {};

	if (!username || !email || !password) {
		return res.status(400).json({
			message: "username, email and password are required",
		});
	}

	try {
		const normalizedEmail = normalizeEmail(email);

		const existing = await getUserByEmail(normalizedEmail);

		if (existing) {
			return res.status(409).json({
				message: "Email already in use",
			});
		}

		// Generate verification token
		const { rawToken, hashedToken, expires } = generateEmailToken();

		const user = await createUser({
			username: String(username).trim(),
			email: normalizedEmail,
			password: String(password),
			role: ROLE_USER,
			emailVerified: false,
			emailVerificationToken: hashedToken,
			emailVerificationExpires: expires,
		});

		// Send verification email (non-blocking failure)
		try {
			// Point verify link to backend endpoint (not frontend)
			const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${rawToken}`;

			await sendEmail({
				to: user.email,
				subject: "Verify your email address",
				html: `
          <p>Hello ${user.username},</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verifyUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
				text: `
Hello ${user.username},

Please verify your email by visiting the following link:

${verifyUrl}

This link expires in 24 hours.
        `,
			});
		} catch (emailErr) {
			console.error("Verification email failed but user created:", emailErr);
		}

		return res.status(201).json({
			message:
				"Registration successful. Please check your email to verify your account.",
		});
	} catch (err) {
		console.error("Registration error:", err);
		return res.status(500).json({
			message: "Failed to register user",
		});
	}
}

/* -------------------------------------------------- */
/* LOGIN */
/* -------------------------------------------------- */

export async function login(req, res) {
	const { email, password } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({
			message: "email and password are required",
		});
	}

	try {
		const normalizedEmail = normalizeEmail(email);

		const user = await getUserByEmail(normalizedEmail);

		if (!user) {
			return res.status(401).json({
				message: "Invalid credentials",
			});
		}

		if (!user.emailVerified) {
			return res.status(403).json({
				message: "Please verify your email before logging in.",
			});
		}

		const passwordMatches = await comparePassword(user, String(password));

		if (!passwordMatches) {
			return res.status(401).json({
				message: "Invalid credentials",
			});
		}

		const safeUser = sanitize(user);

		const token = createToken(safeUser);

		return res.json({
			token,
			user: safeUser,
		});
	} catch (err) {
		console.error("Login error:", err);

		return res.status(500).json({
			message: "Failed to login",
		});
	}
}

/* -------------------------------------------------- */
/* VERIFY EMAIL */
/* -------------------------------------------------- */

export async function verifyEmail(req, res) {
	const { token } = req.query;
	if (!token) return res.status(400).send("Verification token required");

	try {
		const hashedToken = crypto
			.createHash("sha256")
			.update(String(token))
			.digest("hex");
		const col = await getCollection("users");

		const user = await col.findOne({
			emailVerificationToken: hashedToken,
			emailVerificationExpires: { $gt: new Date() },
		});

		if (!user) {
			// redirect with failure
			return res.redirect(
				`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verified=false&error=invalid-token`,
			);
		}

		await col.updateOne(
			{ _id: user._id },
			{
				$set: { emailVerified: true },
				$unset: { emailVerificationToken: "", emailVerificationExpires: "" },
			},
		);

		// redirect with success
		return res.redirect(
			`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verified=true`,
		);
	} catch (err) {
		console.error("Email verification error:", err);
		return res.redirect(
			`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verified=false&error=server-error`,
		);
	}
}

/* -------------------------------------------------- */
/* RESEND VERIFICATION EMAIL */
/* -------------------------------------------------- */

export async function resendVerification(req, res) {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({
			message: "Email is required",
		});
	}

	try {
		const normalizedEmail = normalizeEmail(email);

		const user = await getUserByEmail(normalizedEmail);

		if (!user) {
			return res.status(404).json({
				message: "User not found",
			});
		}

		if (user.emailVerified) {
			return res.status(400).json({
				message: "Email already verified",
			});
		}

		const { rawToken, hashedToken, expires } = generateEmailToken();

		const col = await getCollection("users");

		await col.updateOne(
			{ _id: user._id },
			{
				$set: {
					emailVerificationToken: hashedToken,
					emailVerificationExpires: expires,
				},
			},
		);

		// When resending, also point to backend verification endpoint (not frontend)
		const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${rawToken}`;

		await sendEmail({
			to: user.email,
			subject: "Verify your email address",
			html: `
        <p>Hello ${user.username},</p>
        <p>Please verify your email:</p>
        <a href="${verifyUrl}">Verify Email</a>
      `,
			text: `
Hello ${user.username},

Verify your email using this link:

${verifyUrl}
      `,
		});

		return res.json({
			message: "Verification email resent. Please check your inbox.",
		});
	} catch (err) {
		console.error("Resend verification error:", err);

		return res.status(500).json({
			message: "Failed to resend verification email",
		});
	}
}
