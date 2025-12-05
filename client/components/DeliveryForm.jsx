
// client/components/DeliveryForm.jsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import {
  useJsApiLoader,
  Autocomplete,
  DistanceMatrixService,
} from "@react-google-maps/api";
import { useCart } from "../context/cart-context";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { groupByServiceDate, labelForDateKey } from "../src/utils/grouping";

const libraries = ["places"];

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4f46e5" },
    background: { paper: "#1f1f1f" },
    text: { primary: "#fff", secondary: "#bbb" },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundColor: "#1f1f1f" } } },
  },
});

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/** Renders PaymentElement and confirms payment INSIDE <Elements> */
function PaymentStep({
  billingName,
  billingEmail,
  isPaying,
  setIsPaying,
  setPaymentError,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements || !ready) return;
    setIsPaying(true);
    setPaymentError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setPaymentError(
        submitError.message || "Please complete the payment details."
      );
      setIsPaying(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: billingName || undefined,
            email: billingEmail || undefined,
          },
        },
        receipt_email: billingEmail || undefined,
      },
    });

    if (error) {
      setPaymentError(error.message || "Payment failed. Please try again.");
      setIsPaying(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onSuccess?.(paymentIntent.id);
      setIsPaying(false);
      return;
    }
    setPaymentError("Payment could not be completed. Please try again.");
    setIsPaying(false);
  };

  return (
    <div className="space-y-4 mt-6 bg-gray-800 p-4 rounded-md">
      <h3 className="text-white text-lg font-semibold">Payment</h3>
      <div className="border border-gray-700 bg-gray-900 rounded-md p-3">
        <PaymentElement onReady={() => setReady(true)} />
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={isPaying || !ready}
        className={`w-full py-2 rounded-md font-medium transition text-white border border-gray-700 ${
          isPaying
            ? "bg-gray-700 opacity-60 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-800"
        }`}
      >
        {isPaying ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

export default function DeliveryForm({ fulfillment = "delivery", selectedSlots = {} }) {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const isPickup = fulfillment === "pickup";

  // ---------- Dynamic delivery config ----------
  const [config, setConfig] = useState(null); // { settings, slots, blackouts }
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingConfig(true);
        const res = await fetch("/api/delivery/config");
        const data = await res.json();
        if (!mounted) return;
        setConfig(data || {});
      } catch (e) {
        console.error("Failed to load /api/delivery/config", e);
        if (!mounted) setConfig(null);
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Blackouts as a fast lookup set (YYYY-MM-DD)
  const blackoutISO = useMemo(() => {
    const set = new Set();
    (config?.blackouts || []).forEach((b) => {
      const iso = new Date(b.date).toISOString().slice(0, 10);
      set.add(iso);
    });
    return set;
  }, [config]);

  // ---------- Google Maps ----------
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });
  const autocompleteRef = useRef(null);

  // Address & distance/fee
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [distanceMiles, setDistanceMiles] = useState(null);
  const [fee, setFee] = useState(null);

  // Contact & scheduling
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Removed local selectedDate/selectedSlot state in favor of passed selectedSlots prop

  // Capacity-aware availability (raw from API)
  const [availability, setAvailability] = useState(null);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Totals
  const itemsTotal = cart.reduce(
    (sum, item) => sum + (item.priceCents * item.quantity) / 100,
    0
  );
  // For pickup, fee is always 0
  const feeTotal = isPickup ? 0 : (fee || 0);
  const salesTax = parseFloat(((itemsTotal + feeTotal) * 0.06625).toFixed(2));
  const grandTotal = (itemsTotal + feeTotal + salesTax).toFixed(2);

  // Group items for display
  const orderedGroups = useMemo(() => {
    const groups = groupByServiceDate(cart);
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [cart]);

  // Parse address → coords & text
  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace?.();
    if (place?.geometry) {
      const loc = place.geometry.location;
      setAddress(place.formatted_address || "");
      setCoords({ lat: loc.lat(), lng: loc.lng() });
    }
  }, []);

  // Compute delivery fee using tier table (miles → feeCents)
  function computeTierUSD(miles) {
    const s = config?.settings;
    if (!s || miles == null) return null;
    if (s.maxRadiusMiles != null && miles > s.maxRadiusMiles) return null;
    const tiers = Array.isArray(s.feeTiers) ? [...s.feeTiers] : [];
    tiers.sort((a, b) => a.toMiles - b.toMiles);
    const hit = tiers.find((t) => miles <= t.toMiles);
    return hit ? (hit.feeCents || 0) / 100 : null;
  }

  // Use Distance Matrix against configured origin (lat/lng if set; otherwise the address string)
  const distanceMatrixOrigin = useMemo(() => {
    const s = config?.settings;
    if (!s) return null;
    if (s.originLat != null && s.originLng != null) {
      return { lat: s.originLat, lng: s.originLng };
    }
    return s.originAddress || null;
  }, [config]);

  const onDistanceCallback = useCallback(
    (response, status) => {
      if (status === "OK") {
        const element = response.rows[0].elements[0];
        if (element.status === "OK") {
          const miles = element.distance.value / 1609.34;
          const rounded = parseFloat(miles.toFixed(2));
          setDistanceMiles(rounded);
          setFee(computeTierUSD(rounded));
        } else {
          setDistanceMiles(null);
          setFee(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config]
  );

  function localDateKey(d) {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  // Removed useEffect for availability fetching since slots are passed in

  // Removed slotMeta calculation since slots are passed in

  const inRange = isPickup || fee !== null;
  // Slots are pre-validated in Cart, but we check existence here too
  const hasSlots = selectedSlots && Object.keys(selectedSlots).length > 0;
  const canContinue = inRange && hasSlots;

  // Elements options (include clientSecret & hide billing name/email in PE)
  const elementsOptions = useMemo(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: { theme: "night" },
      fields: { billingDetails: { name: "never", email: "never" } },
    };
  }, [clientSecret]);

  if (loadError) {
    return (
      <div className="p-4 text-red-400">
        Error loading Maps API – please try again later.
      </div>
    );
  }

  if (!isLoaded || loadingConfig) {
    return <div className="p-4 text-gray-400">Loading delivery options…</div>;
  }

  const originLine = config?.settings?.originAddress
    ? `from ${config.settings.originAddress}`
    : "origin not configured";
  const radius = config?.settings?.maxRadiusMiles ?? 15;

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="bg-black min-h-screen py-8">
          {!isPickup && (
            <header className="sticky top-0 z-10 bg-gray-800 text-center text-sm text-gray-200 font-medium p-2">
              Delivery available within {radius} miles {originLine}
            </header>
          )}

          <div className="mx-auto md:max-w-md px-4 py-6 bg-gray-900 rounded-lg space-y-6">
            {/* Delivery Address - Only for Delivery */}
            {!isPickup && (
              <div>
                <label
                  htmlFor="delivery-address"
                  className="block text-sm font-semibold text-gray-200 mb-1"
                >
                  Delivery Address
                </label>
                <Autocomplete
                  onLoad={(auto) => (autocompleteRef.current = auto)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    id="delivery-address"
                    type="text"
                    placeholder="Enter delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </Autocomplete>
              </div>
            )}

            {/* Distance / Range - Only for Delivery */}
            {!isPickup && coords && distanceMatrixOrigin && (
              <DistanceMatrixService
                options={{
                  origins: [distanceMatrixOrigin],
                  destinations: [coords],
                  travelMode: "DRIVING",
                }}
                callback={onDistanceCallback}
              />
            )}
            {!isPickup && distanceMiles != null && (
              <p className="text-sm text-gray-200">
                Estimated distance: {distanceMiles} miles • Fee: $
                {fee != null ? fee.toFixed(2) : "—"}
              </p>
            )}
            {!isPickup && coords && fee === null && (
              <p className="text-sm text-red-500">
                Sorry, that address is outside our delivery radius.
              </p>
            )}

            {/* Name & Email */}
            <div className="grid gap-3">
              <div>
                <label
                  htmlFor="billing-name"
                  className="block text-sm font-semibold text-gray-200 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="billing-name"
                  type="text"
                  placeholder="Full name"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="billing-email"
                  className="block text-sm font-semibold text-gray-200 mb-1"
                >
                  Email (for receipt)
                </label>
                <input
                  id="billing-email"
                  type="email"
                  placeholder="you@example.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone-number"
                className="block text-sm font-semibold text-gray-200 mb-1"
              >
                Phone Number
              </label>
              <IMaskInput
                mask="(000) 000-0000"
                value={phone}
                unmask={false}
                onAccept={(val) => setPhone(val)}
                id="phone-number"
                placeholder="(123) 456-7890"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Unified Order Summary */}
            <div>
              <p className="text-sm font-semibold text-gray-200 mb-1">
                Order Summary
              </p>
              <div className="bg-gray-800 p-4 rounded-md text-sm text-gray-200 space-y-4">
                {orderedGroups.map(([dateKey, items]) => (
                  <div key={dateKey} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-primary">
                        {labelForDateKey(dateKey)}
                      </span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                        {selectedSlots[dateKey] || "No slot"}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-gray-700">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-gray-300">
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>
                            ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-gray-700 space-y-1">
                  {!isPickup && (
                    <div className="flex justify-between font-medium">
                      <span>Delivery Fee</span>
                      <span>{fee != null ? `$${fee.toFixed(2)}` : "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Sales Tax (6.625%)</span>
                    <span>${salesTax}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2">
                    <span>Total</span>
                    <span>${grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue to Payment */}
            <button
              type="button"
              disabled={!canContinue || !billingName || !billingEmail}
              onClick={async () => {
                setShowPayment(true);
                setPaymentError("");

                // Backward compatibility: use the first selected slot as the "primary" delivery date/slot
                const dateKeys = Object.keys(selectedSlots || {}).sort();
                const firstDateKey = dateKeys[0];
                const firstSlot = firstDateKey ? selectedSlots[firstDateKey] : null;

                try {
                  const res = await fetch("/api/create-payment-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: Math.round(parseFloat(grandTotal) * 100),
                      name: billingName || "Guest",
                      email: billingEmail || "guest@example.com",
                      type: fulfillment,
                      metadata: {
                        type: fulfillment,
                        name: billingName || "Guest",
                        email: billingEmail || "guest@example.com",
                        address: isPickup ? "Pickup" : address,
                        phone,
                        // New multi-day schedule format (Array)
                        schedule: JSON.stringify(
                          Object.entries(selectedSlots || {}).map(
                            ([date, slot]) => ({ date, slot })
                          )
                        ),
                        // Legacy fields for backward compatibility (uses first slot)
                        deliveryDate: isPickup ? null : firstDateKey,
                        deliverySlot: isPickup ? null : firstSlot,
                        menuItems: JSON.stringify(
                          cart
                            .filter((i) => i.type !== "addon")
                            .map((i) => ({
                              menuItemId: i.id,
                              quantity: i.quantity,
                              priceCents: i.priceCents,
                              name: i.name,
                              serviceDate: i.serviceDate, // Added serviceDate
                            }))
                        ),
                        addOns: JSON.stringify(
                          cart
                            .filter((i) => i.type === "addon")
                            .map((i) => ({
                              name: i.name,
                              quantity: i.quantity,
                              priceCents: i.priceCents,
                            }))
                        ),
                      },
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data?.clientSecret) {
                    throw new Error(data?.error || "Failed to create payment");
                  }
                  setClientSecret(data.clientSecret);
                } catch (err) {
                  console.error("Failed to fetch clientSecret", err);
                  setPaymentError(
                    err.message || "Payment initialization failed"
                  );
                }
              }}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                canContinue && billingName && billingEmail
                  ? "bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 shadow-lg"
                  : "bg-gray-700 opacity-60 cursor-not-allowed"
              }`}
            >
              Continue to Payment
            </button>

            {/* Inline PaymentElement */}
            {showPayment && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={elementsOptions}
                key={clientSecret}
              >
                <PaymentStep
                  billingName={billingName}
                  billingEmail={billingEmail}
                  isPaying={isPaying}
                  setIsPaying={setIsPaying}
                  setPaymentError={setPaymentError}
                  onSuccess={(piId) => {
                    setPaymentSuccess(true);
                    clearCart();
                    setTimeout(() => {
                      navigate(
                        `/order-confirmation?pi=${encodeURIComponent(piId)}`
                      );
                    }, 1500);
                  }}
                />
              </Elements>
            )}

            {paymentError && (
              <p className="text-red-500 text-sm">{paymentError}</p>
            )}
            {paymentSuccess && (
              <p className="text-green-500 font-semibold">
                Payment successful!
              </p>
            )}
          </div>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
