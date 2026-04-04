import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch order details");
        const data = await response.json();
        setOrder(data.order);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      setError("");

      const response = await API.get(`/orders/${id}/invoice`, {
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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to download invoice",
      );
    } finally {
      setDownloadingInvoice(false);
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

  return (
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] overflow-auto">
        {/* Header */}
        <div className="bg-[#161616] border-b border-[#222] px-4 sm:px-6 md:px-8 py-4 sm:py-5">
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="text-[#378ADD] hover:text-blue-400 text-xs sm:text-sm font-semibold transition whitespace-nowrap mb-3"
          >
            ← Back to Orders
          </button>
          {order && (
            <p className="text-gray-400 text-xs sm:text-sm">
              Invoice #{order.invoiceNumber || "Not generated"}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {error && (
            <div className="bg-[#2b0a0a] text-[#e05555] p-4 rounded-lg mb-6 border border-[#e05555]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-400 py-12">
              Loading order details...
            </div>
          ) : !order ? (
            <div className="text-center text-gray-400 py-12 bg-[#161616] rounded-lg border border-[#222]">
              Order not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-6">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Customer Information
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400 text-sm">Name</div>
                      <div className="text-white font-semibold">
                        {order.customerId?.name || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Email</div>
                      <div className="text-white">
                        {order.customerId?.email || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Phone</div>
                      <div className="text-white">
                        {order.customerId?.phone || "N/A"}
                      </div>
                    </div>
                    {order.customerId?.address && (
                      <div>
                        <div className="text-gray-400 text-sm">Address</div>
                        <div className="text-white">
                          {order.customerId.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Status */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-6">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Order Status
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-2">
                        Order Status
                      </div>
                      <select
                        value={order.orderStatus}
                        className={`w-full px-3 py-2 rounded text-sm font-semibold focus:outline-none cursor-pointer ${getOrderStatusBadgeColor(
                          order.orderStatus,
                        )}`}
                        disabled
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-2">
                        Payment Status
                      </div>
                      <select
                        value={order.paymentStatus}
                        className={`w-full px-3 py-2 rounded text-sm font-semibold focus:outline-none cursor-pointer ${getPaymentStatusBadgeColor(
                          order.paymentStatus,
                        )}`}
                        disabled
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-2">
                        Order Date
                      </div>
                      <div className="text-white">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-[#161616] rounded-lg border border-[#222] p-6">
                <h2 className="text-lg font-bold text-white mb-4">Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a1a1a] border-b border-[#222]">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-400 font-semibold text-sm">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-left text-gray-400 font-semibold text-sm">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-gray-400 font-semibold text-sm">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-gray-400 font-semibold text-sm">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items &&
                        order.items.map((item, idx) => (
                          <tr key={idx} className="border-t border-[#222]">
                            <td className="px-4 py-3 text-white">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-white">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-white">
                              Rs. {item.price?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-white font-semibold">
                              Rs.{" "}
                              {(item.quantity * item.price)?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total and Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-6">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-[#222] pt-3 flex justify-between">
                      <span className="text-white font-bold text-lg">
                        Total Amount:
                      </span>
                      <span className="text-[#378ADD] font-bold text-lg">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-[#161616] rounded-lg border border-[#222] p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadInvoice}
                      disabled={downloadingInvoice}
                      className="w-full bg-[#378ADD] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {downloadingInvoice ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Generating Invoice...
                        </>
                      ) : (
                        <>📥 Download Invoice</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
