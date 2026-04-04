import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await API.get("/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setStats(response.data.data);
          setError("");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard");
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-[#0d2b1a] text-[#3fcf8e] border border-[#3fcf8e]";
      case "unpaid":
        return "bg-[#2b0a0a] text-[#e05555] border border-[#e05555]";
      case "partial":
        return "bg-[#2b1a00] text-[#e8a020] border border-[#e8a020]";
      default:
        return "bg-[#222] text-gray-300 border border-[#222]";
    }
  };

  const getOrderStatusBadgeColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-[#0d2b1a] text-[#3fcf8e] border border-[#3fcf8e]";
      case "processing":
        return "bg-[#2b1a00] text-[#e8a020] border border-[#e8a020]";
      case "pending":
        return "bg-[#2b1a00] text-[#e8a020] border border-[#e8a020]";
      default:
        return "bg-[#222] text-gray-300 border border-[#222]";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] h-screen bg-[#111]">
      <Sidebar />

      <div className="overflow-auto flex flex-col">
        {/* Top Navbar */}
        <div className="bg-[#161616] border-b border-[#222] px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Welcome back, {user?.name || "User"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/dashboard/orders")}
                className="text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition"
              >
                Orders
              </button>
              <button
                onClick={() => navigate("/dashboard/customers")}
                className="text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition"
              >
                Customers
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#e05555] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold text-xs sm:text-sm ml-auto sm:ml-0"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {error && (
            <div className="bg-[#2b0a0a] text-[#e05555] p-4 rounded-lg mb-6 border border-[#e05555] text-xs sm:text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-400 py-12">
              Loading dashboard...
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Revenue Card */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-4 sm:p-6 hover:border-[#378ADD] transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-gray-400 text-xs sm:text-sm font-semibold mb-2">
                        Total Revenue
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#3fcf8e] truncate">
                        Rs. {stats.totalRevenue?.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs mt-2">
                        From paid orders
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl text-[#3fcf8e] opacity-20 flex-shrink-0">💰</div>
                  </div>
                </div>

                {/* Pending Dues Card */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-4 sm:p-6 hover:border-[#e05555] transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-gray-400 text-xs sm:text-sm font-semibold mb-2">
                        Pending Dues
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#e05555] truncate">
                        Rs. {stats.pendingDues?.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs mt-2">
                        Unpaid orders
                      </div>
                    </div>
                    <div className="text-4xl text-[#e05555] opacity-20">⏳</div>
                  </div>
                </div>

                {/* Total Orders Card */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-4 sm:p-6 hover:border-[#378ADD] transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-gray-400 text-xs sm:text-sm font-semibold mb-2">
                        Total Orders
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#378ADD]">
                        {stats.totalOrders}
                      </div>
                      <div className="text-gray-500 text-xs mt-2">
                        All time
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl text-[#378ADD] opacity-20 flex-shrink-0">📦</div>
                  </div>
                </div>

                {/* Orders This Month Card */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-4 sm:p-6 hover:border-[#e8a020] transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-gray-400 text-xs sm:text-sm font-semibold mb-2">
                        This Month
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#e8a020]">
                        {stats.ordersThisMonth}
                      </div>
                      <div className="text-gray-500 text-xs mt-2">
                        Orders created
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl text-[#e8a020] opacity-20 flex-shrink-0">📅</div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-[#161616] rounded-lg border border-[#222] p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white">Recent Orders</h2>
                  <button
                    onClick={() => navigate("/dashboard/orders")}
                    className="text-[#378ADD] hover:text-blue-400 text-xs sm:text-sm font-semibold transition white-space-nowrap"
                  >
                    View All →
                  </button>
                </div>

                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#1a1a1a] border-b border-[#222]">
                          <tr>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Invoice #
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Customer
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Amount
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Order Status
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Payment Status
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-t border-[#222] hover:bg-[#1a1a1a] transition cursor-pointer"
                              onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                            >
                              <td className="px-3 sm:px-4 py-4">
                                <span className="text-white font-mono font-semibold text-xs sm:text-sm">
                                  {order.invoiceNumber || "N/A"}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-4 text-white text-xs sm:text-sm">
                                {order.customerName}
                              </td>
                              <td className="px-3 sm:px-4 py-4">
                                <span className="text-white font-semibold text-xs sm:text-sm">
                                Rs. {order.amount?.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-4">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold inline-block ${getOrderStatusBadgeColor(
                                  order.orderStatus,
                                )}`}
                              >
                                {order.orderStatus?.charAt(0).toUpperCase() +
                                  order.orderStatus?.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-4">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold inline-block ${getPaymentStatusBadgeColor(
                                  order.paymentStatus,
                                )}`}
                              >
                                {order.paymentStatus?.charAt(0).toUpperCase() +
                                  order.paymentStatus?.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-4 text-gray-400 text-xs sm:text-sm">
                              {new Date(order.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {stats.recentOrders.map((order) => (
                        <div
                          key={order._id}
                          onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                          className="bg-[#1a1a1a] rounded border border-[#222] p-4 hover:border-[#378ADD] transition cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="min-w-0">
                              <div className="text-gray-400 text-xs font-semibold">Invoice #</div>
                              <div className="text-white font-mono font-semibold text-sm truncate">{order.invoiceNumber || "N/A"}</div>
                            </div>
                            <span className="text-white font-semibold text-sm whitespace-nowrap">Rs. {order.amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="min-w-0">
                              <div className="text-gray-400 text-xs font-semibold">Customer</div>
                              <div className="text-white text-sm truncate">{order.customerName}</div>
                            </div>
                            <div className="text-gray-400 text-xs whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getOrderStatusBadgeColor(
                                order.orderStatus,
                              )}`}
                            >
                              {order.orderStatus?.charAt(0).toUpperCase() +
                                order.orderStatus?.slice(1)}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentStatusBadgeColor(
                                order.paymentStatus,
                              )}`}
                            >
                              {order.paymentStatus?.charAt(0).toUpperCase() +
                                order.paymentStatus?.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No recent orders
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
