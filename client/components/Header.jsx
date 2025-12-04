import { useState } from "react";
import { useCart } from "../context/cart-context";
import { HashLink } from "react-router-hash-link";
import { useLocation, Link } from "react-router-dom";
import OrderPreview from "./OrderPreview";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const { cart } = useCart();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  const isCartPage = location.pathname === "/cart";
  const isCheckoutPage = location.pathname === "/checkout";
  const isConfirmationPage = location.pathname.startsWith("/order-confirmation");

  const navLinks = [
    { name: "Home", to: "/#" },
    { name: "Weekly Menu", to: "/#weekly-menu" },
    { name: "Everyday Menu", to: "/#everyday-menu" },
    { name: "How It Works", to: "/#how-it-works" },
    { name: "Catering", to: "/#catering" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <HashLink
          to="/#"
          className="text-2xl font-bold text-white"
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
              className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition"
            >
              {link.name}
            </HashLink>
          ))}
        </nav>

        {/* Cart and Mobile Icons */}
        <div className="relative flex items-center space-x-3">
          {/* Context-aware Cart Action */}
          {isCheckoutPage ? (
            <Link
              to="/cart"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition flex items-center font-medium border border-white/10"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Cart
            </Link>
          ) : !isCartPage && !isConfirmationPage ? (
            <HashLink
              smooth
              to="/cart"
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition flex items-center font-medium"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-1" />
              {cart.length > 0 ? `Cart (${cart.length})` : "Order Now"}
            </HashLink>
          ) : null}

          {!isCartPage && !isCheckoutPage && !isConfirmationPage && <OrderPreview />}

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            {isNavOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isNavOpen && (
        <nav className="md:hidden bg-gray-900/95 border-t border-white/10 px-4 pb-4 absolute w-full left-0 top-full shadow-xl backdrop-blur-xl">
          {navLinks.map((link) => (
            <HashLink
              smooth
              key={link.name}
              to={link.to}
              className="block py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition border-b border-white/5 last:border-0"
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
