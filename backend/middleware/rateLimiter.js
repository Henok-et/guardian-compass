import rateLimit from "express-rate-limit";

/**
 * Prevent brute-force login attempts
 */
export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // limit each IP to 10 requests
	message: {
		message: "Too many login attempts. Please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * Prevent mass account registrations
 */
export const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 20,
	message: {
		message: "Too many accounts created from this IP. Try again later.",
	},
});

/**
 * Prevent verification email spam
 */
export const resendVerificationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	message: {
		message: "Too many verification requests. Try again later.",
	},
});