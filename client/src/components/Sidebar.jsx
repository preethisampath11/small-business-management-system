import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#378ADD] text-white"
      : "text-gray-400 hover:text-white";

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden max-sm:flex fixed top-4 left-4 z-50 flex-col gap-1.5 justify-center items-center w-10 h-10 bg-[#161616] rounded-lg border border-[#222] hover:border-[#378ADD] transition"
      >
        <span className={`w-6 h-0.5 bg-white transition-transform ${isOpen ? "rotate-45 translate-y-2" : ""}`}></span>
        <span className={`w-6 h-0.5 bg-white transition-opacity ${isOpen ? "opacity-0" : ""}`}></span>
        <span className={`w-6 h-0.5 bg-white transition-transform ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed md:static left-0 top-0 w-64 h-screen bg-[#111] border-r border-[#222] flex flex-col z-40 transition-transform max-sm:${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#222]">
          <h1 className="text-2xl font-bold text-[#378ADD]">Invotrack</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg transition ${isActive("/dashboard")}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/dashboard/orders"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg transition ${isActive("/dashboard/orders")}`}
          >
            📋 Orders
          </Link>
          <Link
            to="/dashboard/items"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg transition ${isActive("/dashboard/items")}`}
          >
            📦 Items
          </Link>
          <Link
            to="/dashboard/customers"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg transition ${isActive("/dashboard/customers")}`}
          >
            👥 Customers
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#222]">
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 bg-[#161616] text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};
