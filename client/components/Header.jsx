import { useState } from "react";
import { useCart } from "../context/cart-context";
import { HashLink } from "react-router-hash-link";
import OrderPreview from "./OrderPreview";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const { cart } = useCart(); // Removed lastAddedItem since it's not used here
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navLinks = [
    { name: "Home", to: "/#" },
    { name: "Weekly Menu", to: "/#weekly-menu" },
    { name: "Everyday Menu", to: "/#everyday-menu" },
    { name: "How It Works", to: "/#how-it-works" },
    { name: "Catering", to: "/#catering" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <HashLink
          to="/#"
          className="text-2xl font-bold"
          style={{ fontFamily: "'Lobster', cursive" }}
        >
          Food Savvy
        </HashLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <HashLink
              smooth
              key={link.name}
              to={link.to}
              className="text-gray-800 hover:text-gray-900 transition"
            >
              {link.name}
            </HashLink>
          ))}
        </nav>

        {/* Cart and Mobile Icons */}
        <div className="relative flex items-center space-x-3">
          {/* Cart Icon - Simple link to cart page */}
          <HashLink
            smooth
            to="/cart"
            className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg shadow-md transition flex items-center"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-1" />
            {cart.length > 0 ? `Cart (${cart.length})` : "Order Now"}
          </HashLink>

          <OrderPreview />

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            {isNavOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-800" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isNavOpen && (
        <nav className="md:hidden bg-white px-4 pb-4">
          {navLinks.map((link) => (
            <HashLink
              smooth
              key={link.name}
              to={link.to}
              className="block py-2 text-gray-800 hover:bg-gray-100 rounded transition"
              onClick={() => setIsNavOpen(false)}
            >
              {link.name}
            </HashLink>
          ))}
        </nav>
      )}
    </header>
  );
}
