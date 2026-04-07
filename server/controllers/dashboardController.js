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
      // Last 6 years (2021-2026)
      const now = new Date();
      const currentYear = now.getFullYear();
      const buckets = [];

      // Build years in ascending order (oldest to newest)
      for (let i = 5; i >= 0; i--) {
        const year = currentYear - i;
        buckets.push({
          label: String(year),
          year: year,
          revenue: 0,
        });
      }

      const startDate = new Date(buckets[0].year, 0, 1);
      const orders = await Order.find({
        userId: new mongoose.Types.ObjectId(req.user.id),
        paymentStatus: "paid",
        createdAt: { $gte: startDate },
      });

      orders.forEach((order) => {
        const year = new Date(order.createdAt).getFullYear();
        const bucket = buckets.find((b) => b.year === year);
        if (bucket) bucket.revenue += order.totalAmount;
      });

      chartData = buckets.map((b) => ({
        label: b.label,
        revenue: Math.round(b.revenue * 100) / 100,
      }));
    } else if (period === "monthly") {
      // All 12 months of current year (Jan-Dec)
      const now = new Date();
      const currentYear = now.getFullYear();
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
      const buckets = [];

      // Build all 12 months in calendar order (Jan = 0, Dec = 11)
      for (let month = 0; month < 12; month++) {
        buckets.push({
          label: monthNames[month],
          year: currentYear,
          month: month,
          revenue: 0,
        });
      }

      const startDate = new Date(currentYear, 0, 1, 0, 0, 0);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      const orders = await Order.find({
        userId: new mongoose.Types.ObjectId(req.user.id),
        paymentStatus: "paid",
        createdAt: { $gte: startDate, $lte: endDate },
      });

      orders.forEach((order) => {
        const d = new Date(order.createdAt);
        const orderYear = d.getFullYear();
        const orderMonth = d.getMonth();
        const bucket = buckets.find(
          (b) => b.year === orderYear && b.month === orderMonth
        );
        if (bucket) bucket.revenue += order.totalAmount;
      });

      chartData = buckets.map((b) => ({
        label: b.label,
        revenue: Math.round(b.revenue * 100) / 100,
      }));
    } else if (period === "weekly") {
      // Current week: Sunday to Saturday
      const now = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      // Find Sunday of current week
      const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const sundayOfThisWeek = new Date(now);
      sundayOfThisWeek.setDate(now.getDate() - currentDayOfWeek); // Go back to Sunday
      sundayOfThisWeek.setHours(0, 0, 0, 0);
      
      // Build buckets for Sun, Mon, Tue, Wed, Thu, Fri, Sat of this week
      const buckets = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sundayOfThisWeek);
        d.setDate(sundayOfThisWeek.getDate() + i); // Add days starting from Sunday
        d.setHours(0, 0, 0, 0);
        
        buckets.push({
          date: new Date(d),
          label: days[i], // Sun (index 0), Mon (index 1), ..., Sat (index 6)
          revenue: 0,
        });
      }

      // Set date range for database query
      const startDate = new Date(buckets[0].date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(buckets[6].date);
      endDate.setHours(23, 59, 59, 999);
      
      const orders = await Order.find({
        userId: new mongoose.Types.ObjectId(req.user.id),
        paymentStatus: "paid",
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Match orders to buckets by exact date
      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0); // Normalize time
        
        const bucket = buckets.find(
          (b) =>
            b.date.getFullYear() === orderDate.getFullYear() &&
            b.date.getMonth() === orderDate.getMonth() &&
            b.date.getDate() === orderDate.getDate()
        );
        if (bucket) bucket.revenue += order.totalAmount;
      });

      chartData = buckets.map((b) => ({
        label: b.label,
        revenue: Math.round(b.revenue * 100) / 100,
      }));
      console.log("Weekly chart data:", JSON.stringify(chartData));
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
