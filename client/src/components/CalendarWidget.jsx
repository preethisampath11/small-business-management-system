import React, { useState, useEffect } from "react";
import API from "../api";

export const CalendarWidget = ({ ordersThisMonthRevenue = 0 }) => {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [dateRevenue, setDateRevenue] = useState(0);

  // Get today in LOCAL time correctly
  const now = new Date();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const year = current.getFullYear();
  const month = current.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Fetch revenue for a specific date
  const fetchDateRevenue = async (date) => {
    try {
      // Format date in LOCAL timezone (not UTC)
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const response = await API.get(`/orders/stats/by-date?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.success) {
        setDateRevenue(response.data.revenue || 0);
      }
    } catch (err) {
      console.error("Failed to fetch date revenue:", err);
      setDateRevenue(0);
    }
  };

  // Fetch today's revenue on mount
  useEffect(() => {
    fetchDateRevenue(new Date());
  }, []);

  const handleDayClick = (d) => {
    const clickedDate = new Date(year, month, d);
    setSelectedDay(d);
    fetchDateRevenue(clickedDate);
  };

  // Calculate first day of month and offset
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7; // convert to Mon-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build cells array
  const cells = [];

  // Empty cells before first day
  for (let i = 0; i < offset; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === todayDate &&
      month === todayMonth &&
      year === todayYear;
    const isSelected = selectedDay === d;
    cells.push(
      <div
        key={`day-${d}`}
        onClick={() => handleDayClick(d)}
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          fontSize: "12px",
          cursor: "pointer",
          margin: "2px auto",
          background: isSelected ? "#378ADD" 
                    : isToday ? "#1e1e1e" 
                    : "transparent",
          border: isToday && !isSelected ? "1px solid #378ADD" : "none",
          color: isSelected ? "#fff" 
               : isToday ? "#e8e8e8" 
               : "#888",
          transition: "background 0.15s",
        }}
      >
        {d}
      </div>,
    );
  }

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid #222",
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px 8px",
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: "13px", fontWeight: "500", color: "#e8e8e8" }}>
          {monthNames[month]}, {year}
        </span>
        <button
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px 8px",
          }}
        >
          ›
        </button>
      </div>

      {/* Day names row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          marginBottom: "8px",
        }}
      >
        {dayNames.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "#444",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: "2px",
        }}
      >
        {cells}
      </div>

      {/* Bottom revenue tile */}
      <div
        style={{
          marginTop: "12px",
          background: "#1e1e1e",
          borderRadius: "10px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#378ADD"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="2" y="10" width="2" height="4" rx="1" />
          <rect x="7" y="6" width="2" height="8" rx="1" />
          <rect x="12" y="3" width="2" height="11" rx="1" />
        </svg>
        {selectedDay ? (
          <>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#e8e8e8",
                flex: 1,
              }}
            >
              Rs. {Number(dateRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}
            </span>
            <span
              style={{
                background: "#0d2b1a",
                color: "#3fcf8e",
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "20px",
              }}
            >
              ▲
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: "14px",
              color: "#555",
              flex: 1,
              fontWeight: 500,
            }}
          >
            Select a date to view sales
          </span>
        )}
      </div>
    </div>
  );
};
