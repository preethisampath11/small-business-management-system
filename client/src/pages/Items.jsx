import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export const Items = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    unit: "",
    stock: "",
    variants: [],
    imageUrl: "",
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const categoryOptions = [
    "Clothing",
    "Food",
    "Beverages",
    "Electronics",
    "Other",
  ];

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/items", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      // When editing grouped items, use name as the identifier
      setEditingId(item.name);
      // Transform variants from {_id, variantLabel, stock} to {_id, label, stock} for form
      const transformedVariants = (item.variants || []).map((v) => ({
        _id: v._id,
        label: v.variantLabel || "",
        stock: v.stock,
      }));
      setFormData({
        name: item.name,
        category: item.category || "",
        description: item.description || "",
        price: item.price,
        unit: item.unit || "",
        stock: "", // Not used for grouped items - variant stocks are managed individually
        variants: transformedVariants,
        imageUrl: item.imageUrl || "",
        isActive: item.isActive || true,
      });
      setImagePreview(item.imageUrl);
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category: "",
        description: "",
        price: "",
        unit: "",
        stock: "",
        variants: [],
        imageUrl: "",
        isActive: true,
      });
      setImagePreview(null);
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "",
      description: "",
      price: "",
      unit: "",
      stock: "",
      variants: [],
      imageUrl: "",
      isActive: true,
    });
    setImagePreview(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress image using canvas
          const canvas = document.createElement("canvas");
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          setImagePreview(compressedBase64);
          setFormData((prev) => ({
            ...prev,
            imageUrl: compressedBase64,
          }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", stock: 0 }],
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === "stock" ? Number(value) : value,
    };
    setFormData((prev) => ({
      ...prev,
      variants: updatedVariants,
    }));
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
        ? `http://localhost:5000/api/items/${encodeURIComponent(editingId)}`
        : "http://localhost:5000/api/items";

      // Transform variants back to variantLabel format for the API
      const transformedVariants = formData.variants.map((v) => ({
        _id: v._id, // For existing variants, include _id for update tracking
        variantLabel: v.label, // Transform label back to variantLabel
        stock: v.stock,
      }));

      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100) / 100,
        unit: formData.unit,
        stock: Number(formData.stock) || 0,
        variants: transformedVariants,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save item");
      }

      toast.success(
        editingId ? "Item updated successfully" : "Item created successfully",
      );
      closeModal();
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteClick = (itemId) => {
    setDeletingId(itemId);
  };

  const handleConfirmDelete = async (itemName) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/items/group/${encodeURIComponent(itemName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete item");
      }

      toast.success("Item deleted successfully");
      setDeletingId(null);
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStockStatus = (stock) => {
    if (stock > 10)
      return { label: "In Stock", color: "#3fcf8e", bg: "#1a3a2f" };
    if (stock > 0)
      return { label: "Low Stock", color: "#e8a020", bg: "#3a3220" };
    return { label: "Out of Stock", color: "#e05555", bg: "#3a2020" };
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#111]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-[#378ADD] mb-4">⏳</div>
            <p className="text-gray-400">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] p-4 md:p-8">
        {/* Action Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-[#378ADD] text-white rounded-lg hover:bg-blue-600 transition"
          >
            + Add Item
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-[#e05555] rounded-lg text-[#e05555]">
            {error}
          </div>
        )}

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400 mb-4">No items yet</p>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-[#378ADD] text-white rounded-lg hover:bg-blue-600 transition"
            >
              Create your first item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const totalStockStatus = getStockStatus(item.totalStock);
              const hasVariants = item.variants && item.variants.length > 0;

              return (
                <div
                  key={item.name}
                  className="bg-[#161616] border border-[#222] rounded-lg overflow-hidden hover:border-[#378ADD] transition"
                >
                  {/* Image */}
                  <div className="w-full h-48 bg-[#111] flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#222] flex items-center justify-center">
                        <span className="text-[#666] text-4xl">📷</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Name and Category */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-white flex-1">
                        {item.name}
                      </h3>
                    </div>

                    {item.category && (
                      <div className="mb-3">
                        <span className="text-xs bg-[#222] text-gray-300 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-[#378ADD]">
                        ₹{item.price}
                      </p>
                      {item.unit && (
                        <p className="text-sm text-gray-400">{item.unit}</p>
                      )}
                    </div>

                    {/* Total Stock Status */}
                    <div className="mb-3">
                      <div
                        className="text-sm font-semibold px-3 py-1 rounded inline-block"
                        style={{
                          color: totalStockStatus.color,
                          backgroundColor: totalStockStatus.bg,
                        }}
                      >
                        {totalStockStatus.label} ({item.totalStock})
                      </div>
                    </div>

                    {/* Variants Pills */}
                    {hasVariants && item.variants.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">
                          {item.variants.length} variant
                          {item.variants.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.variants.map((variant) => {
                            const variantStatus = getStockStatus(variant.stock);
                            return (
                              <span
                                key={variant._id}
                                className="text-xs font-semibold px-2 py-1 rounded"
                                style={{
                                  color: variantStatus.color,
                                  backgroundColor: variantStatus.bg,
                                }}
                                title={variant.variantLabel}
                              >
                                {variant.variantLabel || "Default"}:{" "}
                                {variant.stock}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[#222]">
                      <button
                        onClick={() => openModal(item)}
                        className="flex-1 px-3 py-2 bg-[#378ADD] text-white rounded hover:bg-blue-600 transition text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.name)}
                        className="flex-1 px-3 py-2 bg-[#e05555] text-white rounded hover:bg-red-600 transition text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#222]">
              <div className="sticky top-0 bg-[#111] border-b border-[#222] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Edit Item" : "Add Item"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. T-Shirt"
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                  />
                  {errors.name && (
                    <p className="text-sm text-[#e05555] mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    list="categoryList"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    placeholder="Choose or type..."
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                  />
                  <datalist id="categoryList">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Item details..."
                    rows="3"
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD] resize-none"
                  ></textarea>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                  />
                  {errors.price && (
                    <p className="text-sm text-[#e05555] mt-1">
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    placeholder="e.g. per piece / per kg / per box"
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                  />
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-300">
                      Variants
                    </label>
                    <p className="text-xs text-gray-500">
                      Use for sizes, colors etc. e.g. S, M, L or Red, Blue
                    </p>
                  </div>

                  <div className="space-y-2 mb-3">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Label (e.g. M, Red-L)"
                          value={variant.label}
                          onChange={(e) =>
                            handleVariantChange(index, "label", e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={variant.stock}
                          onChange={(e) =>
                            handleVariantChange(index, "stock", e.target.value)
                          }
                          min="0"
                          className="w-20 px-4 py-2 bg-[#111] border border-[#222] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#378ADD]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="px-3 py-2 bg-[#e05555] text-white rounded hover:bg-red-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-4 py-2 border border-[#378ADD] text-[#378ADD] rounded hover:bg-[#378ADD] hover:bg-opacity-10 transition"
                  >
                    + Add Variant
                  </button>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Image
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Max size: 5MB. Image will be auto-compressed to 800x800px.
                  </p>
                  {imagePreview && (
                    <div className="mb-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-32 object-contain rounded border border-[#222]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                        }}
                        className="absolute top-2 right-2 bg-[#e05555] text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 bg-[#111] border border-[#222] rounded text-gray-400 focus:outline-none focus:border-[#378ADD]"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded border-[#222] text-[#378ADD] focus:ring-0"
                  />
                  <label className="text-sm text-gray-300">
                    Active (Show in list)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#222]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-[#222] text-gray-300 rounded hover:bg-[#333] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#378ADD] text-white rounded hover:bg-blue-600 transition font-semibold"
                  >
                    {editingId ? "Update Item" : "Create Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#161616] border border-[#222] rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-3">
                Delete Item?
              </h3>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. The item will be hidden from your
                list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2 bg-[#222] text-gray-300 rounded hover:bg-[#333] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(deletingId)}
                  className="flex-1 px-4 py-2 bg-[#e05555] text-white rounded hover:bg-red-600 transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
