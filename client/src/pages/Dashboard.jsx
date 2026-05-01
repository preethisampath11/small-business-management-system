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
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#cccccc"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M10 2v16M6 6h6a2 2 0 010 4H8a2 2 0 000 4h7" />
  </svg>
);

const PendingDuesIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#cccccc"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v4l2.5 2.5" />
  </svg>
);

const TotalOrdersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#cccccc"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    <path d="M7 9h6M7 12h4" />
  </svg>
);

const ThisMonthIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="#cccccc"
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
    <div className="relative min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] px-[16px] pb-[32px] min-h-screen overflow-y-auto">
        {error && (
          <div className="bg-[#ffebee] text-[#c62828] p-4 rounded-lg mb-6 border border-[#ef5350] text-xs sm:text-sm">
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
                className="stat-card-strip"
                style={{
                  alignItems: "flex-start",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Card 1: Total Revenue — Primary KPI */}
                <div
                  className="stat-card primary"
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <div className="stat-card-header">
                    <span className="stat-card-label">Total Revenue</span>
                    <TotalRevenueIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="metric-value" style={{ color: "#1a9e6a" }}>
                      Rs. {stats.totalRevenue.toLocaleString("en-IN")}
                    </div>
                    <div className="metric-subtext">From paid orders</div>
                  </div>
                </div>

                {/* Card 2: Pending Dues */}
                <div
                  className="stat-card secondary"
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <div className="stat-card-header">
                    <span className="stat-card-label">Pending Dues</span>
                    <PendingDuesIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="metric-value" style={{ color: "#cc3333" }}>
                      Rs. {stats.pendingDues.toLocaleString("en-IN")}
                    </div>
                    <div className="metric-subtext">Unpaid orders</div>
                  </div>
                </div>

                {/* Card 3: Total Orders */}
                <div
                  className="stat-card card-elevated"
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
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
                    <span style={{ fontSize: "12px", color: "#999999" }}>
                      Total Orders
                    </span>
                    <TotalOrdersIcon />
                  </div>
                  <div
                    className="stat-value"
                    style={{
                      color: "#111111",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.totalOrders}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999999" }}>
                    All time
                  </div>
                </div>

                {/* Card 4: This Month */}
                <div
                  className="stat-card card-elevated"
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
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
                    <span style={{ fontSize: "12px", color: "#999999" }}>
                      This Month
                    </span>
                    <ThisMonthIcon />
                  </div>
                  <div
                    className="stat-value"
                    style={{
                      color: "#378ADD",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.ordersThisMonth}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999999" }}>
                    Orders created
                  </div>
                </div>

                {/* Card 5: Low Stock Alert */}
                <div
                  className="stat-card card-elevated"
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",
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
                    <span style={{ fontSize: "12px", color: "#999999" }}>
                      Low stock alert
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke={lowStockCount > 0 ? "#c47f00" : "#cccccc"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 2l7 14H2L9 2z" />
                      <path d="M9 8v4M9 13.5v.5" />
                    </svg>
                  </div>
                  <div
                    className="stat-value"
                    style={{
                      color: lowStockCount > 0 ? "#c47f00" : "#111111",
                      marginBottom: "4px",
                    }}
                  >
                    {lowStockCount}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999999",
                      marginBottom: "12px",
                    }}
                  >
                    {lowStockCount === 0
                      ? "All items stocked"
                      : "Items need restock"}
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
                          color: "#666666",
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
                          color: item.stock === 0 ? "#cc3333" : "#c47f00",
                          background: item.stock === 0 ? "#fdecea" : "#fff8e6",
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
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999999",
                        marginTop: "6px",
                        textAlign: "right",
                      }}
                    >
                      +{lowStockCount - 3} more
                    </div>
                  )}
                </div>

                {/* Card 6: Top Selling Item */}
                <div
                  className="stat-card card-elevated"
                  style={{
                    flexShrink: 0,
                    width: "220px",
                    height: "220px",

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
                    <span style={{ fontSize: "12px", color: "#999999" }}>
                      Top selling items
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M3 14l4-5 3 3 4-6" />
                      <circle
                        cx="15"
                        cy="5"
                        r="1.5"
                        fill="#378ADD"
                        stroke="none"
                      />
                    </svg>
                  </div>

                  {/* Top item highlight */}
                  {topSellingItems?.[0] ? (
                    <>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1a1a1a",
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {topSellingItems[0].name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#999999",
                          marginBottom: "12px",
                        }}
                      >
                        {topSellingItems[0].totalQty} units sold
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 600,
                          color: "#111111",
                          marginBottom: "4px",
                        }}
                      >
                        —
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#999999",
                          marginBottom: "12px",
                        }}
                      >
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
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#1a5fa5",
                            background: "#e8f2fc",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            minWidth: "20px",
                            textAlign: "center",
                            fontWeight: 500,
                          }}
                        >
                          {i + 1}
                        </span>

                        <span
                          style={{
                            fontSize: "11px",
                            color: "#666666",
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
                  background: "linear-gradient(to right, transparent, #f8f9fa)",
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
                marginTop: "24px",
              }}
            >
              {/* Revenue Chart */}
              <div
                className="section-card card-elevated section-hover"
                style={{
                  padding: "18px 20px",
                  paddingTop: "10px",
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
                          color: "#999999",
                          marginBottom: "4px",
                        }}
                      >
                        Revenue
                      </div>
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 600,
                          color: "#1a1a1a",
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
                            background: period === p ? "#378ADD" : "#f5f5f5",
                            color: period === p ? "#ffffff" : "#666666",
                            transition: "all 0.2s ease",
                            transform:
                              period === p ? "scale(1.05)" : "scale(1)",
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
                        stroke="#999999"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          color: "#1a1a1a",
                          fontSize: "12px",
                        }}
                        cursor={{ fill: "#378ADD", opacity: 0.1 }}
                        formatter={(val) => [
                          `Rs. ${val.toLocaleString("en-IN")}`,
                          "Revenue",
                        ]}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              index === chartData.length - 1
                                ? "#2f78c4"
                                : "#eaeaea"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendar Widget */}
              <div
                className="section-card card-elevated section-hover"
                style={{ padding: "18px 20px" }}
              >
                <CalendarWidget
                  ordersThisMonthRevenue={
                    chartData?.length > 0
                      ? chartData[chartData.length - 1]?.revenue || 0
                      : 0
                  }
                />
              </div>
            </div>

            {/* Row 3: Recent Orders */}
            <div className="section-card card-elevated card-padding section-spacing">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111111",
                  }}
                >
                  Recent Orders
                </span>
                <a
                  href="/dashboard/orders"
                  style={{
                    fontSize: "12px",
                    color: "#378ADD",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  View All →
                </a>
              </div>

              {recentOrders && recentOrders.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "#fafafa",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {[
                        "Invoice #",
                        "Customer",
                        "Amount",
                        "Order Status",
                        "Payment Status",
                        "Date",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px",
                            fontSize: "11px",
                            color: "#999999",
                            fontWeight: "500",
                            textAlign: "left",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => {
                      const customerName =
                        order.customerId?.name || order.customer?.name || "—";

                      const amount = `Rs. ${Number(
                        order.totalAmount || 0,
                      ).toLocaleString("en-IN")}`;

                      const dateStr = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—";

                      const capitalize = (s) =>
                        s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

                      return (
                        <tr
                          key={order._id}
                          className="interactive-tile"
                          onClick={() =>
                            navigate(`/dashboard/orders/${order._id}`)
                          }
                          style={{
                            borderBottom: "1px solid #f0f0f0",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9f9f9")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "12px",
                              color: "#999999",
                            }}
                          >
                            {order.invoiceNumber || "N/A"}
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              style={{
                                fontWeight: "500",
                                color: "#111111",
                                fontSize: "13px",
                              }}
                            >
                              {customerName}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontWeight: "500",
                              color: "#111111",
                              fontSize: "13px",
                            }}
                          >
                            {amount}
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              className={`pill pill-${order.orderStatus?.toLowerCase()}`}
                            >
                              {capitalize(order.orderStatus)}
                            </span>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              className={`pill pill-${order.paymentStatus?.toLowerCase()}`}
                            >
                              {capitalize(order.paymentStatus)}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "12px",
                              color: "#999999",
                            }}
                          >
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#999999",
                    padding: "32px 0",
                    fontSize: "14px",
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
