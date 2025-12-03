// src/components/MenuItem.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/cart-context";
import AddOnSelector from "./AddOnSelector";

/**
 * Props:
 * - item
 * - serviceDate: ISO date (e.g., "2025-08-12" or full ISO)
 * - serviceLabel: human label for the day tab (e.g., "Tue 8/12" or "Mon")
 */

export default function MenuItem({ item, serviceDate, serviceLabel }) {
  const { addToCart, setLastAddedItem, cart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // Auto-select if only one variant
  useEffect(() => {
    if (item.variants?.length === 1 && !selectedVariant) {
      setSelectedVariant(item.variants[0]);
    }
  }, [item.variants, selectedVariant]);

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // Normalize once: "YYYY-MM-DD"
  const dayKey = serviceDate
    ? new Date(serviceDate).toISOString().slice(0, 10)
    : null;

  const handleAddToCart = () => {
    if (!selectedVariant || quantity < 1) return;

    // Grouping key: consistent and normalized
    const groupKey = dayKey ? `weekly:${dayKey}` : "immediate";

    // Make id day-aware so Mon vs Wed don’t collide
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
      serviceDate: dayKey,
      serviceLabel: serviceLabel || null,
      cartGroupKey: groupKey,

      capacityPerDay:
        typeof item.capacityPerDay === "number" ? item.capacityPerDay : null,
      remainingAtAdd:
        typeof item.remaining === "number" ? item.remaining : null,
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

  // Image fit behavior
  const [imgFit, setImgFit] = useState("cover"); // "cover" | "contain"
  const [imgPos, setImgPos] = useState("center bottom"); // CSS object-position
  const handleImgLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const containerAspect = 4 / 3; // frame aspect ratio
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

  // ---- Availability fallback: show a badge even before first order exists ----
  // If server returned item.remaining (number), use it. Otherwise, if admin set a
  // capacityPerDay, show that as the starting number.
  const serverRemaining =
    typeof item.remaining === "number"
      ? item.remaining
      : typeof item.capacityPerDay === "number"
      ? item.capacityPerDay
      : null;

  // Calculate quantity already in cart for this item (across all variants/days if needed, but usually per day)
  // Here we filter by menuItemId. If capacity is per day, we should technically filter by day too?
  // The backend `remaining` logic seems to be per day (based on `remainingByItem` in `menus.js`).
  // So we should filter cart items by `menuItemId` AND `serviceDate` (dayKey).
  const quantityInCart = cart.reduce((acc, cartItem) => {
    if (
      cartItem.menuItemId === item.id &&
      cartItem.type === "item" &&
      cartItem.serviceDate === dayKey
    ) {
      return acc + cartItem.quantity;
    }
    return acc;
  }, 0);

  const liveRemaining =
    serverRemaining !== null ? Math.max(0, serverRemaining - quantityInCart) : null;

  const isSoldOut = liveRemaining !== null && liveRemaining <= 0;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-md p-4 flex flex-col space-y-3">
      <div
        className="relative w-full rounded-lg overflow-hidden bg-white/10"
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

      {/* Title row with larger availability pill on the right */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">{item.name}</h3>

        {liveRemaining !== null && (
          <span
            aria-label={
              liveRemaining > 0 ? `${liveRemaining} left` : "Sold out"
            }
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border
        ${
          liveRemaining > 0
            ? "border-white/30 bg-white/15 text-white"
            : "border-red-500/50 bg-red-600/25 text-red-200"
        }`}
          >
            {/* Tiny status dot for quick scanning */}
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                liveRemaining > 0 ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {liveRemaining > 0 ? `${liveRemaining} left` : "Sold out"}
          </span>
        )}
      </div>

      {/* Schedule line stays under the title row */}
      {scheduleDay && (
        <p className="text-xs text-white/70 mt-1">
          Scheduled for <span className="font-medium">{scheduleDay}</span>
        </p>
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-gray-800
                  ${
                    isActive
                      ? "bg-accent border-accent text-white shadow-lg scale-105"
                      : "bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600 hover:border-gray-500"
                  }`}
                aria-pressed={isActive}
              >
                {v.label} <span className="opacity-80 ml-1">+${(v.priceCents / 100).toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add-Ons */}
      <AddOnSelector addOns={item.addOns || []} onChange={setSelectedAddOns} />

      {/* Quantity & Add Button */}
      <div className="flex items-center gap-4 mt-auto pt-2">
        <div className="flex items-center bg-gray-700 rounded-lg p-1">
          <button
            onClick={decrement}
            className="w-8 h-8 text-white rounded hover:bg-gray-600 transition flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            –
          </button>
          <span className="w-8 text-center text-white font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            onClick={increment}
            className="w-8 h-8 text-white rounded hover:bg-gray-600 transition flex items-center justify-center"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isSoldOut || !selectedVariant}
          title={
            !selectedVariant
              ? "Choose a variant first"
              : isSoldOut
              ? "Sold out"
              : "Add to order"
          }
          className={`ml-auto flex-1 rounded-lg px-4 py-3 font-bold text-white transition-all transform border
            ${
              selectedVariant && !isSoldOut
                ? "bg-accent hover:bg-accent-dark border-white/30 shadow-lg hover:scale-[1.02] active:scale-95"
                : "bg-gray-600/50 text-gray-400 cursor-not-allowed border-transparent"
            }`}
        >
          {!selectedVariant ? "Select Option" : isSoldOut ? "Sold Out" : "Add to Order"}
        </button>
      </div>
    </div>
  );
}

