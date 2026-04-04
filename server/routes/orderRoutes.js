import express from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getInvoice,
} from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  validateOrder,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = express.Router();

// All routes protected with verifyToken
router.use(verifyToken);

// @route   GET /api/orders
// @desc    Get all orders for logged-in seller
router.get("/", getOrders);

// @route   GET /api/orders/:id/invoice
// @desc    Generate and download invoice PDF
router.get("/:id/invoice", getInvoice);

// @route   GET /api/orders/:id
// @desc    Get single order with full details
router.get("/:id", getOrderById);

// @route   POST /api/orders
// @desc    Create new order
router.post("/", validateOrder, handleValidationErrors, createOrder);

// @route   PATCH /api/orders/:id
// @desc    Update order status or payment status
router.patch("/:id", updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Delete order
router.delete("/:id", deleteOrder);

export default router;
