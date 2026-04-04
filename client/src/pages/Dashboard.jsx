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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("yearly");

  // Fetch dashboard stats on mount
  useEffect(() => {
    const fetchStats = async () => {
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
            monthlyRevenue: response.data.monthlyRevenue,
            recentOrders: response.data.recentOrders,
          });
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

    fetchStats();
  }, []);

  // Chart data is already in correct format from backend
  const chartData = stats?.monthlyRevenue || [];

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

  // Calculate revenue trend from monthly data
  const calculateTrend = () => {
    if (!chartData || chartData.length < 2) return 0;
    const current = chartData[chartData.length - 1]?.revenue || 0;
    const previous = chartData[chartData.length - 2]?.revenue || 0;
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const trend = calculateTrend();

  return (
    <div className="relative min-h-screen bg-[#111]">
      <Sidebar />
      <Navbar />

      <div className="ml-[232px] pt-[92px] p-4 sm:p-6 min-h-screen overflow-y-auto pb-[32px]">
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
            {/* Row 1: Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue Card */}
              <div
                style={{
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
                  <span
                    style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}
                  >
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

              {/* Pending Dues Card */}
              <div
                style={{
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
                  <span
                    style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}
                  >
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

              {/* Total Orders Card */}
              <div
                style={{
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
                  <span
                    style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}
                  >
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

              {/* This Month Card */}
              <div
                style={{
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
                  <span
                    style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}
                  >
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
                        {trend > 0 && (
                          <span
                            style={{
                              background: "#0d2b1a",
                              color: "#3fcf8e",
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              fontWeight: 500,
                            }}
                          >
                            ▲ {trend}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["Weekly", "Monthly", "Yearly"].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range.toLowerCase())}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            borderRadius: "20px",
                            border: "none",
                            cursor: "pointer",
                            background:
                              timeRange === range.toLowerCase()
                                ? "#e8e8e8"
                                : "transparent",
                            color:
                              timeRange === range.toLowerCase()
                                ? "black"
                                : "#555",
                            transition: "all 0.2s",
                          }}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeOpacity={0} />
                      <XAxis dataKey="month" stroke="#555" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "#1e1e1e",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          color: "white",
                        }}
                        cursor={{ fill: "#378ADD", opacity: 0.1 }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#1e1e1e"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendar Widget */}
              <CalendarWidget
                ordersThisMonthRevenue={
                  stats.ordersThisMonth > 0 ? stats.totalRevenue / 12 : 0
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

              {stats.recentOrders && stats.recentOrders.length > 0 ? (
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
                      {stats.recentOrders.map((order) => (
                        <tr
                          key={order._id}
                          onClick={() =>
                            navigate(`/dashboard/orders/${order._id}`)
                          }
                          style={{
                            borderTop: "1px solid #222",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#1a1a1a")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "12px",
                              color: "white",
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          >
                            {order.invoiceNumber || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: "white",
                              fontSize: "12px",
                            }}
                          >
                            {order.customerName}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: "white",
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          >
                            Rs. {order.amount?.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              className={getOrderStatusBadgeColor(
                                order.orderStatus,
                              )}
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-block",
                                borderRadius: "4px",
                              }}
                            >
                              {order.orderStatus?.charAt(0).toUpperCase() +
                                order.orderStatus?.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              className={getPaymentStatusBadgeColor(
                                order.paymentStatus,
                              )}
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-block",
                                borderRadius: "4px",
                              }}
                            >
                              {order.paymentStatus?.charAt(0).toUpperCase() +
                                order.paymentStatus?.slice(1)}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: "#888",
                              fontSize: "12px",
                            }}
                          >
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
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
