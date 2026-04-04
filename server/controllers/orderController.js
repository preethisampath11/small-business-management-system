import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Item from "../models/Item.js";
import mongoose from "mongoose";
import { generateInvoicePDF } from "../utils/generateInvoice.js";

// @desc    Get all orders for logged-in seller
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments({ userId });
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customerId", "name email phone");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order with full customer details
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email businessName")
      .populate("customerId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create order (auto-calculate totalAmount from items)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      orderStatus,
      paymentStatus,
      invoiceNumber,
      notes,
    } = req.body;

    // Validate required fields
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer and items are required",
      });
    }

    // Verify customer belongs to this user
    const customer = await Customer.findById(customerId);
    if (!customer || customer.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Customer not found or unauthorized",
      });
    }

    // Check stock availability and collect warnings
    const warnings = [];
    for (const item of items) {
      if (!item.itemId) continue;

      const catalogItem = await Item.findById(item.itemId);
      if (!catalogItem) continue;

      // Each variant is now its own document, so check its stock directly
      const availableStock = catalogItem.stock || 0;

      if (item.quantity > availableStock) {
        const variantText = catalogItem.variantLabel
          ? ` (${catalogItem.variantLabel})`
          : "";
        warnings.push(
          `${catalogItem.name}${variantText} — only ${availableStock} in stock, ordered ${item.quantity}`,
        );
      }
    }

    // Calculate total amount from items (with proper rounding for float precision)
    const totalAmount =
      Math.round(
        items.reduce((sum, item) => {
          return sum + item.quantity * item.price;
        }, 0) * 100,
      ) / 100;

    const order = await Order.create({
      userId: req.user.id,
      customerId,
      items,
      totalAmount,
      orderStatus: orderStatus || "pending",
      paymentStatus: paymentStatus || "unpaid",
      invoiceNumber,
      notes,
    });

    // Update item stock for each item in the order
    // Wrap in try/catch to not block order creation on stock sync failure
    try {
      for (const item of items) {
        if (!item.itemId) continue;

        // Each variant is now its own document with its own _id, so simple update
        // Include userId verification to ensure we only update the correct user's items
        await Item.updateOne(
          { _id: item.itemId, userId: req.user.id },
          { $inc: { stock: -item.quantity } },
        );
      }
    } catch (stockError) {
      console.error("Stock update error:", stockError);
      // Don't throw - order is already created, just log error
    }

    await order.populate("customerId", "name email");

    const response = {
      success: true,
      order,
    };

    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status or payment status
// @route   PATCH /api/orders/:id
// @access  Private
export const updateOrder = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, notes } = req.body;

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    // Update allowed fields
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes) order.notes = notes;

    order = await order.save();
    await order.populate("customerId", "name email");

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this order",
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate and download invoice as PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
export const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email businessName")
      .populate("customerId", "name email phone address");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    // Generate invoice number if not already set (format: INV-001, INV-002, etc.)
    let invoiceNumber = order.invoiceNumber;
    if (!invoiceNumber) {
      // Count existing orders with invoiceNumber for this user
      const orderCount = await Order.countDocuments({
        userId: req.user.id,
        invoiceNumber: { $exists: true },
      });
      invoiceNumber = `INV-${String(orderCount + 1).padStart(3, "0")}`;

      // Update the order with the generated invoice number
      order.invoiceNumber = invoiceNumber;
      await order.save();
    }

    // Prepare invoice data with validation
    if (!order.items || order.items.length === 0) {
      console.error("Invalid Order: No items found", {
        orderId: req.params.id,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid order: no items found",
      });
    }

    if (!order.customerId || !order.customerId.name) {
      console.error("Invalid Order: Customer not properly populated", {
        orderId: req.params.id,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid order: customer not found",
      });
    }

    if (!order.userId || !order.userId.email) {
      console.error("Invalid Order: User not properly populated", {
        orderId: req.params.id,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid order: seller not found",
      });
    }

    const invoiceData = {
      invoiceNumber,
      date: order.createdAt,
      sellerName: order.userId.businessName || order.userId.name,
      sellerEmail: order.userId.email,
      customerName: order.customerId.name,
      customerEmail: order.customerId.email || "",
      customerPhone: order.customerId.phone || "",
      customerAddress: order.customerId.address || "",
      items: order.items,
      totalAmount: order.totalAmount,
    };

    console.log(
      "Invoice Data Being Sent:",
      JSON.stringify(invoiceData, null, 2),
    );

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    console.log("PDF Generated Successfully, Size:", pdfBuffer.length, "bytes");

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoiceNumber}.pdf"`,
    );

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Invoice Generation Error:", {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: `Failed to generate invoice: ${error.message}`,
    });
  }
};

// @desc    Cancel order and restore stock
// @route   PATCH /api/orders/:id/cancel
// @access  Private
// TODO: Implement order cancellation with stock restoration
// When implemented:
// 1. Find order by ID
// 2. Verify ownership
// 3. Check if order can be cancelled (not already delivered)
// 4. For each item in order:
//    - If variantLabel exists, restore variant stock
//    - If no variantLabel, restore main item stock
// 5. Mark order as cancelled
// 6. Return updated order with restoration summary
export const cancelOrder = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Order cancellation not yet implemented",
  });
};

// @desc    Get revenue stats for a specific date
// @route   GET /api/orders/stats/by-date
// @access  Private
export const getStatsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date required",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    // Parse date in local timezone (not UTC)
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);

    const result = await Order.aggregate([
      {
        $match: {
          userId,
          paymentStatus: "paid",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      date,
      revenue: result[0]?.total || 0,
      orderCount: result[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
