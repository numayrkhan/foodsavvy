import React, { useMemo } from "react";
import { useCart } from "../context/cart-context";

/** ---------- Helpers ---------- **/

// Group lines by normalized date key (YYYY-MM-DD) or "unscheduled"
function groupByServiceDate(lines) {
  return lines.reduce((acc, line) => {
    const key = line?.serviceDate || "unscheduled";
    (acc[key] ||= []).push(line);
    return acc;
  }, {});
}

// Human-friendly label for section headers
function labelForDateKey(dateKey) {
  if (dateKey === "unscheduled") return "No date selected";
  const d = new Date(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// Cents → $xx.xx
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

/**
 * Given a cart line and the lines in its date group, return the max allowed
 * quantity for THIS line so we never exceed per-day capacity.
 * Priority: remainingAtAdd (live) → capacityPerDay (static) → Infinity
 */
function maxAllowedForLine(line, groupLines) {
  // only items (not add-ons) have per-day capacity
  if (line.type !== "item") return Infinity;

  const baseline =
    typeof line.remainingAtAdd === "number"
      ? line.remainingAtAdd
      : typeof line.capacityPerDay === "number"
      ? line.capacityPerDay
      : Infinity;

  if (!isFinite(baseline)) return Infinity;

  // Total of THIS menuItemId already in the group (same date)
  const totalForItem = groupLines
    .filter((l) => l.type === "item" && l.menuItemId === line.menuItemId)
    .reduce((sum, l) => sum + Number(l.quantity || 0), 0);

  // How many MORE we can add on top of other lines of the same item
  // We allow the current line to go up to: baseline - (others in group)
  const others = totalForItem - Number(line.quantity || 0);
  return Math.max(baseline - others, 0);
}

/** ---------- Main Component ---------- **/

export default function Cart() {
  const { cart = [], removeFromCart, clearCart, updateQuantity } = useCart();

  // Totals (single fee is handled elsewhere — DeliveryForm / checkout)
  const subtotalCents = useMemo(
    () =>
      cart.reduce(
        (sum, l) => sum + Number(l.priceCents || 0) * Number(l.quantity || 1),
        0
      ),
    [cart]
  );

  // Build grouped view — chronological, then “unscheduled”
  const orderedGroups = useMemo(() => {
    const groups = groupByServiceDate(cart);
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return a.localeCompare(b); // YYYY-MM-DD sorts chronologically
    });
  }, [cart]);

  // Convenience: quick map for lookups by dateKey
  const groupsMap = useMemo(
    () => Object.fromEntries(orderedGroups),
    [orderedGroups]
  );

  // Line controls
  const inc = (line) => {
    const groupKey = line?.serviceDate || "unscheduled";
    const groupLines = groupsMap[groupKey] || [];
    const maxQty = maxAllowedForLine(line, groupLines);
    const next = Number(line.quantity || 1) + 1;

    if (next > maxQty) {
      // Optional: replace with a toast/inline hint if you have one
      // eslint-disable-next-line no-alert
      alert("Sorry, thats the maximum available for this day.");
      return;
    }
    updateQuantity(line.id, next);
  };

  const dec = (line) => {
    const next = (line.quantity || 1) - 1;
    if (next <= 0) return removeFromCart(line.id);
    return updateQuantity(line.id, next);
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

      {/* -------- Groups by service date -------- */}
      {orderedGroups.map(([dateKey, lines]) => (
        <section
          key={dateKey}
          role="group"
          aria-labelledby={`cart-day-${dateKey}`}
          className="mb-10"
        >
          <h3
            id={`cart-day-${dateKey}`}
            className="text-lg font-semibold text-white mb-3"
          >
            {labelForDateKey(dateKey)}
          </h3>

          <div role="list" className="space-y-4">
            {lines.map((line) => {
              const groupLines = groupsMap[dateKey] || [];
              const maxQty = maxAllowedForLine(line, groupLines);
              const atLimit =
                isFinite(maxQty) && Number(line.quantity || 0) >= maxQty;

              return (
                <div
                  role="listitem"
                  key={line.id} // stable & unique: baked in by MenuItem.jsx (includes date)
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

                  {/* info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{line.name}</p>

                        {line.type === "addon" && (
                          <p className="text-xs text-white/60 mt-1">Add-on</p>
                        )}

                        {line.serviceLabel && dateKey !== "unscheduled" && (
                          <p className="text-xs text-white/60 mt-1">
                            Delivery:{" "}
                            <span className="font-medium">
                              {line.serviceLabel}
                            </span>
                          </p>
                        )}

                        {atLimit && line.type === "item" && (
                          <p className="text-xs text-amber-300/90 mt-1">
                            Max available reached for this day
                          </p>
                        )}
                      </div>

                      <p className="text-white">{money(line.priceCents)}</p>
                    </div>

                    {/* quantity controls / remove */}
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

      {/* -------- Summary -------- */}
      {!!cart.length && (
        <aside className="mt-8 md:mt-10 border-t border-white/10 pt-6">
          <div className="flex justify-between text-white/90 mb-2">
            <span>Subtotal</span>
            <span>{money(subtotalCents)}</span>
          </div>

          <div className="flex justify-between text-white font-semibold text-lg mt-2">
            <span>Total (before delivery)</span>
            <span>{money(subtotalCents)}</span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <a
              href="/checkout"
              className="inline-block bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-xl"
            >
              Checkout
            </a>
            <p className="text-xs text-white/70">
              One payment • items delivered on their selected days.
            </p>
          </div>
        </aside>
      )}
    </section>
  );
}
