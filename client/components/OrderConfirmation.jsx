// client/src/components/OrderConfirmation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { groupByServiceDate, labelForDateKey } from "../src/utils/grouping";

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const pi = params.get("pi");
  const [status, setStatus] = useState("loading"); // loading | ready | pending | error
  const [order, setOrder] = useState(null);

  const title = useMemo(() => {
    if (status === "ready") return "Order Confirmed 🎉";
    if (status === "pending") return "Finalizing your order…";
    if (status === "error") return "We hit a snag";
    return "Loading…";
  }, [status]);

  useEffect(() => {
    let mounted = true;
    if (!pi) {
      setStatus("error");
      return;
    }

    const start = Date.now();
    const timeoutMs = 30000; // wait up to 30s for webhook to create the order
    const pollInterval = 1200;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/orders/by-intent/${encodeURIComponent(pi)}`
        );

        if (res.status === 404) {
          if (Date.now() - start > timeoutMs) {
            if (mounted) setStatus("pending");
            return;
          }
          setTimeout(poll, pollInterval);
          return;
        }

        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        if (!mounted) return;
        setOrder(data);
        setStatus("ready");
      } catch {
        if (mounted) setStatus("error");
      }
    };

    poll();
    return () => {
      mounted = false;
    };
  }, [pi]);

  const money = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="min-h-[70vh] text-gray-100 px-4 py-10">
      <div className="max-w-xl mx-auto bg-gray-900 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>

        {status === "loading" && (
          <p className="text-gray-300">Fetching your order…</p>
        )}

        {status === "pending" && (
          <>
            <p className="text-gray-300 mb-3">
              We received your payment (
              <code className="text-gray-400">{pi}</code>) and are finalizing
              your order.
            </p>
            <p className="text-gray-400">
              You can safely close this tab — we’ll email your receipt.
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-400">
              We couldn’t load your order right now.
            </p>
            <p className="text-gray-400 mt-1">
              PaymentIntent: <code>{pi || "Unknown"}</code>
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}

        {status === "ready" && order && (
          <>
            <p className="text-gray-300">
              Thanks, {order.customerName || "Guest"}! Your order is confirmed.
            </p>
            <p className="text-gray-400 mb-4">
              Order #{order.id} • PaymentIntent{" "}
              <code className="text-gray-500">
                {order.stripePaymentIntentId}
              </code>
            </p>



            <section className="space-y-3 text-sm">
              <div className="bg-gray-800 rounded-md p-3">
                <h2 className="font-semibold mb-1">
                  {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
                </h2>
                {order.fulfillment !== "pickup" && order.address && (
                  <p>{order.address}</p>
                )}
                <p>
                  {order.customerEmail}
                  {order.phone ? ` • ${order.phone}` : ""}
                </p>
              </div>

              <div className="bg-gray-800 rounded-md p-3 space-y-4">
                <h2 className="font-semibold mb-2">Items</h2>
                
                {/* Grouped Items from DeliveryGroups */}
                {order.deliveryGroups?.length > 0 ? (
                  order.deliveryGroups
                    .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate))
                    .map((group) => (
                      <div key={group.id} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-primary">
                            {labelForDateKey(new Date(group.serviceDate).toISOString().slice(0, 10))}
                          </span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                            {group.slot || "No slot"}
                          </span>
                        </div>
                        <div className="space-y-1 pl-2 border-l-2 border-gray-700">
                          {group.items?.map((oi) => (
                            <div key={oi.id} className="flex justify-between text-gray-300">
                              <span>
                                {oi.quantity}× {oi.menuItem?.name || "Item"}
                              </span>
                              <span>{money(oi.priceCents * oi.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  /* Fallback for legacy orders without groups */
                  order.orderItems?.map((oi) => (
                    <div key={oi.id} className="flex justify-between">
                      <span>
                        {oi.quantity}× {oi.menuItem?.name || "Item"}
                      </span>
                      <span>{money(oi.priceCents * oi.quantity)}</span>
                    </div>
                  ))
                )}

                {order.addOns?.length > 0 && (
                  <>
                    <div className="border-t border-gray-700 my-2 pt-2" />
                    <h3 className="text-xs font-semibold text-gray-400 mb-1">Add-ons</h3>
                    {order.addOns.map((ao) => (
                      <div key={ao.id} className="flex justify-between text-gray-300">
                        <span>
                          {ao.quantity}× {ao.name}
                        </span>
                        <span>{money(ao.priceCents * ao.quantity)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="bg-gray-800 rounded-md p-3">
                <h2 className="font-semibold mb-1">Total</h2>
                <p className="text-lg font-semibold">
                  {money(order.totalCents)}
                </p>
              </div>
            </section>

            <div className="mt-6 flex gap-3">
              <Link
                to="/"
                className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
              >
                Back to Home
              </Link>
              <Link
                to="/cart"
                className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
              >
                Order Again
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
