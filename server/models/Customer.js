import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Customer must belong to a user"],
  },
  name: {
    type: String,
    required: [true, "Please provide a customer name"],
  },
  email: {
    type: String,
    required: [true, "Please provide a customer email"],
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Customer", customerSchema);
