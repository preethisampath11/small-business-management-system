import React, { useState } from "react";

export const CalendarWidget = ({ ordersThisMonthRevenue = 0 }) => {
  const [current, setCurrent] = useState(new Date());
  const today = new Date();

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
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    cells.push(
      <div
        key={`day-${d}`}
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
          background: isToday ? "#378ADD" : "transparent",
          color: isToday ? "#fff" : "#888",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isToday) e.currentTarget.style.background = "#1e1e1e";
        }}
        onMouseLeave={(e) => {
          if (!isToday) e.currentTarget.style.background = "transparent";
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
        <span
          style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#e8e8e8",
            flex: 1,
          }}
        >
          Rs. {ordersThisMonthRevenue?.toLocaleString("en-IN") || 0}
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
      </div>
    </div>
  );
};
