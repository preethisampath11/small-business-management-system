import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export const AddOrder = ({ isModal = false, onSuccess } = {}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    customerId: "",
    items: [{ itemId: "", quantity: 1, price: 0, priceOverride: false }],
    notes: "",
  });

  // Customer creation inline form states
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [customerFormErrors, setCustomerFormErrors] = useState({});
  const [customerFormLoading, setCustomerFormLoading] = useState(false);

  // Fetch customers and items on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch customers
        const customersRes = await fetch(
          "http://localhost:5000/api/customers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!customersRes.ok) throw new Error("Failed to fetch customers");
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);

        // Fetch items from catalog (flat/ungrouped for dropdown)
        const itemsRes = await fetch("http://localhost:5000/api/items/flat", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        const itemsData = await itemsRes.json();
        setCatalogItems(itemsData.items || []);
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          fetch: error.message,
        }));
      }
    };

    fetchData();
  }, []);

  // Get flattened list of all variants from grouped items
  // NO LONGER NEEDED - catalogItems is already flat from /flat endpoint

  // Get item details by ID (now simple since items are already flat)
  const getItemById = (itemId) => {
    return catalogItems.find((item) => item._id === itemId);
  };

  // Calculate total amount with proper rounding for float precision
  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => {
      return (
        sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
      );
    }, 0);
    return Math.round(total * 100) / 100;
  };

  const handleCustomerChange = (e) => {
    const value = e.target.value;

    if (value === "CREATE_NEW") {
      setShowCreateCustomerForm(true);
      setCustomerSearch("");
      setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
      setCustomerFormErrors({});
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: value,
      }));
      setErrors((prev) => ({
        ...prev,
        customerId: "",
      }));
    }
  };

  const handleCustomerSearchChange = (e) => {
    setCustomerSearch(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow click on dropdown items to register
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  const handleNewCustomerFormChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (customerFormErrors[name]) {
      setCustomerFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCancelCreateCustomer = () => {
    setShowCreateCustomerForm(false);
    setShowDropdown(false);
    setCustomerSearch("");
    setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
    setCustomerFormErrors({});
  };

  const handleSaveNewCustomer = async () => {
    // Validation
    const newErrors = {};
    if (!newCustomerForm.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!newCustomerForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerForm.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (Object.keys(newErrors).length > 0) {
      setCustomerFormErrors(newErrors);
      return;
    }

    try {
      setCustomerFormLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustomerForm.name.trim(),
          email: newCustomerForm.email.trim(),
          phone: newCustomerForm.phone.trim() || undefined,
          address: newCustomerForm.address.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create customer");
      }

      const data = await response.json();
      const newCustomer = data.customer;

      // Add to customers list and auto-select
      setCustomers((prev) => [newCustomer, ...prev]);
      setFormData((prev) => ({
        ...prev,
        customerId: newCustomer._id,
      }));

      // Reset and close form and dropdown
      setShowCreateCustomerForm(false);
      setShowDropdown(false);
      setCustomerSearch("");
      setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
      setCustomerFormErrors({});

      toast.success("Customer added successfully!");
    } catch (error) {
      setCustomerFormErrors({
        submit: error.message,
      });
      toast.error(error.message);
    } finally {
      setCustomerFormLoading(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  // Get available stock for an item/variant combination
  const getAvailableStock = (itemId, variantLabel) => {
    const item = getItemById(itemId);
    if (!item) return 0;

    if (variantLabel) {
      const variant = item.variants?.find((v) => v.label === variantLabel);
      return variant?.stock || 0;
    }
    return item.stock || 0;
  };

  // Get stock status badge color and text
  const getStockStatus = (availableStock) => {
    if (availableStock === 0) {
      return { color: "text-red-400", icon: "🔴", text: "Out of stock" };
    } else if (availableStock <= 10) {
      return {
        color: "text-amber-400",
        icon: "🟡",
        text: `${availableStock} in stock`,
      };
    }
    return {
      color: "text-gray-400",
      icon: "●",
      text: `${availableStock} in stock`,
    };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];

    if (field === "itemId") {
      // When item is selected, auto-fill price (rounded to prevent float corruption)
      const selectedItem = getItemById(value);
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: value,
        price: selectedItem ? Math.round(selectedItem.price * 100) / 100 : 0,
        priceOverride: false,
      };
    } else if (field === "quantity") {
      updatedItems[index].quantity = parseInt(value) || 0;
    } else if (field === "price") {
      updatedItems[index].price =
        Math.round(parseFloat(value) * 100) / 100 || 0;
      updatedItems[index].priceOverride = true;
    } else if (field === "priceOverride") {
      updatedItems[index].priceOverride = !updatedItems[index].priceOverride;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setErrors((prev) => ({
      ...prev,
      items: "",
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { itemId: "", quantity: 1, price: 0, priceOverride: false },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleNotesChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      notes: e.target.value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = "Please select a customer";
    }

    const validItems = formData.items.filter(
      (item) => item.itemId && item.quantity > 0 && item.price > 0,
    );

    if (validItems.length === 0) {
      newErrors.items = "Please add at least one valid item";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Filter items and map to order format
      const validItems = formData.items
        .filter((item) => item.itemId && item.quantity > 0 && item.price > 0)
        .map((item) => {
          const catalogItem = getItemById(item.itemId);
          return {
            itemId: item.itemId,
            name: catalogItem?.name || "",
            variantLabel: catalogItem?.variantLabel || "",
            quantity: item.quantity,
            price: item.price,
          };
        });

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          items: validItems,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create order");
      }

      const data = await response.json();

      // Clear form and redirect
      setFormData({
        customerId: "",
        items: [{ itemId: "", quantity: 1, price: 0, priceOverride: false }],
        notes: "",
      });
      setErrors({});

      // Handle stock warnings
      if (data.warnings && data.warnings.length > 0) {
        toast.custom((t) => (
          <div className="bg-amber-900 border border-amber-700 rounded-lg p-4 text-amber-100 max-w-md">
            <p className="font-semibold mb-2">
              Order created with stock warnings:
            </p>
            <ul className="text-sm space-y-1">
              {data.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        ));
      } else {
        toast.success("Order created successfully!");
      }

      // Call onSuccess callback if in modal, otherwise navigate
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard/orders");
      }
    } catch (error) {
      const errorMsg = error.message;
      setErrors((prev) => ({
        ...prev,
        submit: errorMsg,
      }));
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  // If in modal mode, return just the form content
  if (isModal) {
    return (
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-900 text-red-200 p-3 sm:p-4 rounded-lg mb-6 border border-red-700 text-xs sm:text-sm">
            {errors.submit}
              </div>
            )}

            {/* Customer Selection */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <label className="block text-gray-300 font-semibold mb-2 text-xs sm:text-sm">
                Select Customer *
              </label>

              {/* Searchable Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className={`w-full bg-[#111] border rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] transition text-xs sm:text-sm ${
                    errors.customerId ? "border-red-600" : "border-[#222]"
                  }`}
                />

                {/* Dropdown List */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#222] rounded-lg z-10 shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData((prev) => ({
                            ...prev,
                            customerId: customer._id,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            customerId: "",
                          }));
                          setCustomerSearch("");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 sm:px-4 py-2 hover:bg-[#1a1a1a] border-b border-[#222] text-white text-xs sm:text-sm transition"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-gray-500 text-xs">
                          {customer.email}
                        </div>
                      </button>
                    ))}

                    {/* Create New Customer Option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowCreateCustomerForm(true);
                        setShowDropdown(false);
                        setCustomerSearch("");
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 hover:bg-[#1a1a1a] text-[#378ADD] font-semibold text-xs sm:text-sm transition"
                    >
                      + Create new customer
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {formData.customerId && (
                <div className="mt-2 px-3 py-2 bg-[#111] border border-[#222] rounded text-gray-300 text-xs sm:text-sm">
                  ✓ {customers.find((c) => c._id === formData.customerId)?.name}
                </div>
              )}

              {errors.customerId && (
                <p className="text-red-400 text-xs sm:text-sm mt-2">
                  {errors.customerId}
                </p>
              )}
              {errors.customers && (
                <p className="text-red-400 text-xs sm:text-sm mt-2">
                  {errors.customers}
                </p>
              )}

              {/* Inline Create Customer Form */}
              {showCreateCustomerForm && (
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 mt-2">
                  <h3 className="text-gray-300 font-semibold mb-4 text-xs sm:text-sm">
                    New Customer Details
                  </h3>

                  {customerFormErrors.submit && (
                    <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded p-2 mb-4 text-red-400 text-xs">
                      {customerFormErrors.submit}
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCustomerForm.name}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter customer name"
                      className={`w-full bg-[#111] border rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition ${
                        customerFormErrors.name
                          ? "border-red-600"
                          : "border-[#222]"
                      }`}
                    />
                    {customerFormErrors.name && (
                      <p className="text-red-400 text-xs mt-1">
                        {customerFormErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newCustomerForm.email}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter email address"
                      className={`w-full bg-[#111] border rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition ${
                        customerFormErrors.email
                          ? "border-red-600"
                          : "border-[#222]"
                      }`}
                    />
                    {customerFormErrors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {customerFormErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newCustomerForm.phone}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter phone number"
                      className="w-full bg-[#111] border border-[#222] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition"
                    />
                  </div>

                  {/* Address Field */}
                  <div className="mb-4">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={newCustomerForm.address}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter address (optional)"
                      rows="2"
                      className="w-full bg-[#111] border border-[#222] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition resize-none"
                    />
                  </div>

                  {/* Form Buttons */}
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleSaveNewCustomer}
                      disabled={customerFormLoading}
                      className="flex-1 bg-[#378ADD] text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
                    >
                      {customerFormLoading ? "Saving..." : "Save Customer"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCreateCustomer}
                      disabled={customerFormLoading}
                      className="flex-1 bg-[#222] text-gray-300 px-3 py-2 rounded hover:bg-[#333] disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <label className="block text-gray-300 font-semibold text-xs sm:text-sm">
                  Order Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-[#378ADD] text-white px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-blue-600 transition whitespace-nowrap"
                >
                  + Add Item
                </button>
              </div>

              {errors.items && (
                <p className="text-red-400 text-xs sm:text-sm mb-4">
                  {errors.items}
                </p>
              )}

              {/* No items in catalog warning */}
              {catalogItems.length === 0 && (
                <div className="bg-amber-900 bg-opacity-20 border border-[#e8a020] rounded-lg p-3 sm:p-4 mb-4 flex items-start gap-3">
                  <span className="text-[#e8a020] text-lg">⚠️</span>
                  <div>
                    <p className="text-[#e8a020] text-xs sm:text-sm font-semibold">
                      No items in catalog
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Add items first to create orders.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/items")}
                      className="text-[#378ADD] hover:text-blue-500 text-xs sm:text-sm mt-2 font-semibold underline"
                    >
                      Go to Items page →
                    </button>
                  </div>
                </div>
              )}

              {/* Line Items Table/Cards */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Item
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Stock
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Qty
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Price
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Amount
                      </th>
                      <th className="text-center text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => {
                      const selectedItem = getItemById(item.itemId);
                      const itemAmount =
                        (item.price || 0) * (item.quantity || 0);

                      return (
                        <tr
                          key={index}
                          className="border-b border-[#222] hover:bg-[#1a1a1a]"
                        >
                          {/* Item Dropdown - now includes variant in option */}
                          <td className="px-2 sm:px-3 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "itemId",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-[#111] border border-[#222] rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm"
                            >
                              <option value="">-- Select item --</option>
                              {catalogItems.map((item) => (
                                <option
                                  key={item._id}
                                  value={item._id}
                                  disabled={item.stock === 0}
                                >
                                  {item.name}
                                  {item.variantLabel
                                    ? ` — ${item.variantLabel}`
                                    : ""}{" "}
                                  ({item.stock} in stock)
                                  {item.stock === 0 ? " — Out of stock" : ""}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Stock Status Display */}
                          <td className="px-2 sm:px-3 py-2">
                            {selectedItem && (
                              <div
                                className={`text-xs ${getStockStatus(selectedItem.stock).color}`}
                              >
                                {getStockStatus(selectedItem.stock).text}
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="px-2 sm:px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              min="1"
                              className="w-16 sm:w-20 bg-[#111] border border-[#222] rounded px-2 py-1 text-white focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm"
                            />
                          </td>

                          {/* Price */}
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={!item.priceOverride}
                                  className={`w-full sm:w-24 bg-[#111] border border-[#222] rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm ${
                                    !item.priceOverride
                                      ? "opacity-60 cursor-not-allowed"
                                      : ""
                                  }`}
                                />
                              </div>
                              {item.itemId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleItemChange(index, "priceOverride", "")
                                  }
                                  className={`px-2 py-1 text-xs rounded transition ${
                                    item.priceOverride
                                      ? "bg-[#378ADD] text-white"
                                      : "bg-[#222] text-gray-400 hover:bg-[#333]"
                                  }`}
                                  title={
                                    item.priceOverride
                                      ? "Click to reset price"
                                      : "Click to edit price"
                                  }
                                >
                                  {item.priceOverride ? "✎" : "🔒"}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-2 sm:px-3 py-2 text-right text-gray-300 text-xs sm:text-sm">
                            Rs.{itemAmount.toFixed(2)}
                          </td>

                          {/* Delete Button */}
                          <td className="px-2 sm:px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                              className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition text-xs sm:text-sm"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="mt-4 sm:mt-6 flex justify-end">
                <div className="bg-[#111] border border-[#222] rounded-lg p-3 sm:p-4 w-full md:w-64">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 font-semibold text-xs sm:text-sm">
                      Total Amount:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#378ADD]">
                      Rs.{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <label className="block text-gray-300 font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">
                Order Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes or special instructions..."
                rows="4"
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] resize-none text-xs sm:text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#378ADD] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
              >
                {loading ? "Creating Order..." : "Create Order"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isModal) {
                    // Do nothing in modal mode - let parent modal close
                  } else {
                    navigate("/dashboard/orders");
                  }
                }}
                className="bg-[#222] text-gray-300 px-4 sm:px-6 py-2 rounded-lg hover:bg-[#333] transition font-semibold text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        );
      }

  // Full page return for non-modal mode
  return (
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] overflow-auto flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl">
            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-900 text-red-200 p-3 sm:p-4 rounded-lg mb-6 border border-red-700 text-xs sm:text-sm">
                {errors.submit}
              </div>
            )}

            {/* Customer Selection */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <label className="block text-gray-300 font-semibold mb-2 text-xs sm:text-sm">
                Select Customer *
              </label>

              {/* Searchable Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className={`w-full bg-[#111] border rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] transition text-xs sm:text-sm ${
                    errors.customerId ? "border-red-600" : "border-[#222]"
                  }`}
                />

                {/* Dropdown List */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#222] rounded-lg z-10 shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData((prev) => ({
                            ...prev,
                            customerId: customer._id,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            customerId: "",
                          }));
                          setCustomerSearch("");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 sm:px-4 py-2 hover:bg-[#1a1a1a] border-b border-[#222] text-white text-xs sm:text-sm transition"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-gray-500 text-xs">
                          {customer.email}
                        </div>
                      </button>
                    ))}

                    {/* Create New Customer Option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowCreateCustomerForm(true);
                        setShowDropdown(false);
                        setCustomerSearch("");
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 hover:bg-[#1a1a1a] text-[#378ADD] font-semibold text-xs sm:text-sm transition"
                    >
                      + Create new customer
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {formData.customerId && (
                <div className="mt-2 px-3 py-2 bg-[#111] border border-[#222] rounded text-gray-300 text-xs sm:text-sm">
                  ✓ {customers.find((c) => c._id === formData.customerId)?.name}
                </div>
              )}

              {errors.customerId && (
                <p className="text-red-400 text-xs sm:text-sm mt-2">
                  {errors.customerId}
                </p>
              )}
              {errors.customers && (
                <p className="text-red-400 text-xs sm:text-sm mt-2">
                  {errors.customers}
                </p>
              )}

              {/* Inline Create Customer Form */}
              {showCreateCustomerForm && (
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 mt-2">
                  <h3 className="text-gray-300 font-semibold mb-4 text-xs sm:text-sm">
                    New Customer Details
                  </h3>

                  {customerFormErrors.submit && (
                    <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded p-2 mb-4 text-red-400 text-xs">
                      {customerFormErrors.submit}
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCustomerForm.name}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter customer name"
                      className={`w-full bg-[#111] border rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition ${
                        customerFormErrors.name
                          ? "border-red-600"
                          : "border-[#222]"
                      }`}
                    />
                    {customerFormErrors.name && (
                      <p className="text-red-400 text-xs mt-1">
                        {customerFormErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newCustomerForm.email}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter email address"
                      className={`w-full bg-[#111] border rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition ${
                        customerFormErrors.email
                          ? "border-red-600"
                          : "border-[#222]"
                      }`}
                    />
                    {customerFormErrors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {customerFormErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newCustomerForm.phone}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter phone number"
                      className="w-full bg-[#111] border border-[#222] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition"
                    />
                  </div>

                  {/* Address Field */}
                  <div className="mb-4">
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={newCustomerForm.address}
                      onChange={handleNewCustomerFormChange}
                      placeholder="Enter address (optional)"
                      rows="2"
                      className="w-full bg-[#111] border border-[#222] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm transition resize-none"
                    />
                  </div>

                  {/* Form Buttons */}
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleSaveNewCustomer}
                      disabled={customerFormLoading}
                      className="flex-1 bg-[#378ADD] text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
                    >
                      {customerFormLoading ? "Saving..." : "Save Customer"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCreateCustomer}
                      disabled={customerFormLoading}
                      className="flex-1 bg-[#222] text-gray-300 px-3 py-2 rounded hover:bg-[#333] disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <label className="block text-gray-300 font-semibold text-xs sm:text-sm">
                  Order Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-[#378ADD] text-white px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-blue-600 transition whitespace-nowrap"
                >
                  + Add Item
                </button>
              </div>

              {errors.items && (
                <p className="text-red-400 text-xs sm:text-sm mb-4">
                  {errors.items}
                </p>
              )}

              {/* No items in catalog warning */}
              {catalogItems.length === 0 && (
                <div className="bg-amber-900 bg-opacity-20 border border-[#e8a020] rounded-lg p-3 sm:p-4 mb-4 flex items-start gap-3">
                  <span className="text-[#e8a020] text-lg">⚠️</span>
                  <div>
                    <p className="text-[#e8a020] text-xs sm:text-sm font-semibold">
                      No items in catalog
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Add items first to create orders.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/items")}
                      className="text-[#378ADD] hover:text-blue-500 text-xs sm:text-sm mt-2 font-semibold underline"
                    >
                      Go to Items page →
                    </button>
                  </div>
                </div>
              )}

              {/* Line Items Table/Cards */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Item
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Stock
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Qty
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Price
                      </th>
                      <th className="text-left text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Amount
                      </th>
                      <th className="text-center text-gray-400 font-semibold px-2 sm:px-3 py-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => {
                      const selectedItem = getItemById(item.itemId);
                      const itemAmount =
                        (item.price || 0) * (item.quantity || 0);

                      return (
                        <tr
                          key={index}
                          className="border-b border-[#222] hover:bg-[#1a1a1a]"
                        >
                          {/* Item Dropdown - now includes variant in option */}
                          <td className="px-2 sm:px-3 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "itemId",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-[#111] border border-[#222] rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm"
                            >
                              <option value="">-- Select item --</option>
                              {catalogItems.map((item) => (
                                <option
                                  key={item._id}
                                  value={item._id}
                                  disabled={item.stock === 0}
                                >
                                  {item.name}
                                  {item.variantLabel
                                    ? ` — ${item.variantLabel}`
                                    : ""}{" "}
                                  ({item.stock} in stock)
                                  {item.stock === 0 ? " — Out of stock" : ""}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Stock Status Display */}
                          <td className="px-2 sm:px-3 py-2">
                            {selectedItem && (
                              <div
                                className={`text-xs ${getStockStatus(selectedItem.stock).color}`}
                              >
                                {getStockStatus(selectedItem.stock).text}
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="px-2 sm:px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              min="1"
                              className="w-16 sm:w-20 bg-[#111] border border-[#222] rounded px-2 py-1 text-white focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm"
                            />
                          </td>

                          {/* Price */}
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={!item.priceOverride}
                                  className={`w-full sm:w-24 bg-[#111] border border-[#222] rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] text-xs sm:text-sm ${
                                    !item.priceOverride
                                      ? "opacity-60 cursor-not-allowed"
                                      : ""
                                  }`}
                                />
                              </div>
                              {item.itemId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleItemChange(index, "priceOverride", "")
                                  }
                                  className={`px-2 py-1 text-xs rounded transition ${
                                    item.priceOverride
                                      ? "bg-[#378ADD] text-white"
                                      : "bg-[#222] text-gray-400 hover:bg-[#333]"
                                  }`}
                                  title={
                                    item.priceOverride
                                      ? "Click to reset price"
                                      : "Click to edit price"
                                  }
                                >
                                  {item.priceOverride ? "✎" : "🔒"}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-2 sm:px-3 py-2 text-right text-gray-300 text-xs sm:text-sm">
                            Rs.{itemAmount.toFixed(2)}
                          </td>

                          {/* Delete Button */}
                          <td className="px-2 sm:px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                              className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition text-xs sm:text-sm"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="mt-4 sm:mt-6 flex justify-end">
                <div className="bg-[#111] border border-[#222] rounded-lg p-3 sm:p-4 w-full md:w-64">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 font-semibold text-xs sm:text-sm">
                      Total Amount:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#378ADD]">
                      Rs.{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-[#161616] rounded-lg p-4 sm:p-6 border border-[#222] mb-6">
              <label className="block text-gray-300 font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">
                Order Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes or special instructions..."
                rows="4"
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] resize-none text-xs sm:text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#378ADD] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-semibold text-xs sm:text-sm"
              >
                {loading ? "Creating Order..." : "Create Order"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/orders")}
                className="bg-[#222] text-gray-300 px-4 sm:px-6 py-2 rounded-lg hover:bg-[#333] transition font-semibold text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
