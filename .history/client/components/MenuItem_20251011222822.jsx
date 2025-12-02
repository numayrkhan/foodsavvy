// src/components/MenuItem.jsx
import React, { useState } from "react";
import { useCart } from "../context/cart-context";
import AddOnSelector from "./AddOnSelector";

/**
 * Props:
 * - item
 * - serviceDate: ISO date (e.g., "2025-08-12" or full ISO)
 * - serviceLabel: human label for the day tab (e.g., "Tue 8/12")
 */

export default function MenuItem({ item, serviceDate, serviceLabel }) {
  const { addToCart, setLastAddedItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // ✅ Normalize once: "YYYY-MM-DD"
  const dayKey = serviceDate
    ? new Date(serviceDate).toISOString().slice(0, 10)
    : null;

  const handleAddToCart = () => {
    if (!selectedVariant || quantity < 1) return;

    // ✅ Grouping key: consistent and normalized
    const groupKey = dayKey ? `weekly:${dayKey}` : "immediate";

    // ✅ Make id day-aware so Mon vs Wed don’t collide
    const mainId = `${item.id}-${selectedVariant.id}${
      dayKey ? `-${dayKey}` : ""
    }`;

    const mainItem = {
      id: mainId,
      name: `${item.name} (${selectedVariant.label})`,
      priceCents: Number(selectedVariant.priceCents),
      imageUrl: item.imageUrl,
      description: item.description || "",
      quantity,
      menuItemId: item.id,
      type: "item",
      // scheduling metadata for downstream UI/checkout
      serviceDate: dayKey, // normalized date
      serviceLabel: serviceLabel || null,
      cartGroupKey: groupKey,
    };

    addToCart(mainItem, quantity);

    // Add-ons inherit the same date/group
    selectedAddOns.forEach((addOn) => {
      const addOnId = `addon-${addOn.id}${dayKey ? `-${dayKey}` : ""}`;
      addToCart(
        {
          id: addOnId,
          name: addOn.name,
          priceCents: addOn.priceCents,
          imageUrl: addOn.imageUrl,
          description: addOn.description || "",
          type: "addon",
          quantity: 1,
          serviceDate: dayKey,
          serviceLabel: serviceLabel || null,
          cartGroupKey: groupKey,
          parentId: mainId,
        },
        1
      );
    });

    // Record composite for any previews/toasts
    setLastAddedItem({ main: mainItem, addOns: selectedAddOns });

    // Reset local state
    setQuantity(1);
    setSelectedAddOns([]);
  };

  // Weekday shown in the tab (e.g., "Mon", "Tue"...)
  const tabDay = serviceLabel ? serviceLabel.split(" ")[0] : null;

  // Map to the NEXT weekday for display
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let scheduleDay = null;
  if (tabDay) {
    const idx = DAYS.findIndex((d) => d.toLowerCase() === tabDay.toLowerCase());
    if (idx !== -1) scheduleDay = DAYS[(idx + 1) % 7]; // next day, wraps Sat -> Sun
  }

  const [imgFit, setImgFit] = useState("cover"); // "cover" | "contain"
  const [imgPos, setImgPos] = useState("center bottom"); // CSS object-position

  const handleImgLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const containerAspect = 4 / 3; // frame aspect ratio used below
    const imgAspect = w / h;

    // Tall/narrow → show whole image (no cropping)
    if (imgAspect < containerAspect * 0.95) {
      setImgFit("contain");
      setImgPos("center center");
    } else {
      // Wide/normal → fill frame and bias down so food stays visible
      setImgFit("cover");
      setImgPos("center 80%");
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-md p-4 flex flex-col space-y-3">
      <div
        className="relative w-full rounded-lg overflow-hidden bg-white/10 style={{ aspectRatio: "3 / "
        style={{ aspectRatio: "4 / 3" }}
      >
        {/* soft blurred backdrop so "contain" doesn't leave harsh bars */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40"
          />
        )}

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onLoad={handleImgLoad}
            className="relative w-full h-full block"
            style={{ objectFit: imgFit, objectPosition: imgPos }}
          />
        ) : null}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white">{item.name}</h3>
        {scheduleDay && (
          <p className="text-xs text-white/70 mt-1">
            Scheduled for <span className="font-medium">{scheduleDay}</span>
          </p>
        )}
      </div>

      {typeof item.remaining === "number" && (
        <div
          className={`inline-block text-xs px-2 py-1 rounded ${
            item.remaining > 0
              ? "bg-white/10 text-white/90"
              : "bg-red-600/20 text-red-300"
          }`}
        >
          {item.remaining > 0 ? `${item.remaining} left` : "Sold out"}
        </div>
      )}

      {item.description && <p className="text-gray-400">{item.description}</p>}

      {/* Variants */}
      {item.variants?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.variants.map((v) => {
            const isActive = selectedVariant?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition
                  focus:outline-none focus:ring-2 focus:ring-accent
                  ${
                    isActive
                      ? "bg-accent text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                aria-pressed={isActive}
              >
                {v.label} (+${(v.priceCents / 100).toFixed(2)})
              </button>
            );
          })}
        </div>
      )}

      {/* Add‑Ons */}
      <AddOnSelector addOns={item.addOns || []} onChange={setSelectedAddOns} />

      {/* Quantity & Add Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={decrement}
          className="w-8 h-8 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Decrease quantity"
        >
          –
        </button>
        <span className="text-white" aria-live="polite">
          {quantity}
        </span>
        <button
          onClick={increment}
          className="w-8 h-8 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Increase quantity"
        >
          +
        </button>

        <button
          onClick={handleAddToCart}
          disabled={typeof item.remaining === "number" && item.remaining <= 0}
          title={
            selectedVariant
              ? typeof item.remaining === "number" && item.remaining <= 0
                ? "Sold out"
                : "Add to order"
              : "Choose a variant first"
          }
          className={`ml-auto rounded-lg px-5 py-2 font-medium text-white transition
            ${
              selectedVariant
                ? "bg-accent hover:bg-accent-dark"
                : "bg-gray-600 cursor-not-allowed"
            }`}
        >
          Add to Order
        </button>
      </div>
    </div>
  );
}
