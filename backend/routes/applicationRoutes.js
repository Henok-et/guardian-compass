import express from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import {
	listApplicationsHandler,
	getApplicationHandler,
	createApplicationHandler,
	updateApplicationStatusHandler,
} from "../controllers/applicationController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", listApplicationsHandler);
router.post("/", createApplicationHandler);
router.get("/:id", getApplicationHandler);
router.post(
	"/:id/status",
	authorizeRoles("admin", "officer"),
	updateApplicationStatusHandler,
);

export default router;
