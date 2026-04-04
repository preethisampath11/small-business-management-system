import express from "express";
import {
  getItems,
  getItemsFlat,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  deleteItemGroup,
  updateStock,
} from "../controllers/itemController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected with verifyToken
router.use(verifyToken);

// @route   GET /api/items/flat
// @desc    Get all items ungrouped (individual variant documents)
// IMPORTANT: Must come BEFORE /:id route!
router.get("/flat", getItemsFlat);

// @route   GET /api/items
// @desc    Get all items for logged-in seller (grouped by name)
router.get("/", getItems);

// @route   GET /api/items/:id
// @desc    Get single item
router.get("/:id", getItemById);

// @route   POST /api/items
// @desc    Create new item
router.post("/", createItem);

// @route   PUT /api/items/:id
// @desc    Update item
router.put("/:id", updateItem);

// @route   DELETE /api/items/group/:name
// @desc    Soft delete entire item group (all variants)
// IMPORTANT: Must come BEFORE /:id route!
router.delete("/group/:name", deleteItemGroup);

// @route   DELETE /api/items/:id
// @desc    Soft delete single variant
router.delete("/:id", deleteItem);

// @route   PATCH /api/items/:id/stock
// @desc    Update stock for single variant
router.patch("/:id/stock", updateStock);

export default router;
