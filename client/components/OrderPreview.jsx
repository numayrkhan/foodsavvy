// src/components/OrderPreview.jsx
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/cart-context";

export default function OrderPreview() {
  const { lastAddedItem, setLastAddedItem } = useCart();
  const location = useLocation();

  // Auto-hide after 4 seconds
  useEffect(() => {
    if (!lastAddedItem) return;
    const timer = setTimeout(() => setLastAddedItem(null), 4000);
    return () => clearTimeout(timer);
  }, [lastAddedItem, setLastAddedItem]);

  if (!lastAddedItem) return null;

  const onCartPage = location.pathname === "/cart";

  // Pure add-on (no main) should not preview when on /cart
  const isPureAddOn =
    !lastAddedItem.main &&
    typeof lastAddedItem.id === "string" &&
    lastAddedItem.id.startsWith("addon-");
  if (isPureAddOn && onCartPage) return null;

  // Determine main item and add-ons array
  const main = lastAddedItem.main || lastAddedItem;
  const addOns = Array.isArray(lastAddedItem.addOns)
    ? lastAddedItem.addOns
    : [];

  const quantityText = main.quantity > 1 ? `× ${main.quantity}` : "";
  const mainTotal = ((main.priceCents * (main.quantity || 1)) / 100).toFixed(2);

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 rounded-xl shadow-lg z-50 animate-fadeIn">
      <div className="relative p-4 text-white">
        <h3 className="text-lg font-semibold mb-2">Added to Your Bag!</h3>

        {/* Main Dish */}
        <div className="flex items-start mb-3">
          {main.imageUrl && (
            <img
              src={main.imageUrl}
              alt={main.name}
              className="w-12 h-12 rounded-lg object-cover mr-3"
            />
          )}
          <div className="flex-1">
            <p className="text-base">
              {main.name} {quantityText}
            </p>
            <p className="font-bold text-accent">${mainTotal}</p>
          </div>
        </div>

        {/* Add-Ons List */}
        {addOns.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <p className="text-sm text-gray-400 mb-2">Add-Ons:</p>
            {addOns.map((ao) => {
              const price = (ao.priceCents / 100).toFixed(2);
              return (
                <div key={ao.id} className="flex items-center mb-2">
                  {ao.imageUrl && (
                    <img
                      src={ao.imageUrl}
                      alt={ao.name}
                      className="w-8 h-8 rounded mr-2 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{ao.name}</p>
                    <p className="text-sm font-semibold">${price}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Cart CTA */}
        <Link
          to="/cart"
          className="mt-4 inline-block px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition text-sm"
        >
          View Cart
        </Link>

        {/* Close */}
        <button
          onClick={() => setLastAddedItem(null)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
          aria-label="Close preview"
        >
          ×
        </button>
      </div>
    </div>
  );
}
