import React, { useState, useEffect, useContext, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import { AddOrderModal } from "../components/AddOrderModal";
import { OrderDetailModal } from "../components/OrderDetailModal";

export const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({});
  const searchTimeoutRef = useRef(null);

  // Fetch orders with pagination and advanced search
  const fetchOrders = async (
    pageNum = page,
    limitNum = limit,
    search = searchTerm,
    type = searchType,
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pageNum,
        limit: limitNum,
        search: search.trim(),
        searchType: type,
      });

      const response = await API.get(`/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || {});
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, limit, searchTerm, searchType);
  }, [page, limit]);

  // Debounced search - refetch when search term or search type changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchOrders(1, limit, searchTerm, searchType);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchType]);

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
    const s = styles[status?.toLowerCase()] || { bg: "#1e1e1e", color: "#888" };
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
      const updatedOrders = orders.map((order) =>
        order._id === orderId ? { ...order, orderStatus: newStatus } : order,
      );
      setOrders(updatedOrders);
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
      const updatedOrders = orders.map((order) =>
        order._id === orderId ? { ...order, paymentStatus: newStatus } : order,
      );
      setOrders(updatedOrders);
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

  const totalOrders = pagination.total || 0;
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "pending",
  ).length;
  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "delivered",
  ).length;
  const unpaidOrders = orders.filter(
    (o) => o.paymentStatus === "unpaid",
  ).length;

  return (
    <div className="relative min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <Navbar />

      <div className="main-content">
        {/* Stat Cards */}
        <div className="card-strip" style={{ marginBottom: "20px" }}>
          <div className="stat-card">
            <div
              style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}
            >
              Total Orders
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "600", color: "#1a1a1a" }}
            >
              {totalOrders}
            </div>
          </div>

          <div className="stat-card">
            <div
              style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}
            >
              Pending
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "600", color: "#e8a020" }}
            >
              {pendingOrders}
            </div>
          </div>

          <div className="stat-card">
            <div
              style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}
            >
              Delivered
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "600", color: "#3fcf8e" }}
            >
              {deliveredOrders}
            </div>
          </div>

          <div className="stat-card">
            <div
              style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}
            >
              Unpaid
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "600", color: "#e05555" }}
            >
              {unpaidOrders}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="bg-[#2b0a0a] text-[#e05555] p-3 sm:p-4 rounded-lg mb-6 border border-[#e05555] text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Recent Orders Table */}
          <div className="section-card">
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "16px",
              }}
            >
              Recent Orders
            </h3>

            {/* Search Bar Inside Card */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search by customer, invoice, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{ width: "100%" }}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "#378ADD",
                    border: "none",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-[#161616] rounded-lg border border-[#222]">
                {searchTerm
                  ? "No orders found matching your search"
                  : "No orders found"}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Order Status</th>
                        <th>Payment Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          onClick={() => setSelectedOrderId(order._id)}
                          style={{ cursor: "pointer" }}
                          className="hover:bg-[#f5f5f5] transition"
                        >
                          <td style={{ color: "#555", fontSize: "12px" }}>
                            {order.invoiceNumber || "N/A"}
                          </td>
                          <td>
                            <div
                              style={{ fontWeight: "500", color: "#1a1a1a" }}
                            >
                              {order.customerId?.name || "Unknown"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#555" }}>
                              {order.customerId?.email}
                            </div>
                          </td>
                          <td style={{ color: "#888", fontSize: "12px" }}>
                            {order.customerId?.phone || "N/A"}
                          </td>
                          <td style={{ color: "#555" }}>
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td style={{ fontWeight: "500" }}>
                            Rs.{" "}
                            {Number(order.totalAmount).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span
                              className={`pill pill-${order.orderStatus}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const statuses = [
                                  "pending",
                                  "processing",
                                  "delivered",
                                ];
                                const currentIndex = statuses.indexOf(
                                  order.orderStatus,
                                );
                                const nextStatus =
                                  statuses[
                                    (currentIndex + 1) % statuses.length
                                  ];
                                handleOrderStatusChange(order._id, nextStatus);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pill pill-${order.paymentStatus}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const statuses = ["unpaid", "partial", "paid"];
                                const currentIndex = statuses.indexOf(
                                  order.paymentStatus,
                                );
                                const nextStatus =
                                  statuses[
                                    (currentIndex + 1) % statuses.length
                                  ];
                                handlePaymentStatusChange(
                                  order._id,
                                  nextStatus,
                                );
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{ display: "flex", gap: "12px" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setSelectedOrderId(order._id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#378ADD",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontFamily: "Inter, system-ui",
                                }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDownloadInvoice(order._id)}
                                disabled={downloadingInvoiceId === order._id}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#1b5e20",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontFamily: "Inter, system-ui",
                                }}
                              >
                                {downloadingInvoiceId === order._id ? (
                                  <>
                                    <span>⏳</span>
                                    <span className="hidden sm:inline">
                                      {" "}
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
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrderId(order._id)}
                      className="bg-[#ffffff] rounded border border-[#e0e0e0] p-3 sm:p-4 hover:border-[#378ADD] transition space-y-3 cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[#999999] text-xs font-semibold mb-1">
                            Customer
                          </div>
                          <div className="text-[#1a1a1a] font-semibold text-sm truncate">
                            {order.customerId?.name || "Unknown"}
                          </div>
                          <div className="text-[#999999] text-xs truncate">
                            {order.customerId?.email}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[#999999] text-xs font-semibold mb-1">
                            Amount
                          </div>
                          <div className="text-[#1a1a1a] font-semibold text-sm">
                            Rs.{order.totalAmount?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
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
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedOrderId(order._id)}
                          className="flex-1 text-[#378ADD] hover:text-blue-600 text-xs font-semibold transition bg-[#f5f5f5] border border-[#378ADD] rounded px-2 py-1.5"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(order._id)}
                          disabled={downloadingInvoiceId === order._id}
                          className="flex-1 text-[#1b5e20] hover:text-[#155724] text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-[#f5f5f5] border border-[#1b5e20] rounded px-2 py-1.5"
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

                {/* Pagination Controls */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    marginTop: "16px",
                    padding: "0 4px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#555" }}>
                    Showing {Math.min((page - 1) * limit + 1, pagination.total)}
                    –{Math.min(page * limit, pagination.total)} of{" "}
                    {pagination.total} orders
                  </span>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="page-btn"
                    >
                      «
                    </button>

                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="page-btn"
                    >
                      ‹
                    </button>

                    {/* Page numbers */}
                    {Array.from(
                      {
                        length: Math.min(5, pagination.totalPages || 1),
                      },
                      (_, i) => {
                        const start = Math.max(
                          1,
                          Math.min((pagination.totalPages || 1) - 4, page - 2),
                        );
                        const p = start + i;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`page-btn ${p === page ? "active" : ""}`}
                          >
                            {p}
                          </button>
                        );
                      },
                    )}

                    <button
                      onClick={() =>
                        setPage((p) =>
                          Math.min(pagination.totalPages || 1, p + 1),
                        )
                      }
                      disabled={page === (pagination.totalPages || 1)}
                      className="page-btn"
                    >
                      ›
                    </button>

                    <button
                      onClick={() => setPage(pagination.totalPages || 1)}
                      disabled={page === (pagination.totalPages || 1)}
                      className="page-btn"
                    >
                      »
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAddOrderModal(true)}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          background: "#378ADD",
          color: "#fff",
          border: "none",
          borderRadius: "50px",
          padding: "14px 24px",
          fontSize: "15px",
          fontWeight: "600",
          cursor: "pointer",
          fontFamily: "Inter, system-ui",
          boxShadow: "0 4px 20px rgba(55, 138, 221, 0.4)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span> Add Order
      </button>

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onSuccess={() => fetchOrders()}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!selectedOrderId}
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onRefresh={() => fetchOrders()}
      />
    </div>
  );
};
