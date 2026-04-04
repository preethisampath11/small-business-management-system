import Order from "../models/Order.js";
import Item from "../models/Item.js";
import mongoose from "mongoose";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const { period = "yearly" } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();

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
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const ordersThisMonth = await Order.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    });

    // Build chart data based on period
    let chartData = [];

    if (period === "yearly") {
      // Last 12 months grouped by month (using local timezone)
      const startLocal = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
      const start = startLocal;

      const raw = await Order.aggregate([
        {
          $match: {
            userId,
            paymentStatus: "paid",
            createdAt: { $gte: start },
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
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const found = raw.find((x) => x._id.year === y && x._id.month === m);
        chartData.push({
          label: monthNames[m - 1],
          revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
        });
      }
    } else if (period === "monthly") {
      // Last 30 days grouped by day (using local timezone)
      const startLocal = new Date(now);
      startLocal.setDate(startLocal.getDate() - 29);
      const start = new Date(startLocal.getFullYear(), startLocal.getMonth(), startLocal.getDate(), 0, 0, 0, 0);

      const raw = await Order.aggregate([
        {
          $match: {
            userId,
            paymentStatus: "paid",
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const found = raw.find(
          (x) => x._id.year === y && x._id.month === m && x._id.day === day
        );
        chartData.push({
          label: `${day}/${m}`,
          revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
        });
      }
    } else if (period === "weekly") {
      // Last 7 days grouped by day (using local timezone)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const startLocal = new Date(now);
      startLocal.setDate(startLocal.getDate() - 6);
      const start = new Date(startLocal.getFullYear(), startLocal.getMonth(), startLocal.getDate(), 0, 0, 0, 0);

      const raw = await Order.aggregate([
        {
          $match: {
            userId,
            paymentStatus: "paid",
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const found = raw.find(
          (x) => x._id.year === y && x._id.month === m && x._id.day === day
        );
        chartData.push({
          label: dayNames[d.getDay()],
          revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
        });
      }
    }

    // Recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name email")
      .lean();

    // Console log for debugging (optional)
    if (recentOrders.length > 0) {
      console.log("Sample order:", JSON.stringify(recentOrders[0], null, 2));
    }

    // Low stock items — stock <= 10
    const lowStockItems = await Item.aggregate([
      {
        $match: {
          userId,
          isActive: true,
          stock: { $lte: 10 },
        },
      },
      { $sort: { stock: 1 } },
      { $limit: 5 },
      { $project: { name: 1, variantLabel: 1, stock: 1 } },
    ]);

    const lowStockCount = await Item.countDocuments({
      userId,
      isActive: true,
      stock: { $lte: 10 },
    });

    // Top selling items — by quantity across all orders
    const topSellingItems = await Order.aggregate([
      {
        $match: {
          userId,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$items.quantity", "$items.price"],
            },
          },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      totalRevenue,
      pendingDues,
      totalOrders,
      ordersThisMonth,
      chartData,
      recentOrders,
      lowStockItems,
      lowStockCount,
      topSellingItems,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
