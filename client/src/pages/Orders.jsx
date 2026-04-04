import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";

export const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setAllOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...allOrders];

    // Filter by search term (customer name)
    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.customerId?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by order status
    if (orderStatusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.orderStatus === orderStatusFilter,
      );
    }

    // Filter by payment status
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentStatus === paymentStatusFilter,
      );
    }

    setFilteredOrders(filtered);
  }, [allOrders, searchTerm, orderStatusFilter, paymentStatusFilter]);

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus: newStatus }),
        },
      );

      if (!response.ok) throw new Error("Failed to update order status");

      // Update local state
      const updatedOrders = allOrders.map((order) =>
        order._id === orderId ? { ...order, orderStatus: newStatus } : order,
      );
      setAllOrders(updatedOrders);
      toast.success(`Order status updated to ${newStatus}!`);
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentStatus: newStatus }),
        },
      );

      if (!response.ok) throw new Error("Failed to update payment status");

      // Update local state
      const updatedOrders = allOrders.map((order) =>
        order._id === orderId ? { ...order, paymentStatus: newStatus } : order,
      );
      setAllOrders(updatedOrders);
      toast.success(`Payment status updated to ${newStatus}!`);
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoiceId(orderId);
      const response = await API.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Extract filename from content-disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = "invoice.pdf";
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches) filename = matches[1];
      }

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to download invoice";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDownloadingInvoiceId(null);
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

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(
    (o) => o.orderStatus === "pending",
  ).length;
  const deliveredOrders = allOrders.filter(
    (o) => o.orderStatus === "delivered",
  ).length;
  const unpaidOrders = allOrders.filter(
    (o) => o.paymentStatus === "unpaid",
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] h-screen bg-[#111]">
      <Sidebar />

      <div className="overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-[#161616] border-b border-[#222] px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Manage your sales and invoices
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/orders/add")}
              className="bg-[#378ADD] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold text-xs sm:text-sm whitespace-nowrap"
            >
              + New Order
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-[#111] rounded border border-[#222] p-2.5 sm:p-3">
              <div className="text-gray-400 text-xs font-semibold uppercase">
                Total Orders
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{totalOrders}</div>
            </div>
            <div className="bg-[#111] rounded border border-[#222] p-2.5 sm:p-3">
              <div className="text-gray-400 text-xs font-semibold uppercase">
                Pending
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#e8a020]">
                {pendingOrders}
              </div>
            </div>
            <div className="bg-[#111] rounded border border-[#222] p-2.5 sm:p-3">
              <div className="text-gray-400 text-xs font-semibold uppercase">
                Delivered
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#3fcf8e]">
                {deliveredOrders}
              </div>
            </div>
            <div className="bg-[#111] rounded border border-[#222] p-2.5 sm:p-3">
              <div className="text-gray-400 text-xs font-semibold uppercase">
                Unpaid
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#e05555]">
                {unpaidOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {error && (
            <div className="bg-[#2b0a0a] text-[#e05555] p-3 sm:p-4 rounded-lg mb-6 border border-[#e05555] text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-[#222] rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#378ADD] transition text-xs sm:text-sm"
            />

            {/* Order Status Filters */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-xs sm:text-sm font-semibold">
                Order Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {["all", "pending", "processing", "delivered"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      orderStatusFilter === status
                        ? "bg-[#378ADD] text-white"
                        : "bg-[#161616] text-gray-300 border border-[#222] hover:border-[#378ADD]"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Filters */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-xs sm:text-sm font-semibold">
                Payment Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {["all", "paid", "unpaid", "partial"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setPaymentStatusFilter(status)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      paymentStatusFilter === status
                        ? "bg-[#378ADD] text-white"
                        : "bg-[#161616] text-gray-300 border border-[#222] hover:border-[#378ADD]"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="text-center text-gray-400 py-12">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12 bg-[#161616] rounded-lg border border-[#222]">
              No orders found
            </div>
          ) : (
            <div className="bg-[#161616] rounded-lg border border-[#222] overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1a1a1a] border-b border-[#222]">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Customer
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Amount
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Order Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Payment Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-gray-400 font-semibold text-xs sm:text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-[#222] hover:bg-[#1a1a1a] transition cursor-pointer text-sm"
                      >
                        <td className="px-3 sm:px-6 py-4">
                          <div>
                            <div className="text-white font-semibold text-xs sm:text-sm">
                              {order.customerId?.name || "Unknown"}
                            </div>
                            <div className="text-gray-500 text-xs sm:text-sm truncate">
                              {order.customerId?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-gray-300 text-xs sm:text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            Rs.{order.totalAmount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleOrderStatusChange(order._id, e.target.value)
                            }
                            className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold focus:outline-none cursor-pointer ${getOrderStatusBadgeColor(
                              order.orderStatus,
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) =>
                              handlePaymentStatusChange(
                                order._id,
                                e.target.value,
                              )
                            }
                            className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold focus:outline-none cursor-pointer ${getPaymentStatusBadgeColor(
                              order.paymentStatus,
                            )}`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={() =>
                                navigate(`/dashboard/orders/${order._id}`)
                              }
                              className="text-[#378ADD] hover:text-blue-400 text-xs sm:text-sm font-semibold transition"
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadInvoice(order._id)
                              }
                              disabled={downloadingInvoiceId === order._id}
                              className="text-green-400 hover:text-green-300 text-xs sm:text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {downloadingInvoiceId === order._id ? (
                                <>
                                  <span className="animate-spin">⏳</span>
                                  <span className="hidden sm:inline">Loading</span>
                                </>
                              ) : (
                                "Invoice"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-3 sm:p-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-[#1a1a1a] rounded border border-[#222] p-3 sm:p-4 hover:border-[#378ADD] transition space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-400 text-xs font-semibold mb-1">Customer</div>
                        <div className="text-white font-semibold text-sm truncate">{order.customerId?.name || "Unknown"}</div>
                        <div className="text-gray-500 text-xs truncate">{order.customerId?.email}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-gray-400 text-xs font-semibold mb-1">Amount</div>
                        <div className="text-white font-semibold text-sm">Rs.{order.totalAmount?.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleOrderStatusChange(order._id, e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold focus:outline-none cursor-pointer ${getOrderStatusBadgeColor(
                          order.orderStatus,
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusChange(
                            order._id,
                            e.target.value,
                          )
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold focus:outline-none cursor-pointer ${getPaymentStatusBadgeColor(
                          order.paymentStatus,
                        )}`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/dashboard/orders/${order._id}`)
                        }
                        className="flex-1 text-[#378ADD] hover:text-blue-400 text-xs font-semibold transition bg-[#111] border border-[#378ADD] rounded px-2 py-1.5"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadInvoice(order._id)
                        }
                        disabled={downloadingInvoiceId === order._id}
                        className="flex-1 text-green-400 hover:text-green-300 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-[#111] border border-green-400 rounded px-2 py-1.5"
                      >
                        {downloadingInvoiceId === order._id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                          </>
                        ) : (
                          "Invoice"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Count */}
          {filteredOrders.length > 0 && (
            <div className="mt-4 text-gray-400 text-xs sm:text-sm">
              Showing {filteredOrders.length} of {allOrders.length} orders
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
