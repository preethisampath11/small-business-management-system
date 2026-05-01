import Item from "../models/Item.js";
import mongoose from "mongoose";

// @desc    Get all items for logged-in seller
// @route   GET /api/items
// @access  Private
export const getItems = async (req, res) => {
  try {
    const items = await Item.find({
      userId: req.user.id,
      isActive: true,
    }).sort({ name: 1 });

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

// @desc    Get all items with expanded variants (for cascading dropdowns in AddOrder)
// @route   GET /api/items/flat
// @access  Private
export const getItemsFlat = async (req, res) => {
  try {
    const items = await Item.find({
      userId: req.user.id,
      isActive: true,
    }).sort({ name: 1 });

    // Expand variants for frontend cascading dropdowns
    const flatItems = items.map((item) => {
      const itemObj = item.toObject();

      if (!itemObj.variantTypes || itemObj.variantTypes.length === 0) {
        // No variants: item acts as a single option
        return {
          ...itemObj,
          flatVariants: [
            {
              combination: {},
              price: itemObj.basePrice,
              stock: itemObj.stock,
            },
          ],
        };
      }

      // Has variants: use variants array
      return {
        ...itemObj,
        flatVariants: itemObj.variants || [],
      };
    });

    res.status(200).json({
      success: true,
      items: flatItems,
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

// @desc    Create new item with multi-dimensional variants
// @route   POST /api/items
// @access  Private
export const createItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      unit,
      stock,
      variantTypes,
      variants,
      imageUrl,
      isActive,
    } = req.body;

    // Validation
    if (!name || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and basePrice are required",
      });
    }

    if (typeof basePrice !== "number" || basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "basePrice must be a non-negative number",
      });
    }

    // Validate variantTypes if provided
    let sanitizedVariantTypes = [];
    if (variantTypes && Array.isArray(variantTypes) && variantTypes.length > 0) {
      // Validate structure
      for (const vt of variantTypes) {
        if (!vt.label || typeof vt.label !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each variantType must have a 'label' string",
          });
        }
        if (!Array.isArray(vt.options)) {
          return res.status(400).json({
            success: false,
            message: "Each variantType must have 'options' as an array",
          });
        }
        sanitizedVariantTypes.push({
          label: vt.label.trim(),
          options: vt.options.map((o) => String(o).trim()).filter((o) => o),
        });
      }

      // If variants provided, validate combinations
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          if (!variant.combination || typeof variant.combination !== "object") {
            return res.status(400).json({
              success: false,
              message: "Each variant must have a 'combination' object",
            });
          }
          if (variant.price === undefined || typeof variant.price !== "number") {
            return res.status(400).json({
              success: false,
              message: "Each variant must have a numeric 'price'",
            });
          }
          if (variant.stock === undefined || typeof variant.stock !== "number") {
            return res.status(400).json({
              success: false,
              message: "Each variant must have a numeric 'stock'",
            });
          }

          // Validate combination keys match variantType labels
          const combinationKeys = Object.keys(variant.combination);
          const variantLabels = sanitizedVariantTypes.map((vt) => vt.label);
          for (const key of combinationKeys) {
            if (!variantLabels.includes(key)) {
              return res.status(400).json({
                success: false,
                message: `Combination key '${key}' does not match any variantType label`,
              });
            }
          }
        }
      }
    }

    // Create new item
    const newItem = new Item({
      userId: req.user.id,
      name: name.trim(),
      description: description?.trim() || "",
      category: category?.trim() || "",
      basePrice,
      unit: unit?.trim() || "",
      stock: stock || 0,
      variantTypes: sanitizedVariantTypes,
      variants: variants || [],
      imageUrl: imageUrl?.trim() || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    const createdItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      item: createdItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update item by ObjectId
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      basePrice,
      unit,
      stock,
      variantTypes,
      variants,
      imageUrl,
      isActive,
    } = req.body;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

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

    // Validate basePrice if provided
    if (basePrice !== undefined && (typeof basePrice !== "number" || basePrice < 0)) {
      return res.status(400).json({
        success: false,
        message: "basePrice must be a non-negative number",
      });
    }

    // Validate variantTypes if provided
    if (variantTypes !== undefined) {
      if (!Array.isArray(variantTypes)) {
        return res.status(400).json({
          success: false,
          message: "variantTypes must be an array",
        });
      }

      // Validate structure
      for (const vt of variantTypes) {
        if (!vt.label || typeof vt.label !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each variantType must have a 'label' string",
          });
        }
        if (!Array.isArray(vt.options)) {
          return res.status(400).json({
            success: false,
            message: "Each variantType must have 'options' as an array",
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (unit !== undefined) updateData.unit = unit.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle stock update (only if not updating variants array)
    if (stock !== undefined && !variants) {
      updateData.stock = stock;
    }

    // Handle variantTypes update
    if (variantTypes !== undefined) {
      const sanitizedVariantTypes = variantTypes.map((vt) => ({
        label: vt.label.trim(),
        options: vt.options.map((o) => String(o).trim()).filter((o) => o),
      }));
      updateData.variantTypes = sanitizedVariantTypes;
    }

    // Handle variants update
    if (variants !== undefined && Array.isArray(variants)) {
      // Validate variant combinations if variantTypes exist
      if (item.variantTypes && item.variantTypes.length > 0) {
        const variantLabels = item.variantTypes.map((vt) => vt.label);
        for (const variant of variants) {
          if (!variant.combination || typeof variant.combination !== "object") {
            return res.status(400).json({
              success: false,
              message: "Each variant must have a 'combination' object",
            });
          }
          const combinationKeys = Object.keys(variant.combination);
          for (const key of combinationKeys) {
            if (!variantLabels.includes(key)) {
              return res.status(400).json({
                success: false,
                message: `Combination key '${key}' does not match any variantType label`,
              });
            }
          }
        }
      }
      updateData.variants = variants;
    }

    // Perform update
    const updatedItem = await Item.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item: updatedItem,
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
      { $set: { isActive: false } },
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
      {
        userId: new mongoose.Types.ObjectId(req.user.id),
        name: itemName,
        isActive: true,
      },
      { $set: { isActive: false } },
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
