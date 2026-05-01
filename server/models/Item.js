import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Item must belong to a user"],
  },
  name: {
    type: String,
    required: [true, "Please provide an item name"],
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  basePrice: {
    type: Number,
    required: [true, "Please provide a base price"],
    set: (v) => Math.round(v * 100) / 100,
  },
  unit: {
    type: String,
  },
  stock: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Multi-dimensional variant support
  variantTypes: [
    {
      label: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
    },
  ],
  // Combinations with prices and stock
  variants: [
    {
      combination: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        set: (v) => Math.round(v * 100) / 100,
      },
      stock: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper method to generate all variant combinations using cartesian product
itemSchema.statics.cartesianProduct = function (arrays) {
  return arrays.reduce(
    (acc, arr) => acc.flatMap((a) => arr.map((b) => [...a, b])),
    [[]]
  );
};

// Helper method to build combination object from labels and values
itemSchema.statics.buildCombination = function (variantTypes, valueArray) {
  const combination = {};
  variantTypes.forEach((vt, index) => {
    combination[vt.label] = valueArray[index];
  });
  return combination;
};

export default mongoose.model("Item", itemSchema);
