import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { CalendarWidget } from "../components/CalendarWidget";

// SVG Icons
const TotalRevenueIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#333"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M10 2v16M6 6h6a2 2 0 010 4H8a2 2 0 000 4h7" />
  </svg>
);

const PendingDuesIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#333"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v4l2.5 2.5" />
  </svg>
);

const TotalOrdersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#333"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    <path d="M7 9h6M7 12h4" />
  </svg>
);

const ThisMonthIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#333"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <rect x="3" y="4" width="14" height="14" rx="2" />
    <path d="M7 2v4M13 2v4M3 9h14" />
  </svg>
);

const BarChartIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="#378ADD"
    strokeWidth="1.5"
  >
    <rect x="2" y="10" width="2" height="4" rx="1" />
    <rect x="7" y="6" width="2" height="8" rx="1" />
    <rect x="12" y="3" width="2" height="11" rx="1" />
  </svg>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("yearly");

  // Fetch main dashboard stats once on mount
  useEffect(() => {
    const fetchMainStats = async () => {
      try {
        setLoading(true);
        const response = await API.get("/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setStats({
            totalRevenue: response.data.totalRevenue,
            pendingDues: response.data.pendingDues,
            totalOrders: response.data.totalOrders,
            ordersThisMonth: response.data.ordersThisMonth,
          });
          setRecentOrders(response.data.recentOrders || []);
          setLowStockItems(response.data.lowStockItems || []);
          setLowStockCount(response.data.lowStockCount || 0);
          setTopSellingItems(response.data.topSellingItems || []);
          setError("");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard",
        );
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMainStats();
  }, []);

  // Fetch chart data when period changes
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await API.get(`/dashboard/stats?period=${period}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setChartData(response.data.chartData || []);
        }
      } catch (err) {
        console.error("Chart Data Fetch Error:", err);
      }
    };

    fetchChartData();
  }, [period]);

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

  const tdStyle = {
    padding: "14px 12px",
    fontSize: "13px",
    color: "#ccc",
    whiteSpace: "nowrap",
  };

  return (
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] px-[16px] pb-[32px] min-h-screen overflow-y-auto">
        {error && (
          <div className="bg-[#2b0a0a] text-[#e05555] p-4 rounded-lg mb-6 border border-[#e05555] text-xs sm:text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            Loading dashboard...
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Row 1: Horizontal Scrollable Card Strip */}
            <div style={{ position: "relative" }}>
              <div
                className="card-strip"
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#2a2a2a transparent",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Card 1: Total Revenue */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>
                      Total Revenue
                    </span>
                    <TotalRevenueIcon />
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#3fcf8e",
                      marginBottom: "8px",
                    }}
                  >
                    Rs. {stats.totalRevenue.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>
                    From paid orders
                  </div>
                </div>

                {/* Card 2: Pending Dues */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>
                      Pending Dues
                    </span>
                    <PendingDuesIcon />
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#e05555",
                      marginBottom: "8px",
                    }}
                  >
                    Rs. {stats.pendingDues.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>
                    Unpaid orders
                  </div>
                </div>

                {/* Card 3: Total Orders */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>
                      Total Orders
                    </span>
                    <TotalOrdersIcon />
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#e8e8e8",
                      marginBottom: "8px",
                    }}
                  >
                    {stats.totalOrders}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>All time</div>
                </div>

                {/* Card 4: This Month */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>
                      This Month
                    </span>
                    <ThisMonthIcon />
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#378ADD",
                      marginBottom: "8px",
                    }}
                  >
                    {stats.ordersThisMonth}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>
                    Orders created
                  </div>
                </div>

                {/* Card 5: Low Stock Alert */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555" }}>
                      Low stock alert
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke={lowStockCount > 0 ? "#e8a020" : "#333"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 2l7 14H2L9 2z" />
                      <path d="M9 8v4M9 13.5v.5" />
                    </svg>
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: lowStockCount > 0 ? "#e8a020" : "#e8e8e8",
                      marginBottom: "4px",
                    }}
                  >
                    {lowStockCount}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
                    {lowStockCount === 0 ? "All items stocked" : "Items need restock"}
                  </div>

                  {/* Mini list of up to 3 low stock items */}
                  {lowStockItems?.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "5px 0",
                        borderTop: i === 0 ? "1px solid #1e1e1e" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "140px",
                        }}
                      >
                        {item.name}
                        {item.variantLabel ? ` (${item.variantLabel})` : ""}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          flexShrink: 0,
                          color: item.stock === 0 ? "#e05555" : "#e8a020",
                          background: item.stock === 0 ? "#2b0a0a" : "#2b1a00",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          marginLeft: "6px",
                        }}
                      >
                        {item.stock === 0 ? "Out" : `${item.stock} left`}
                      </span>
                    </div>
                  ))}

                  {lowStockCount > 3 && (
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "6px", textAlign: "right" }}>
                      +{lowStockCount - 3} more
                    </div>
                  )}
                </div>

                {/* Card 6: Top Selling Item */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
                    background: "#161616",
                    border: "1px solid #222",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#555" }}>
                      Top selling items
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="#333"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M3 14l4-5 3 3 4-6" />
                      <circle cx="15" cy="5" r="1.5" fill="#378ADD" stroke="none" />
                    </svg>
                  </div>

                  {/* Top item highlight */}
                  {topSellingItems?.[0] ? (
                    <>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#e8e8e8",
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {topSellingItems[0].name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
                        {topSellingItems[0].totalQty} units sold
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 600,
                          color: "#e8e8e8",
                          marginBottom: "4px",
                        }}
                      >
                        —
                      </div>
                      <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
                        No sales yet
                      </div>
                    </>
                  )}

                  {/* Ranked list */}
                  <div
                    className="top-sell-scroll"
                    style={{
                      maxHeight: "130px",
                      overflowY: "auto",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      flex: 1,
                    }}
                  >
                    {topSellingItems?.slice(0, 4).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "5px 0",
                          borderTop: i === 0 ? "1px solid #1e1e1e" : "none",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "#444", minWidth: "14px" }}>
                          {i + 1}
                        </span>

                        <span
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            flex: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </span>

                        <span
                          style={{
                            fontSize: "10px",
                            color: "#378ADD",
                            background: "#0d1e2e",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            flexShrink: 0,
                          }}
                        >
                          {item.totalQty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right fade hint */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "60px",
                  height: "calc(100% - 8px)",
                  background: "linear-gradient(to right, transparent, #111)",
                  pointerEvents: "none",
                  borderRadius: "0 14px 14px 0",
                }}
              />
            </div>

            {/* Row 2: Chart + Calendar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              {/* Revenue Chart */}
              <div
                style={{
                  background: "#161616",
                  border: "1px solid #222",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#888",
                          marginBottom: "4px",
                        }}
                      >
                        Revenue
                      </div>
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 600,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        Rs. {stats.totalRevenue.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["weekly", "monthly", "yearly"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            borderRadius: "20px",
                            border: "none",
                            cursor: "pointer",
                            background:
                              period === p
                                ? "#e8e8e8"
                                : "transparent",
                            color:
                              period === p
                                ? "black"
                                : "#555",
                            transition: "all 0.2s",
                          }}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeOpacity={0} />
                      <XAxis 
                        dataKey="label"
                        stroke="#555"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "#1e1e1e",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          color: "#e8e8e8",
                          fontSize: "12px",
                        }}
                        cursor={{ fill: "#378ADD", opacity: 0.1 }}
                        formatter={(val) => [`Rs. ${val.toLocaleString("en-IN")}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={index === chartData.length - 1 ? "#378ADD" : "#252525"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendar Widget */}
              <CalendarWidget
                ordersThisMonthRevenue={
                  chartData?.length > 0 
                    ? chartData[chartData.length - 1]?.revenue || 0
                    : 0
                }
              />
            </div>

            {/* Row 3: Recent Orders */}
            <div
              style={{
                background: "#161616",
                border: "1px solid #222",
                borderRadius: "14px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "white",
                    margin: 0,
                  }}
                >
                  Recent Orders
                </h2>
                <button
                  onClick={() => navigate("/dashboard/orders")}
                  style={{
                    color: "#378ADD",
                    background: "none",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View All →
                </button>
              </div>

              {recentOrders && recentOrders.length > 0 ? (
                <div className="hidden md:block overflow-x-auto">
                  <table style={{ width: "100%", fontSize: "14px" }}>
                    <thead
                      style={{
                        background: "#1a1a1a",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Invoice #
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Customer
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Order Status
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Payment Status
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#888",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => {
                        // Customer name — customerId is a populated object
                        const customerName =
                          order.customerId?.name || order.customerId || "Unknown";

                        // Amount
                        const amount = order.totalAmount
                          ? `Rs. ${Number(order.totalAmount).toLocaleString(
                              "en-IN"
                            )}`
                          : "Rs. 0";

                        // Date — fix Invalid Date
                        const dateStr = order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—";

                        // Invoice number
                        const invoiceNum = order.invoiceNumber || "N/A";

                        return (
                          <tr
                            key={order._id || i}
                            onClick={() =>
                              navigate(`/dashboard/orders/${order._id}`)
                            }
                            style={{
                              borderBottom: "1px solid #1e1e1e",
                              transition: "background 0.15s",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#1a1a1a")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td style={tdStyle}>{invoiceNum}</td>
                            <td style={tdStyle}>{customerName}</td>
                            <td style={tdStyle}>{amount}</td>
                            <td style={tdStyle}>
                              <StatusPill status={order.orderStatus} />
                            </td>
                            <td style={tdStyle}>
                              <StatusPill status={order.paymentStatus} />
                            </td>
                            <td style={{ ...tdStyle, color: "#555" }}>
                              {dateStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "32px 0",
                  }}
                >
                  No recent orders
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};
