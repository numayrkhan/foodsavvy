import React, { useMemo, useState } from "react";
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

function labelForDateKey(dateKey) {
  const d = new Date(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
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

/** ---------- Main ---------- **/

export default function Cart() {
  const { cart = [], removeFromCart, clearCart, updateQuantity } = useCart();

  // Checkout modal state
  
  
  

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

  return (
    <section className="container mx-auto px-4 py-10 text-white">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold">Your Cart</h2>
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
        <section key={dateKey} className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-3">
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
                  className="bg-gray-800 rounded-2xl p-4 md:p-6 flex items-start gap-4"
                >
                  {/* thumbnail */}
                  {line.imageUrl ? (
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white/10 shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{line.name}</p>

                        {line.type === "addon" && (
                          <p className="text-xs text-white/60 mt-1">Add-on</p>
                        )}

                        {/* Scheduled day label */}
                        {line.serviceDate && line.serviceLabel && (
                          <p className="text-xs text-white/60 mt-1">
                            Scheduled for{" "}
                            <span className="font-medium">
                              {line.serviceLabel}
                            </span>
                          </p>
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
                    <div className="mt-4 flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 bg-white/10 rounded-lg">
                        <button
                          onClick={() => dec(line)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-l-lg"
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          –
                        </button>
                        <span
                          className="min-w-[2ch] text-center"
                          aria-live="polite"
                        >
                          {line.quantity || 1}
                        </span>
                        <button
                          onClick={() => inc(line)}
                          className={`w-8 h-8 flex items-center justify-center rounded-r-lg ${
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
                        className="ml-1 text-sm text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-xl w-full sm:w-auto"
              type="button"
            >
              Checkout
            </button>
          </div>

          {/* Delivery / Pick-Up choice */}
          <DeliveryPickupModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSelect={(choice) => {
              setModalOpen(false);
              // Next step: route/store choice for DeliveryForm / Pickup flow.
              // e.g. navigate(`/checkout/${choice}`);
            }}
          />
        </aside>
      )}
    </section>
  );
}
