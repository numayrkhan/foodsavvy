import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart-context";
import DeliveryPickupModal from "./DeliveryPickupModal";

/** ---------- Helpers ---------- **/

// Group lines by normalized date key (YYYY-MM-DD)
function groupByServiceDate(lines) {
  return lines.reduce((acc, line) => {
    if (!line?.serviceDate) return acc; // skip legacy/invalid
    (acc[line.serviceDate] ||= []).push(line);
    return acc;
  }, {});
}

// Render the group header in a stable/UTC-safe way and prefix with "Ready on"
function labelForDateKey(dateKey) {
  // dateKey is "YYYY-MM-DD" (scheduled date). Parse at UTC noon to avoid tz drift.
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  return `Ready on ${dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })}`;
}

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

/**
 * Per-day capacity cap:
 * Uses snapshot from add time: remainingAtAdd -> capacityPerDay -> Infinity.
 * Sums all lines with the same menuItemId in the same date group.
 */
function maxAllowedForLine(line, groupLines) {
  if (line.type !== "item") return Infinity;

  const baseline =
    typeof line.remainingAtAdd === "number"
      ? line.remainingAtAdd
      : typeof line.capacityPerDay === "number"
      ? line.capacityPerDay
      : Infinity;

  if (!isFinite(baseline)) return Infinity;

  const totalForItem = groupLines
    .filter((l) => l.type === "item" && l.menuItemId === line.menuItemId)
    .reduce((sum, l) => sum + Number(l.quantity || 0), 0);

  const others = totalForItem - Number(line.quantity || 0);
  return Math.max(baseline - others, 0);
}

