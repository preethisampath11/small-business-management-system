import Item from "../models/Item.js";
import mongoose from "mongoose";

// @desc    Get all items for logged-in seller (grouped by name)
// @route   GET /api/items
// @access  Private
export const getItems = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const groupedItems = await Item.aggregate([
      { $match: { userId, isActive: true } },
      { $sort: { name: 1, variantLabel: 1 } },
      {
        $group: {
          _id: "$name",
          name: { $first: "$name" },
          category: { $first: "$category" },
          description: { $first: "$description" },
          price: { $first: "$price" },
          unit: { $first: "$unit" },
          imageUrl: { $first: "$imageUrl" },
          totalStock: { $sum: "$stock" },
          variants: {
            $push: {
              _id: "$_id",
              variantLabel: "$variantLabel",
              stock: "$stock",
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({
      success: true,
      items: groupedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all items ungrouped (as individual variant documents)
// @route   GET /api/items/flat
// @access  Private
export const getItemsFlat = async (req, res) => {
  try {
    const items = await Item.find({ userId: req.user.id, isActive: true }).sort({
      name: 1,
      variantLabel: 1,
    });

    res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Verify ownership
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this item",
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new item (single or multi-variant)
// @route   POST /api/items
// @access  Private
export const createItem = async (req, res) => {
  try {
    const { name, description, category, price, unit, stock, variants, imageUrl, isActive } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    let createdItems = [];

    // If variants array is provided and has items, create one doc per variant
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const docs = variants.map((v) => ({
        userId: req.user.id,
        name,
        description,
        category,
        price,
        unit,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        variantLabel: v.label || "",
        stock: v.stock || 0,
      }));

      createdItems = await Item.insertMany(docs);
    } else {
      // No variants: create single document with empty variantLabel
      const newItem = new Item({
        userId: req.user.id,
        name,
        description,
        category,
        price,
        unit,
        stock: stock || 0,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        variantLabel: "",
      });

      createdItems = [await newItem.save()];
    }

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      items: createdItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update item variant or bulk update by name
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, unit, stock, variants, imageUrl, isActive } = req.body;

    // Check if id is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    let items;

    if (isValidObjectId) {
      // Single variant update by ObjectId (old behavior)
      const item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      // Verify ownership
      if (item.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this item",
        });
      }

      // Update this single variant
      if (name !== undefined) item.name = name;
      if (description !== undefined) item.description = description;
      if (category !== undefined) item.category = category;
      if (price !== undefined) item.price = price;
      if (unit !== undefined) item.unit = unit;
      if (stock !== undefined) item.stock = stock;
      if (imageUrl !== undefined) item.imageUrl = imageUrl;
      if (isActive !== undefined) item.isActive = isActive;

      const updatedItem = await item.save();
      items = [updatedItem];
    } else {
      // Grouped update by name (editing from Items page)
      const itemName = decodeURIComponent(id);

      // Get all variants with this name to verify ownership
      const existingItems = await Item.find({ userId: req.user.id, name: itemName });

      if (existingItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Item group not found",
        });
      }

      // Update group-level fields for ALL variants with this name
      const groupUpdateData = {};
      if (name !== undefined) groupUpdateData.name = name;
      if (description !== undefined) groupUpdateData.description = description;
      if (category !== undefined) groupUpdateData.category = category;
      if (price !== undefined) groupUpdateData.price = price;
      if (unit !== undefined) groupUpdateData.unit = unit;
      if (imageUrl !== undefined) groupUpdateData.imageUrl = imageUrl;
      if (isActive !== undefined) groupUpdateData.isActive = isActive;

      // Update group-level fields for all variants
      if (Object.keys(groupUpdateData).length > 0) {
        await Item.updateMany(
          { userId: req.user.id, name: itemName },
          { $set: groupUpdateData }
        );
      }

      // Update individual variant stocks if provided
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          if (variant._id && variant.stock !== undefined) {
            await Item.findByIdAndUpdate(
              variant._id,
              { $set: { stock: variant.stock, variantLabel: variant.variantLabel } },
              { new: true }
            );
          }
        }
      }

      // Fetch updated items
      items = await Item.find({ userId: req.user.id, name: groupUpdateData.name || itemName });
    }

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Soft delete single item variant
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DELETE ITEM] Attempting to delete item ID:", id);

    const result = await Item.updateOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(req.user.id),
      },
      { $set: { isActive: false } }
    );

    console.log("[DELETE ITEM] Update result:", result);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found or not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE ITEM] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Soft delete entire item group (all variants with same name)
// @route   DELETE /api/items/group/:name
// @access  Private
export const deleteItemGroup = async (req, res) => {
  try {
    const itemName = decodeURIComponent(req.params.name);
    console.log("[DELETE GROUP] Attempting to delete group:", itemName);

    const result = await Item.updateMany(
      { userId: new mongoose.Types.ObjectId(req.user.id), name: itemName, isActive: true },
      { $set: { isActive: false } }
    );

    console.log("[DELETE GROUP] Update result:", result);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Item group "${itemName}" deleted successfully (${result.modifiedCount} variants)`,
    });
  } catch (error) {
    console.error("[DELETE GROUP] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update item stock (single variant because each variant is now its own doc)
// @route   PATCH /api/items/:id/stock
// @access  Private
export const updateStock = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Verify ownership
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item",
      });
    }

    const { stock } = req.body;

    if (stock !== undefined) {
      item.stock = Math.max(0, stock); // Never allow negative stock
    }

    const updatedItem = await item.save();

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
