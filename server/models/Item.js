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
  variantLabel: {
    type: String,
    default: "",
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, "Please provide a price"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Item", itemSchema);
