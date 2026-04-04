import Order from "../models/Order.js";
import mongoose from "mongoose";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Total revenue — sum of totalAmount where paymentStatus = 'paid'
    const revenueResult = await Order.aggregate([
      { $match: { userId, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Pending dues — sum of totalAmount where paymentStatus = 'unpaid'
    const duesResult = await Order.aggregate([
      { $match: { userId, paymentStatus: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const pendingDues = duesResult[0]?.total || 0;

    // Total orders
    const totalOrders = await Order.countDocuments({ userId });

    // This month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const ordersThisMonth = await Order.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    });

    // Monthly revenue for bar chart — last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Order.aggregate([
      {
        $match: {
          userId,
          paymentStatus: "paid",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build full 12-month array filling gaps with 0
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = monthlyData.find(
        (x) => x._id.year === y && x._id.month === m,
      );
      monthlyRevenue.push({
        month: monthNames[m - 1],
        revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
      });
    }

    // Recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name email");

    res.json({
      success: true,
      totalRevenue,
      pendingDues,
      totalOrders,
      ordersThisMonth,
      monthlyRevenue,
      recentOrders: recentOrders.map((order) => ({
        _id: order._id,
        customerName: order.customerId?.name || "Unknown",
        amount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        date: order.createdAt,
        invoiceNumber: order.invoiceNumber,
      })),
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