/** Component to fetch and display slots for a specific date */
function DateSlotPicker({ dateKey, selectedSlot, onSelect }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/availability?date=${dateKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setSlots(data.slots || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to fetch slots", err);
          setError("Could not load times");
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [dateKey]);

  if (loading) return <div className="text-sm text-gray-400">Loading times...</div>;
  if (error) return <div className="text-sm text-red-400">{error}</div>;
  if (!slots.length) return <div className="text-sm text-amber-400">No slots available</div>;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-sm font-medium text-white mb-2">Select a time for this day:</p>
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => {
          const isSelected = selectedSlot === s.label;
          const isDisabled = !s.active || s.remaining <= 0;
          return (
            <button
              key={s.label}
              onClick={() => onSelect(s.label)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                isSelected
                  ? "bg-primary text-white border-primary"
                  : isDisabled
                  ? "bg-white/5 text-white/30 border-transparent cursor-not-allowed"
                  : "bg-white/10 text-white hover:bg-white/20 border-transparent"
              }`}
            >
              {s.label}
              {!isDisabled && s.remaining < 10 && (
                <span className="ml-1 text-[10px] opacity-70">({s.remaining} left)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** ---------- Main ---------- **/

export default function Cart() {
  const navigate = useNavigate();
  const { cart = [], removeFromCart, clearCart, updateQuantity } = useCart();

  // Checkout modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState(null); // "pickup" | "delivery"

  // Selected slots state: { [dateKey]: slotLabel }
  const [selectedSlots, setSelectedSlots] = useState({});

  const ctaText = fulfillment
    ? `Continue to ${fulfillment === "delivery" ? "Delivery" : "Pick-Up"}`
    : "Checkout";

  const subtotalCents = useMemo(
    () =>
      cart.reduce(
        (sum, l) => sum + Number(l.priceCents || 0) * Number(l.quantity || 1),
        0
      ),
    [cart]
  );

  // Build grouped + sort chronologically (ISO sorts correctly)
  const orderedGroups = useMemo(() => {
    const groups = groupByServiceDate(cart);
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [cart]);

  const groupsMap = useMemo(
    () => Object.fromEntries(orderedGroups),
    [orderedGroups]
  );

  const inc = (line) => {
    const key = line.serviceDate;
    const groupLines = groupsMap[key] || [];
    const maxQty = maxAllowedForLine(line, groupLines);
    const next = Number(line.quantity || 1) + 1;

    if (next > maxQty) {
      alert("Sorry, that’s the maximum available for this day.");
      return;
    }
    updateQuantity(line.id, next);
  };

  const dec = (line) => {
    const next = (line.quantity || 1) - 1;
    if (next <= 0) return removeFromCart(line.id);
    updateQuantity(line.id, next);
  };

  const del = (line) => removeFromCart(line.id);

  // Focus heading on mount for accessibility
  React.useEffect(() => {
    document.getElementById("cart-heading")?.focus();
  }, []);

  // Validate slots before opening modal
  const handleCheckoutClick = () => {
    const missingDates = orderedGroups
      .map(([dateKey]) => dateKey)
      .filter((dateKey) => !selectedSlots[dateKey]);

    if (missingDates.length > 0) {
      alert("Please select a time slot for all days before checking out.");
      return;
    }
    setModalOpen(true);
  };

  return (
    <section className="container mx-auto px-4 py-10 text-white">
      <header className="flex items-center justify-between mb-6">
        <h2 
          id="cart-heading" 
          tabIndex={-1} 
          className="text-3xl font-semibold focus:outline-none"
        >
          Your Cart
        </h2>
        <button
          onClick={clearCart}
          className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
          disabled={!cart.length}
        >
          Clear cart
        </button>
      </header>

      {!cart.length && (
        <p className="text-white/70">
          Your cart is empty. Add some tasty items!
        </p>
      )}

      {orderedGroups.map(([dateKey, lines]) => (
        <section key={dateKey} className="mb-10 bg-gray-900/50 rounded-3xl p-6 border border-white/5">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">
            {labelForDateKey(dateKey)}
          </h3>

          <div className="space-y-4">
            {lines.map((line) => {
              const groupLines = groupsMap[dateKey] || [];
              const maxQty = maxAllowedForLine(line, groupLines);
              const atLimit =
                isFinite(maxQty) && Number(line.quantity || 0) >= maxQty;

              return (
                <div
                  key={line.id}
                  className="bg-gray-800 rounded-2xl p-4 flex items-start gap-4"
                >
                  {/* thumbnail */}
                  {line.imageUrl ? (
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{line.name}</p>

                        {line.type === "addon" && (
                          <p className="text-xs text-white/60 mt-1">Add-on</p>
                        )}

                        {/* Nudge at capacity */}
                        {atLimit && line.type === "item" && (
                          <p className="text-xs text-amber-300/90 mt-1">
                            Max available reached for this day
                          </p>
                        )}
                      </div>

                      <p className="text-white">{money(line.priceCents)}</p>
                    </div>

                    {/* quantity controls */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 bg-white/10 rounded-lg">
                        <button
                          onClick={() => dec(line)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-l-lg"
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          –
                        </button>
                        <span
                          className="min-w-[2ch] text-center text-sm"
                          aria-live="polite"
                        >
                          {line.quantity || 1}
                        </span>
                        <button
                          onClick={() => inc(line)}
                          className={`w-7 h-7 flex items-center justify-center rounded-r-lg ${
                            atLimit
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-white/10"
                          }`}
                          aria-label={`Increase quantity of ${line.name}`}
                          disabled={atLimit}
                          title={
                            atLimit ? "No more available for this day" : ""
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => del(line)}
                        className="ml-1 text-xs text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slot Selection for this group */}
          <DateSlotPicker 
            dateKey={dateKey} 
            selectedSlot={selectedSlots[dateKey]} 
            onSelect={(slot) => setSelectedSlots(prev => ({ ...prev, [dateKey]: slot }))} 
          />
        </section>
      ))}

      {!!cart.length && (
        <aside className="mt-8 md:mt-10 border-t border-white/10 pt-6">
          <div className="flex justify-between text-white/90 mb-2">
            <span>Subtotal</span>
            <span>{money(subtotalCents)}</span>
          </div>

          <div className="flex justify-between text-white font-semibold text-lg mt-2">
            <span>Total</span>
            <span>{money(subtotalCents)}</span>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCheckoutClick}
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg font-bold px-8 py-4 rounded-xl w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all transform"
              type="button"
            >
              {ctaText}
            </button>
          </div>

          {/* Delivery / Pick-Up choice */}
          <DeliveryPickupModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSelect={(choice) => {
              setFulfillment(choice); // "pickup" | "delivery"
              setModalOpen(false);
              navigate("/checkout", { state: { fulfillment: choice, selectedSlots } });
            }}
          />
        </aside>
      )}
    </section>
  );
}
