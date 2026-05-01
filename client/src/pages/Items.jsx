import React, { useState, useEffect, useContext, useRef } from "react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

// Helper function to generate cartesian product of variant combinations
const generateCombinations = (variantTypes) => {
  if (!variantTypes || variantTypes.length === 0) return [];

  const optionArrays = variantTypes.map((vt) => vt.options || []);
  
  // Remove types with no options
  const validTypes = variantTypes.filter((vt) => vt.options && vt.options.length > 0);
  const validArrays = validTypes.map((vt) => vt.options);
  
  if (validArrays.length === 0) return [];

  const cartesian = (arrays) => {
    return arrays.reduce(
      (acc, arr) => acc.flatMap((a) => arr.map((b) => [...a, b])),
      [[]]
    );
  };

  const combinations = cartesian(validArrays);
  return combinations.map((combo) => {
    const combination = {};
    validTypes.forEach((vt, idx) => {
      combination[vt.label] = combo[idx];
    });
    return { combination, price: 0, stock: 0 };
  });
};

export const Items = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    basePrice: "",
    unit: "",
    stock: 0,
    variantTypes: [],
    variants: [],
    imageUrl: "",
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [currentOptionInput, setCurrentOptionInput] = useState("");
  const [currentOptionTypeIndex, setCurrentOptionTypeIndex] = useState(-1);

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
      setEditingId(item.name);
      // Load existing variant structure
      setFormData({
        name: item.name,
        category: item.category || "",
        description: item.description || "",
        basePrice: item.basePrice || item.price || "",
        unit: item.unit || "",
        stock: item.stock || 0,
        variantTypes: item.variantTypes || [],
        variants: item.variants || [],
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
        basePrice: "",
        unit: "",
        stock: 0,
        variantTypes: [],
        variants: [],
        imageUrl: "",
        isActive: true,
      });
      setImagePreview(null);
    }
    setErrors({});
    setCurrentOptionInput("");
    setCurrentOptionTypeIndex(-1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "",
      description: "",
      basePrice: "",
      unit: "",
      stock: 0,
      variantTypes: [],
      variants: [],
      imageUrl: "",
      isActive: true,
    });
    setImagePreview(null);
    setErrors({});
    setCurrentOptionInput("");
    setCurrentOptionTypeIndex(-1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = "Base Price must be greater than 0";
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

  // Variant Types Handlers
  const handleAddVariantType = () => {
    setFormData((prev) => ({
      ...prev,
      variantTypes: [...prev.variantTypes, { label: "", options: [] }],
      // Don't auto-generate combinations until user adds options
    }));
  };

  const handleRemoveVariantType = (index) => {
    setFormData((prev) => {
      const newVariantTypes = prev.variantTypes.filter((_, i) => i !== index);
      const newVariants = generateCombinations(newVariantTypes);
      return {
        ...prev,
        variantTypes: newVariantTypes,
        variants: newVariants,
      };
    });
  };

  const handleVariantTypeChange = (index, field, value) => {
    setFormData((prev) => {
      const newVariantTypes = [...prev.variantTypes];
      newVariantTypes[index] = {
        ...newVariantTypes[index],
        [field]: value,
      };

      // If label changed or options modified, regenerate combinations
      const newVariants = generateCombinations(newVariantTypes);
      return {
        ...prev,
        variantTypes: newVariantTypes,
        variants: newVariants,
      };
    });
  };

  const addVariantOption = (typeIndex, option) => {
    if (!option.trim()) return;

    setFormData((prev) => {
      const newVariantTypes = [...prev.variantTypes];
      if (!newVariantTypes[typeIndex].options.includes(option)) {
        newVariantTypes[typeIndex].options.push(option);
      }

      // Regenerate combinations with new option
      const newVariants = generateCombinations(newVariantTypes);
      return {
        ...prev,
        variantTypes: newVariantTypes,
        variants: newVariants,
      };
    });

    setCurrentOptionInput("");
  };

  const removeVariantOption = (typeIndex, optionIndex) => {
    setFormData((prev) => {
      const newVariantTypes = [...prev.variantTypes];
      newVariantTypes[typeIndex].options.splice(optionIndex, 1);

      // Regenerate combinations without this option
      const newVariants = generateCombinations(newVariantTypes);
      return {
        ...prev,
        variantTypes: newVariantTypes,
        variants: newVariants,
      };
    });
  };

  // Variant Combination Handlers
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === "stock" || field === "price" ? Number(value) : value,
    };
    setFormData((prev) => ({
      ...prev,
      variants: updatedVariants,
    }));
  };

  const removeVariantCombination = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
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

      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        basePrice: Math.round(parseFloat(formData.basePrice) * 100) / 100,
        unit: formData.unit,
        stock: Number(formData.stock) || 0,
        variantTypes: formData.variantTypes,
        variants: formData.variants,
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
        editingId ? "Item updated successfully" : "Item created successfully"
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
      return { label: "In Stock", color: "#1b5e20", bg: "#e8f5e9" };
    if (stock > 0)
      return { label: "Low Stock", color: "#e65100", bg: "#fff3e0" };
    return { label: "Out of Stock", color: "#c62828", bg: "#ffebee" };
  };

  const getCombinationLabel = (combination) => {
    return Object.values(combination).join(" / ");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8f9fa]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-[#378ADD] mb-4">⏳</div>
            <p className="text-[#999999]">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <Navbar />

      <div className="main-content">
        {error && (
          <div className="mb-6 p-4 bg-[#ffebee] border border-[#ef5350] rounded-lg text-[#c62828]">
            {error}
          </div>
        )}

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-[#999999] mb-4">No items yet</p>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-[#378ADD] text-white rounded-lg hover:bg-blue-600 transition"
            >
              Create your first item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => {
              const hasVariants = item.variantTypes && item.variantTypes.length > 0;
              const displayPrice = item.basePrice || item.price || 0;
              let displayStock = item.stock || 0;

              // Calculate total stock from variants if they exist
              if (hasVariants && item.variants && item.variants.length > 0) {
                displayStock = item.variants.reduce(
                  (sum, v) => sum + (v.stock || 0),
                  0
                );
              }

              const stockStatus = getStockStatus(displayStock);

              return (
                <div
                  key={item.name}
                  className="relative bg-[#ffffff] border border-[#e0e0e0] rounded-lg overflow-hidden hover:border-[#378ADD] transition group flex flex-col h-64"
                >
                  {/* Image - 90% of card */}
                  <div className="flex-grow w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#eeeeee] flex items-center justify-center">
                        <span className="text-[#999999] text-3xl">📷</span>
                      </div>
                    )}

                    {/* 3-dot Menu Button - Top Right */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === item.name ? null : item.name)
                        }
                        className="bg-[#f5f5f5] hover:bg-[#eeeeee] p-1.5 rounded-full transition border border-[#e0e0e0]"
                      >
                        <span className="text-[#999999] text-lg">⋮</span>
                      </button>

                      {/* Dropdown Menu */}
                      {openMenu === item.name && (
                        <div className="absolute top-full right-0 mt-2 bg-[#ffffff] border border-[#e0e0e0] rounded-lg overflow-hidden z-10 min-w-max shadow-lg">
                          <button
                            onClick={() => {
                              openModal(item);
                              setOpenMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-[#378ADD] hover:bg-[#f5f5f5] transition text-sm font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteClick(item.name);
                              setOpenMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-[#c62828] hover:bg-[#f5f5f5] transition text-sm font-medium border-t border-[#e0e0e0]"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details - 10% of card */}
                  <div className="p-2 border-t border-[#e0e0e0] bg-[#fafafa]">
                    {/* Name and Price */}
                    <h3 className="text-xs font-bold text-[#1a1a1a] truncate mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[#378ADD]">
                        ₹{displayPrice}
                      </p>
                      <div
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          color: stockStatus.color,
                          backgroundColor: stockStatus.bg,
                        }}
                      >
                        {displayStock}
                      </div>
                    </div>

                    {/* Compact Variants Display */}
                    {hasVariants && item.variantTypes.length > 0 && (
                      <div className="text-xs text-[#999999] truncate">
                        {item.variantTypes.map((vt) => vt.label).join(", ")}:{" "}
                        {item.variants && item.variants.length > 0
                          ? item.variants.length
                          : 0}{" "}
                        vars
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-20">
            <div className="bg-[#ffffff] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e0e0e0]">
              <div className="sticky top-0 bg-[#f5f5f5] border-b border-[#e0e0e0] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1a1a1a]">
                  {editingId ? "Edit Item" : "Add Item"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#999999] hover:text-[#1a1a1a] text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. T-Shirt"
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD]"
                  />
                  {errors.name && (
                    <p className="text-sm text-[#c62828] mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    list="categoryList"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    placeholder="Choose or type..."
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD]"
                  />
                  <datalist id="categoryList">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Item details..."
                    rows="3"
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] resize-none"
                  ></textarea>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Base Price *
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD]"
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-[#c62828] mt-1">
                      {errors.basePrice}
                    </p>
                  )}
                  <p className="text-xs text-[#999999] mt-1">
                    Default price for non-variant items or variant combinations
                  </p>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    placeholder="e.g. per piece / per kg / per box"
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD]"
                  />
                </div>

                {/* Stock - Only show if no variants */}
                {formData.variantTypes.length === 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD]"
                    />
                  </div>
                )}

                {/* Variant Types Section */}
                <div className="border-t border-[#e0e0e0] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-[#1a1a1a]">
                      Variant Types
                    </label>
                    <button
                      type="button"
                      onClick={handleAddVariantType}
                      className="px-3 py-1 text-xs border border-[#378ADD] text-[#378ADD] rounded hover:bg-[#378ADD] hover:bg-opacity-10 transition"
                    >
                      + Add Variant Type
                    </button>
                  </div>

                  {formData.variantTypes.length === 0 ? (
                    <p className="text-xs text-[#999999] mb-4">
                      No variant types yet. Add one to enable variant combinations.
                    </p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {formData.variantTypes.map((variantType, typeIndex) => (
                        <div
                          key={typeIndex}
                          className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa]"
                        >
                          {/* Variant Type Name */}
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="e.g. Size, Color, Quantity"
                              value={variantType.label}
                              onChange={(e) =>
                                handleVariantTypeChange(
                                  typeIndex,
                                  "label",
                                  e.target.value
                                )
                              }
                              className="flex-1 px-3 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] placeholder-[#cccccc] focus:outline-none focus:border-[#378ADD] text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantType(typeIndex)}
                              className="px-3 py-2 bg-[#c62828] text-white rounded hover:bg-red-600 transition text-sm"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Options Tags */}
                          <div className="mb-2">
                            <p className="text-xs text-[#666666] mb-1">
                              Options (press Enter to add)
                            </p>
                            <div className="bg-[#ffffff] border border-[#e0e0e0] rounded p-2 min-h-9 flex flex-wrap gap-1 items-center">
                              {variantType.options.map((option, optionIndex) => (
                                <span
                                  key={optionIndex}
                                  className="bg-[#378ADD] text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  {option}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantOption(typeIndex, optionIndex)
                                    }
                                    className="hover:bg-blue-700 rounded px-0.5"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {currentOptionTypeIndex === typeIndex && (
                                <input
                                  type="text"
                                  autoFocus
                                  value={currentOptionInput}
                                  onChange={(e) =>
                                    setCurrentOptionInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addVariantOption(
                                        typeIndex,
                                        currentOptionInput
                                      );
                                      setCurrentOptionTypeIndex(-1);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (
                                      currentOptionInput.trim() &&
                                      currentOptionTypeIndex === typeIndex
                                    ) {
                                      addVariantOption(
                                        typeIndex,
                                        currentOptionInput
                                      );
                                    }
                                    setCurrentOptionInput("");
                                    setCurrentOptionTypeIndex(-1);
                                  }}
                                  className="border-none outline-none text-sm text-[#1a1a1a] bg-transparent"
                                  placeholder="Type option..."
                                  style={{ minWidth: "80px" }}
                                />
                              )}
                              {currentOptionTypeIndex !== typeIndex && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentOptionTypeIndex(typeIndex);
                                    setCurrentOptionInput("");
                                  }}
                                  className="text-[#999999] hover:text-[#378ADD] text-xs px-1"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variant Combinations Table */}
                {formData.variantTypes.length > 0 && (
                  <div className="border-t border-[#e0e0e0] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#1a1a1a]">
                        Variant Combinations
                      </h3>
                      {formData.variants.length > 0 && (
                        <p className="text-xs text-[#378ADD]">
                          {formData.variants.length} combination
                          {formData.variants.length !== 1 ? "s" : ""} generated
                        </p>
                      )}
                    </div>

                    {formData.variants.length === 0 ? (
                      <div className="bg-[#f5f5f5] border border-[#e0e0e0] rounded p-4 text-center">
                        <p className="text-xs text-[#999999]">
                          Add variant type options above to generate combinations
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#e0e0e0] bg-[#f5f5f5]">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-[#1a1a1a]">
                                Combination
                              </th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-[#1a1a1a]">
                                Price
                              </th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-[#1a1a1a]">
                                Stock
                              </th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-[#1a1a1a]">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.variants.map((variant, index) => (
                              <tr
                                key={index}
                                className="border-b border-[#e0e0e0] hover:bg-[#f9f9f9]"
                              >
                                <td className="px-3 py-2 text-[#1a1a1a] font-medium">
                                  {getCombinationLabel(variant.combination)}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) =>
                                      handleVariantChange(
                                        index,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    placeholder={formData.basePrice}
                                    step="0.01"
                                    min="0"
                                    className="w-24 px-2 py-1 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] text-xs focus:outline-none focus:border-[#378ADD]"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) =>
                                      handleVariantChange(
                                        index,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                    min="0"
                                    className="w-20 px-2 py-1 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] text-xs focus:outline-none focus:border-[#378ADD]"
                                  />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantCombination(index)
                                    }
                                    className="px-2 py-1 bg-[#c62828] text-white rounded hover:bg-red-600 transition text-xs"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                    Image
                  </label>
                  <p className="text-xs text-[#999999] mb-3">
                    Max size: 5MB. Image will be auto-compressed to 800x800px.
                  </p>
                  {imagePreview && (
                    <div className="mb-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-32 object-contain rounded border border-[#e0e0e0]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                        }}
                        className="absolute top-2 right-2 bg-[#c62828] text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 bg-[#ffffff] border border-[#e0e0e0] rounded text-[#1a1a1a] focus:outline-none focus:border-[#378ADD]"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded border-[#e0e0e0] text-[#378ADD] focus:ring-0"
                  />
                  <label className="text-sm text-[#1a1a1a]">
                    Active (Show in list)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#e0e0e0]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-[#f5f5f5] text-[#1a1a1a] rounded hover:bg-[#e8e8e8] transition"
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
            <div className="bg-[#ffffff] border border-[#e0e0e0] rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">
                Delete Item?
              </h3>
              <p className="text-[#666666] mb-6">
                This action cannot be undone. The item will be hidden from your
                list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2 bg-[#f5f5f5] text-[#1a1a1a] rounded hover:bg-[#e8e8e8] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(deletingId)}
                  className="flex-1 px-4 py-2 bg-[#c62828] text-white rounded hover:bg-red-600 transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Item Button */}
      <button
        onClick={() => openModal()}
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
        <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span> Add Item
      </button>
    </div>
  );
};
