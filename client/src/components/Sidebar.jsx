import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const DashboardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <rect x="2" y="2" width="6" height="6" rx="1.5" />
    <rect x="10" y="2" width="6" height="6" rx="1.5" />
    
    <rect x="2" y="10" width="6" height="6" rx="1.5" />
    <rect x="10" y="10" width="6" height="6" rx="1.5" />
  </svg>
);

const OrdersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4h10a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    <path d="M6 8h6M6 11h4" />
  </svg>
);

const ItemsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M3 3h5l1.5 3H15l-1.5 6H5.5L3 3z" />
    <circle cx="7" cy="15" r="1" />
    <circle cx="13" cy="15" r="1" />
  </svg>
);

const CustomersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="9" cy="6" r="3" />
    <path d="M3 16c0-3.314 2.686-5 6-5s6 1.686 6 5" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M7 3H4a1 1 0 00-1 1v10a1 1 0 001 1h3" />
    <path d="M12 12l3-3-3-3M15 9H7" />
  </svg>
);

const LogoMark = () => (
  <div className="w-6 h-6 bg-gradient-to-br from-[#378ADD] to-[#2563eb] rounded-lg flex-shrink-0" />
);

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { path: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
    { path: "/dashboard/items", label: "Items", icon: ItemsIcon },
    { path: "/dashboard/customers", label: "Customers", icon: CustomersIcon },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden max-sm:flex fixed top-4 left-4 z-50 flex-col gap-1.5 justify-center items-center w-10 h-10 bg-[#161616] rounded-lg border border-[#222] hover:border-[#378ADD] transition"
      >
        <span
          className={`w-6 h-0.5 bg-white transition-transform ${isOpen ? "rotate-45 translate-y-2" : ""}`}
        ></span>
        <span
          className={`w-6 h-0.5 bg-white transition-opacity ${isOpen ? "opacity-0" : ""}`}
        ></span>
        <span
          className={`w-6 h-0.5 bg-white transition-transform ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
        ></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar - Floating Card Style */}
      <div
        className={`hidden md:flex fixed flex-col z-[100] bg-[#161616] border border-[#222] ${
          isOpen ? "flex" : "hidden"
        }`}
        style={{
          top: "16px",
          left: "16px",
          bottom: "16px",
          width: "200px",
          borderRadius: "20px",
          padding: "20px 12px",
          fontFamily: "'Inter', system-ui, sans-serif",
          overflowY: "auto",
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1px solid #222",
          }}
        >
          <LogoMark />
          <h1
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#ffffff",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Invotrack
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: active ? "0 10px 10px 0" : "10px",
                  borderLeft: active ? "2px solid #378ADD" : "none",
                  backgroundColor: active ? "#222" : "transparent",
                  color: active ? "#ffffff" : "#666",
                  fontSize: "13px",
                  fontWeight: 400,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  marginBottom: "4px",
                  transition: "all 0.2s",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#ccc";
                    e.currentTarget.style.backgroundColor = "#1e1e1e";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#666";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <IconComponent />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div
          style={{
            borderTop: "1px solid #222",
            paddingTop: "12px",
            marginTop: "auto",
          }}
        >
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "transparent",
              color: "#666",
              fontSize: "13px",
              fontWeight: 400,
              fontFamily: "'Inter', system-ui, sans-serif",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e05555";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#666";
            }}
          >
            <LogoutIcon />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );
};
