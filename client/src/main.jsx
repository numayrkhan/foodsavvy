// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { CartProvider } from "../context/CartProvider";
import { FulfillmentProvider } from "../context/fulfillment-context";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById("root")).render(
  <FulfillmentProvider>
    <CartProvider>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </CartProvider>
  </FulfillmentProvider>
);
