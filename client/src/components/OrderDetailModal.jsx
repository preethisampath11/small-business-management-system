import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

export const OrderDetailModal = ({ isOpen, orderId, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch order");
      const data = await response.json();
      setOrder(data.order || data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (field, newValue) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [field]: newValue }),
        },
      );

      if (!response.ok) throw new Error("Failed to update order");

      setOrder((prev) => ({ ...prev, [field]: newValue }));
      toast.success(`${field} updated successfully`);
      onRefresh?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order?.invoiceNumber || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#ffffff] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#e0e0e0] mt-20">
        <div className="sticky top-0 bg-[#f5f5f5] border-b border-[#e0e0e0] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            Order #{order.invoiceNumber || order._id}
          </h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#1a1a1a] text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-8 text-[#666]">Loading...</div>
          )}

          {!loading && (
            <>
              {/* Customer Info */}
              <div className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]">
                <h3 className="font-semibold text-[#1a1a1a] mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#666]">Name</p>
                    <p className="font-semibold text-[#1a1a1a]">
                      {order.customerId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#666]">Email</p>
                    <p className="font-semibold text-[#1a1a1a]">
                      {order.customerId?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#666]">Phone</p>
                    <p className="font-semibold text-[#1a1a1a]">
                      {order.customerId?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#666]">Date</p>
                    <p className="font-semibold text-[#1a1a1a]">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]">
                <h3 className="font-semibold text-[#1a1a1a] mb-3">
                  Order Items
                </h3>
                <div className="space-y-2 text-sm">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-[#e0e0e0]"
                    >
                      <div>
                        <p className="font-semibold text-[#1a1a1a]">
                          {item.name}
                        </p>
                        {item.combination && (
                          <p className="text-[#666] text-xs">
                            {JSON.stringify(item.combination)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[#666]">
                          {item.quantity} x Rs.{item.price}
                        </p>
                        <p className="font-semibold text-[#1a1a1a]">
                          Rs.{(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]">
                  <h3 className="font-semibold text-[#1a1a1a] mb-2">Notes</h3>
                  <p className="text-[#666] text-sm">{order.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border border-[#e0e0e0] rounded p-4 bg-[#f5f5f5]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#666]">Subtotal:</span>
                  <span className="font-semibold text-[#1a1a1a]">
                    Rs.{order.totalAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                  <span className="text-[#1a1a1a]">Total Amount:</span>
                  <span className="text-[#378ADD]">
                    Rs.{order.totalAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              {/* Status Management */}
              <div className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa] space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Order Status
                  </label>
                  <select
                    value={order.orderStatus || "pending"}
                    onChange={(e) =>
                      handleStatusChange("orderStatus", e.target.value)
                    }
                    disabled={updating}
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] focus:outline-none focus:border-[#378ADD] disabled:bg-[#f5f5f5]"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Payment Status
                  </label>
                  <select
                    value={order.paymentStatus || "unpaid"}
                    onChange={(e) =>
                      handleStatusChange("paymentStatus", e.target.value)
                    }
                    disabled={updating}
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] focus:outline-none focus:border-[#378ADD] disabled:bg-[#f5f5f5]"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={downloadInvoice}
                  disabled={updating}
                  className="px-6 py-2 bg-[#1b5e20] text-white rounded font-semibold hover:bg-[#155724] disabled:bg-gray-400"
                >
                  {updating ? "..." : "Download Invoice"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-[#e0e0e0] text-[#1a1a1a] rounded font-semibold hover:bg-[#d0d0d0]"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
