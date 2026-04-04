import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected with verifyToken
router.use(verifyToken);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (revenue, orders, recent orders)
router.get("/stats", getDashboardStats);

export default router;
