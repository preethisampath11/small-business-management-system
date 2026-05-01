import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";

export const Customers = () => {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.customers || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      const filtered = data.orders.filter(
        (order) => order.customerId?._id === customerId,
      );
      setCustomerOrders(filtered);
    } catch (err) {
      setError(err.message);
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditingId(customer._id);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = "Phone must be at least 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:5000/api/customers/${editingId}`
        : "http://localhost:5000/api/customers";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save customer");
      }

      const data = await response.json();

      if (editingId) {
        setCustomers(
          customers.map((c) => (c._id === editingId ? data.customer : c)),
        );
        toast.success("Customer updated successfully!");
      } else {
        setCustomers([...customers, data.customer]);
        toast.success("Customer added successfully!");
      }

      closeModal();
      setError("");
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/customers/${customerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete customer");

      setCustomers(customers.filter((c) => c._id !== customerId));
      if (selectedCustomer?._id === customerId) {
        setSelectedCustomer(null);
      }
      setError("");
      toast.success("Customer deleted successfully!");
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
      toast.error(errorMsg);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const openDetailView = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer._id);
  };

  // Calculate totals for a customer
  const calculateCustomerTotals = (orders) => {
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );
    const unpaidAmount = orders
      .filter((order) => order.paymentStatus !== "paid")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const numberOfOrders = orders.length;
    const pendingOrders = orders.filter(
      (order) => order.orderStatus !== "delivered",
    ).length;

    return { totalSpent, unpaidAmount, numberOfOrders, pendingOrders };
  };

  if (selectedCustomer) {
    const totals = calculateCustomerTotals(customerOrders);

    return (
      <>
        <Sidebar />
        <Navbar />

        <div className="ml-[232px] pt-[92px] overflow-auto min-h-screen bg-[#f8f9fa]">
          {/* Header */}
          <div className="bg-[#ffffff] border-b border-[#e0e0e0] px-4 sm:px-6 md:px-8 py-4 sm:py-5 sticky top-0 z-10">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-[#378ADD] hover:text-blue-400 text-xs sm:text-sm font-semibold transition whitespace-nowrap mb-3"
            >
              ← Back to Customers
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                {selectedCustomer.name}
              </h1>
              <p className="text-[#999999] text-xs sm:text-sm mt-1">
                Customer Details & Order History
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Contact Info */}
              <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
                  Contact Information
                </h2>
                <div className="grid gap-4">
                  <div className="grid">
                    <span className="text-[#999999] text-sm">Email</span>
                    <span className="text-[#1a1a1a] font-medium mt-1">
                      {selectedCustomer.email}
                    </span>
                  </div>
                  <div className="grid">
                    <span className="text-[#999999] text-sm">Phone</span>
                    <span className="text-[#1a1a1a] font-medium mt-1">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  {selectedCustomer.address && (
                    <div className="grid">
                      <span className="text-[#999999] text-sm">Address</span>
                      <span className="text-[#1a1a1a] font-medium mt-1">
                        {selectedCustomer.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
                  <div className="text-[#999999] text-sm mb-2">
                    Total Amount Spent
                  </div>
                  <div className="text-3xl font-bold text-[#378ADD]">
                    ₹{totals.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
                  <div className="text-[#999999] text-sm mb-2">Total Orders</div>
                  <div className="text-3xl font-bold text-[#1a1a1a]">
                    {totals.numberOfOrders}
                  </div>
                </div>
              </div>

              {/* More Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
                  <div className="text-[#999999] text-sm mb-2">Pending Dues</div>
                  <div className="text-3xl font-bold text-[#c62828]">
                    ₹{totals.unpaidAmount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
                  <div className="text-[#999999] text-sm mb-2">
                    Pending Orders
                  </div>
                  <div className="text-3xl font-bold text-[#e8a020]">
                    {totals.pendingOrders}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
              <button
                onClick={() => openModal(selectedCustomer)}
                className="bg-[#378ADD] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
              >
                ✎ Edit Customer
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Delete this customer?")) {
                    handleDelete(selectedCustomer._id);
                    setSelectedCustomer(null);
                  }
                }}
                className="bg-[#ffebee] text-[#c62828] px-4 py-2 rounded-lg hover:bg-[#ffcdd2] transition font-semibold border border-[#ef5350]"
              >
                🗑 Delete
              </button>
            </div>

            {/* Order History */}
            <div className="bg-[#ffffff] rounded-lg p-6 border border-[#e0e0e0]">
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4">
                Order History
              </h2>

              {customerOrders.length === 0 ? (
                <div className="text-center text-[#999999] py-8">
                  No orders found for this customer
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#e0e0e0]">
                      <tr>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Date
                        </th>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Amount
                        </th>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Items
                        </th>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Order Status
                        </th>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Payment Status
                        </th>
                        <th className="text-left text-[#1a1a1a] font-semibold px-4 py-2">
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-b border-[#e0e0e0] hover:bg-[#f5f5f5] transition"
                        >
                          <td className="px-4 py-3 text-[#1a1a1a]">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-[#1a1a1a] font-semibold">
                            ₹{order.totalAmount?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[#1a1a1a]">
                            {order.items?.length || 0} item
                            {order.items?.length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded text-xs font-semibold ${
                                order.orderStatus === "delivered"
                                  ? "bg-[#e8f5e9] text-[#1b5e20]"
                                  : "bg-[#fff3e0] text-[#e65100]"
                              }`}
                            >
                              {order.orderStatus?.charAt(0).toUpperCase() +
                                order.orderStatus?.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded text-xs font-semibold ${
                                order.paymentStatus === "paid"
                                  ? "bg-[#e8f5e9] text-[#1b5e20]"
                                  : order.paymentStatus === "unpaid"
                                    ? "bg-[#ffebee] text-[#c62828]"
                                    : "bg-[#fff3e0] text-[#e65100]"
                              }`}
                            >
                              {order.paymentStatus?.charAt(0).toUpperCase() +
                                order.paymentStatus?.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDownloadInvoice(order._id)}
                              disabled={downloadingInvoiceId === order._id}
                              className="text-[#1b5e20] hover:text-[#1b5e20] text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {downloadingInvoiceId === order._id ? (
                                <>
                                  <span className="animate-spin">⏳</span>
                                  <span>Loading</span>
                                </>
                              ) : (
                                <>📥 Download</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#ffffff] rounded-lg border border-[#e0e0e0] p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>

              {error && (
                <div className="bg-[#ffebee] text-[#c62828] p-3 rounded-lg mb-4 border border-[#ef5350] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Customer name"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="email@example.com"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 000-0000"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Street address"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="submit"
                    className="bg-[#378ADD] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-[#f5f5f5] text-[#1a1a1a] px-4 py-2 rounded-lg hover:bg-[#e8e8e8] transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px]">
        {/* Action Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => openModal()}
            className="bg-[#378ADD] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold text-xs sm:text-sm whitespace-nowrap"
          >
            + Add Customer
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {error && (
            <div className="bg-[#ffebee] text-[#c62828] p-4 rounded-lg mb-6 border border-[#ef5350]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-[#999999] py-12">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center text-[#999999] py-12 bg-[#ffffff] rounded-lg border border-[#e0e0e0]">
              No customers found. Click "Add Customer" to create one.
            </div>
          ) : (
            <div className="bg-[#ffffff] rounded-lg border border-[#e0e0e0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[#1a1a1a] font-semibold text-sm">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-[#1a1a1a] font-semibold text-sm">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-[#1a1a1a] font-semibold text-sm">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-[#1a1a1a] font-semibold text-sm">
                        Total Orders
                      </th>
                      <th className="px-6 py-3 text-left text-[#1a1a1a] font-semibold text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => {
                      const customerOrderCount = customerOrders.filter(
                        (o) => o.customerId?._id === customer._id,
                      ).length;

                      return (
                        <tr
                          key={customer._id}
                          className="border-t border-[#e0e0e0] hover:bg-[#f5f5f5] transition"
                        >
                          <td className="px-6 py-4">
                            <span className="text-[#1a1a1a] font-semibold">
                              {customer.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#1a1a1a]">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4 text-[#1a1a1a]">
                            {customer.phone}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[#1a1a1a] font-semibold">
                              {customerOrderCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => openDetailView(customer)}
                                className="text-[#378ADD] hover:text-blue-600 font-semibold transition text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openModal(customer)}
                                className="text-[#1b5e20] hover:text-[#155724] font-semibold transition text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(customer._id)}
                                className="text-[#c62828] hover:text-[#b71c1c] font-semibold transition text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Count */}
          {customers.length > 0 && (
            <div className="mt-4 text-[#999999] text-sm">
              Total: {customers.length} customer
              {customers.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#ffffff] rounded-lg border border-[#e0e0e0] p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>

              {error && (
                <div className="bg-[#ffebee] text-[#c62828] p-3 rounded-lg mb-4 border border-[#ef5350] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Customer name"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="email@example.com"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 000-0000"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                    required
                  />
                </div>

                <div className="grid">
                  <label className="text-[#1a1a1a] font-semibold mb-2">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Street address"
                    className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg px-4 py-2 text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="submit"
                    className="bg-[#378ADD] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-[#f5f5f5] text-[#1a1a1a] px-4 py-2 rounded-lg hover:bg-[#e8e8e8] transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
