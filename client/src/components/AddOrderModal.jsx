import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

export const AddOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    customerId: "",
    items: [{ itemId: "", quantity: 1, price: 0 }],
    notes: "",
  });

  // Fetch customers and items on mount
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch customers
      const customersRes = await fetch("http://localhost:5000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!customersRes.ok) throw new Error("Failed to fetch customers");
      const customersData = await customersRes.json();
      setCustomers(customersData.customers || []);

      // Fetch items
      const itemsRes = await fetch("http://localhost:5000/api/items/flat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!itemsRes.ok) throw new Error("Failed to fetch items");
      const itemsData = await itemsRes.json();
      setCatalogItems(itemsData.items || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemId: "", quantity: 1, price: 0 }],
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

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return (
        sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
      );
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = "Please select a customer";
    }

    const validItems = formData.items.filter((item) => {
      return item.itemId && item.quantity > 0 && item.price > 0;
    });

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

      const validItems = formData.items
        .filter((item) => item.itemId && item.quantity > 0 && item.price > 0)
        .map((item) => {
          const catalogItem = catalogItems.find((ci) => ci._id === item.itemId);
          return {
            itemId: item.itemId,
            name: catalogItem?.name || "",
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

      // Reset form
      setFormData({
        customerId: "",
        items: [{ itemId: "", quantity: 1, price: 0 }],
        notes: "",
      });
      setErrors({});

      toast.success("Order created successfully!");
      onClose();
      onSuccess?.();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message,
      }));
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#ffffff] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e0e0e0] mt-20">
        <div className="sticky top-0 bg-[#f5f5f5] border-b border-[#e0e0e0] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Create Order</h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#1a1a1a] text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-[#ffebee] border border-[#ef5350] rounded p-3 text-[#d32f2f] text-sm">
              {errors.submit}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
              Customer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  customerId: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, customerId: "" }));
              }}
              className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] focus:outline-none focus:border-[#378ADD]"
            >
              <option value="">-- Select a customer --</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-sm text-[#c62828] mt-1">{errors.customerId}</p>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-[#1a1a1a]">
                Order Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="bg-[#378ADD] text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-600"
              >
                + Add Item
              </button>
            </div>

            {errors.items && (
              <p className="text-sm text-[#c62828] mb-3">{errors.items}</p>
            )}

            {catalogItems.length === 0 ? (
              <div className="bg-[#fff3e0] border border-[#ffb74d] rounded p-3 text-[#e65100] text-sm">
                ⚠️ No items available. Add items first.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]"
                  >
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Item Select */}
                      <div className="col-span-6">
                        <label className="block text-xs text-[#666] font-semibold mb-1">
                          Item
                        </label>
                        <select
                          value={item.itemId}
                          onChange={(e) =>
                            handleItemChange(index, "itemId", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] text-sm focus:outline-none focus:border-[#378ADD]"
                        >
                          <option value="">-- Select --</option>
                          {catalogItems.map((catalogItem) => (
                            <option
                              key={catalogItem._id}
                              value={catalogItem._id}
                            >
                              {catalogItem.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <label className="block text-xs text-[#666] font-semibold mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          min="1"
                          className="w-full px-3 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] text-sm focus:outline-none focus:border-[#378ADD]"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <label className="block text-xs text-[#666] font-semibold mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] text-sm focus:outline-none focus:border-[#378ADD]"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="text-[#c62828] hover:text-[#b71c1c] disabled:text-[#ccc] text-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Special instructions..."
              rows="3"
              className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] resize-none"
            />
          </div>

          {/* Total */}
          <div className="bg-[#f5f5f5] border border-[#e0e0e0] rounded p-4 flex justify-between items-center">
            <span className="text-[#666] font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-[#378ADD]">
              Rs.{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#e0e0e0] text-[#1a1a1a] rounded font-semibold hover:bg-[#d0d0d0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#378ADD] text-white rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
