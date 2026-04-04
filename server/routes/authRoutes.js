import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", validateRegister, handleValidationErrors, register);

// @route   POST /api/auth/login
// @desc    Login user
router.post("/login", validateLogin, handleValidationErrors, login);

// @route   GET /api/auth/me
// @desc    Get current user (protected route)
// @access  Private
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
