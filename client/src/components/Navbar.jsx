import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const Navbar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Map routes to page titles
  const getTitleFromRoute = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/dashboard/orders" || path.startsWith("/dashboard/orders")) {
      if (path.includes("/add")) return "New Order";
      if (path === "/dashboard/orders") return "Orders";
      return "Order Details";
    }
    if (path === "/dashboard/items") return "Items";
    if (path === "/dashboard/customers") return "Customers";
    return "Dashboard";
  };

  // Get user initials
  const getInitials = () => {
    const firstName = user?.name?.[0] || "";
    const businessFirst = user?.businessName?.[0] || "";
    return (firstName + businessFirst).toUpperCase();
  };

  const pageTitle = getTitleFromRoute();
  const initials = getInitials();

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        left: "248px",
        right: "16px",
        height: "60px",
        borderRadius: "16px",
        background: "#161616",
        border: "1px solid #222",
        zIndex: 99,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Left side - Page Title */}
      <h1
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#e8e8e8",
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {pageTitle}
      </h1>

      {/* Right side - User Profile Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#1e1e1e",
          border: "1px solid #2a2a2a",
          borderRadius: "999px",
          padding: "4px 4px 4px 14px",
          cursor: "pointer",
        }}
      >
        {/* User Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#e8e8e8",
              margin: 0,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {user?.name || "User"}
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 400,
              color: "#555",
              margin: 0,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {user?.businessName || ""}
          </div>
        </div>

        {/* Avatar Circle */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#378ADD",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
};
