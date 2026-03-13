import express from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import {
	listUsersHandler,
	getUserHandler,
	createUserHandler,
	updateUserHandler,
	deleteUserHandler,
} from "../controllers/userController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ─── Admin-only endpoints ───
router.get("/", authorizeRoles("admin"), listUsersHandler); // List all users
router.post("/", authorizeRoles("admin"), createUserHandler); // Create a new user
router.delete("/:id", authorizeRoles("admin"), deleteUserHandler); // Delete a user

// ─── Admin or self-access endpoints ───
router.get("/:id", authorizeRoles("admin", "user"), getUserHandler); // Get user info
router.put("/:id", authorizeRoles("admin", "user"), updateUserHandler); // Update user info (admin or self)

// Optional: implement rate-limiting per user/admin for sensitive routes

export default router;
