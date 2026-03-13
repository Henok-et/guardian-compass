import express from "express";
import {
	login,
	register,
	verifyEmail,
	resendVerification,
} from "../controllers/authController.js";

import {
	loginLimiter,
	registerLimiter,
	resendVerificationLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * User Registration
 * Protected to prevent bots creating thousands of accounts
 */
router.post("/register", registerLimiter, register);

/**
 * User Login
 * Protected to prevent brute force password attacks
 */
router.post("/login", loginLimiter, login);

/**
 * Email Verification
 * Used when user clicks verification link from email
 */
router.get("/verify-email", verifyEmail);

/**
 * Resend Verification Email
 * Prevents email spam attacks
 */
router.post(
	"/resend-verification",
	resendVerificationLimiter,
	resendVerification,
);

export default router;
