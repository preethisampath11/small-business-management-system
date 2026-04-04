import Order from "../models/Order.js";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Aggregation pipeline to calculate all stats
    const stats = await Order.aggregate([
      // Match orders for current user
      {
        $match: { userId: req.user.id },
      },
      // Group and calculate stats
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                "$totalAmount",
                0,
              ],
            },
          },
          pendingDues: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "unpaid"] },
                "$totalAmount",
                0,
              ],
            },
          },
          partialDues: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "partial"] },
                "$totalAmount",
                0,
              ],
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Get count of orders this month
    const ordersThisMonth = await Order.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });

    // Get recent orders (last 5) with customer details
    const recentOrders = await Order.find({ userId: req.user.id })
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id customerId totalAmount paymentStatus orderStatus createdAt invoiceNumber");

    // Prepare response
    const dashboardStats = {
      totalRevenue: stats.length > 0 ? stats[0].totalRevenue : 0,
      pendingDues: stats.length > 0 ? stats[0].pendingDues : 0,
      partialDues: stats.length > 0 ? stats[0].partialDues : 0,
      totalOrders: stats.length > 0 ? stats[0].totalOrders : 0,
      ordersThisMonth: ordersThisMonth,
      recentOrders: recentOrders.map((order) => ({
        _id: order._id,
        customerName: order.customerId?.name || "Unknown",
        amount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        date: order.createdAt,
        invoiceNumber: order.invoiceNumber,
      })),
    };

    res.status(200).json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
