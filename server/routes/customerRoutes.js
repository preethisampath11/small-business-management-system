import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  validateCustomer,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = express.Router();

// All routes protected with verifyToken
router.use(verifyToken);

// @route   GET /api/customers
// @desc    Get all customers for logged-in user
router.get("/", getCustomers);

// @route   GET /api/customers/:id
// @desc    Get single customer
router.get("/:id", getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
router.post("/", validateCustomer, handleValidationErrors, createCustomer);

// @route   PATCH /api/customers/:id
// @desc    Update customer
router.patch("/:id", validateCustomer, handleValidationErrors, updateCustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
router.delete("/:id", deleteCustomer);

export default router;
