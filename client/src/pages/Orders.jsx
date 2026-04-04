import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import { AddOrder } from "./AddOrder";

export const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({});

  // Fetch orders with pagination
  const fetchOrders = async (pageNum = page, limitNum = limit) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await API.get(
        `/orders?page=${pageNum}&limit=${limitNum}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAllOrders(response.data.orders || []);
        setPagination(response.data.pagination || {});
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, limit);
  }, [page, limit]);

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

  // Handle limit change - reset to page 1
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Status Pill Component
  const StatusPill = ({ status }) => {
    const styles = {
      paid: { bg: "#0d2b1a", color: "#3fcf8e" },
      unpaid: { bg: "#2b0a0a", color: "#e05555" },
      partial: { bg: "#2b1a00", color: "#e8a020" },
      pending: { bg: "#2b1a00", color: "#e8a020" },
      delivered: { bg: "#0d2b1a", color: "#3fcf8e" },
      processing: { bg: "#0d1e2e", color: "#378ADD" },
    };
    const s =
      styles[status?.toLowerCase()] || { bg: "#1e1e1e", color: "#888" };
    return (
      <span
        style={{
          background: s.bg,
          color: s.color,
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "500",
          border: `1px solid ${s.color}33`,
          whiteSpace: "nowrap",
        }}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Pagination button styling helper
  const pageBtn = (disabled) => ({
    background: "#1e1e1e",
    color: disabled ? "#333" : "#888",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    cursor: disabled ? "default" : "pointer",
    fontFamily: "Inter, system-ui",
  });

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
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to download invoice";
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
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] p-4 sm:p-6">
        {/* Stat Cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {/* Total Orders Card */}
          <div
            style={{
              background: '#161616',
              border: '1px solid #222',
              borderRadius: '14px',
              padding: '20px 24px',
              minWidth: '0',
              flex: 1
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}
            >
              Total Orders
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#e8e8e8' }}>
              {totalOrders}
            </div>
          </div>

          {/* Pending Card */}
          <div
            style={{
              background: '#161616',
              border: '1px solid #222',
              borderRadius: '14px',
              padding: '20px 24px',
              minWidth: '0',
              flex: 1
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}
            >
              Pending
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#e8a020' }}>
              {pendingOrders}
            </div>
          </div>

          {/* Delivered Card */}
          <div
            style={{
              background: '#161616',
              border: '1px solid #222',
              borderRadius: '14px',
              padding: '20px 24px',
              minWidth: '0',
              flex: 1
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}
            >
              Delivered
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#3fcf8e' }}>
              {deliveredOrders}
            </div>
          </div>

          {/* Unpaid Card */}
          <div
            style={{
              background: '#161616',
              border: '1px solid #222',
              borderRadius: '14px',
              padding: '20px 24px',
              minWidth: '0',
              flex: 1
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}
            >
              Unpaid
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#e05555' }}>
              {unpaidOrders}
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
          ) : allOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12 bg-[#161616] rounded-lg border border-[#222]">
              No orders found
            </div>
          ) : (
            <>
              {/* Per-page selector */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    background: "#1e1e1e",
                    color: "#888",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

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
                    {allOrders.map((order) => (
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
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            Rs.{order.totalAmount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div
                            onClick={() => handleOrderStatusChange(order._id, order.orderStatus === "pending" ? "processing" : order.orderStatus === "processing" ? "delivered" : "pending")}
                            style={{ cursor: "pointer" }}
                          >
                            <StatusPill status={order.orderStatus} />
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div
                            onClick={() => handlePaymentStatusChange(order._id, order.paymentStatus === "unpaid" ? "partial" : order.paymentStatus === "partial" ? "paid" : "unpaid")}
                            style={{ cursor: "pointer" }}
                          >
                            <StatusPill status={order.paymentStatus} />
                          </div>
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
                              onClick={() => handleDownloadInvoice(order._id)}
                              disabled={downloadingInvoiceId === order._id}
                              className="text-green-400 hover:text-green-300 text-xs sm:text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {downloadingInvoiceId === order._id ? (
                                <>
                                  <span className="animate-spin">⏳</span>
                                  <span className="hidden sm:inline">
                                    Loading
                                  </span>
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
                {allOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-[#1a1a1a] rounded border border-[#222] p-3 sm:p-4 hover:border-[#378ADD] transition space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-400 text-xs font-semibold mb-1">
                          Customer
                        </div>
                        <div className="text-white font-semibold text-sm truncate">
                          {order.customerId?.name || "Unknown"}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {order.customerId?.email}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-gray-400 text-xs font-semibold mb-1">
                          Amount
                        </div>
                        <div className="text-white font-semibold text-sm">
                          Rs.{order.totalAmount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div>
                        <StatusPill status={order.orderStatus} />
                      </div>
                      <div>
                        <StatusPill status={order.paymentStatus} />
                      </div>
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
                        onClick={() => handleDownloadInvoice(order._id)}
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

              {/* Pagination Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  padding: "0 4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#555" }}>
                  Showing{" "}
                  {(page - 1) * limit + 1}–
                  {Math.min(page * limit, pagination.total || 0)} of{" "}
                  {pagination.total || 0} orders
                </span>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      background: "#1e1e1e",
                      color: page === 1 ? "#333" : "#888",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: page === 1 ? "default" : "pointer",
                    }}
                  >
                    ← Prev
                  </button>

                  {/* Page number pills — show max 5 */}
                  {Array.from(
                    {
                      length: Math.min(5, pagination.totalPages || 1),
                    },
                    (_, i) => {
                      const start = Math.max(
                        1,
                        Math.min(
                          (pagination.totalPages || 1) - 4,
                          page - 2
                        )
                      );
                      const p = start + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            background: p === page ? "#378ADD" : "#1e1e1e",
                            color: p === page ? "#fff" : "#888",
                            border: "1px solid #2a2a2a",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                            minWidth: "32px",
                          }}
                        >
                          {p}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.totalPages || 1, p + 1)
                      )
                    }
                    disabled={page === (pagination.totalPages || 1)}
                    style={{
                      background: "#1e1e1e",
                      color:
                        page === (pagination.totalPages || 1) ? "#333" : "#888",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor:
                        page === (pagination.totalPages || 1)
                          ? "default"
                          : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Add Order Button */}
      <button
        onClick={() => setShowAddOrder(true)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          background: '#378ADD',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          padding: '14px 24px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui',
          boxShadow: '0 4px 20px rgba(55, 138, 221, 0.4)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span> Add Order
      </button>

      {/* Add Order Modal */}
      {showAddOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddOrder(false);
          }}
        >
          <div style={{
            background: '#161616',
            border: '1px solid #222',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '860px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddOrder(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>
            <AddOrder
              isModal={true}
              onSuccess={() => {
                setShowAddOrder(false);
                fetchOrders();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
