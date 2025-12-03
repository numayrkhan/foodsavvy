import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import DeliveryForm from "./DeliveryForm";

export default function CheckoutPage() {
  const location = useLocation();
  const { fulfillment } = location.state || {};

  // If no fulfillment type is set (e.g. direct access), redirect to cart
  if (!fulfillment) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Checkout ({fulfillment === "pickup" ? "Pick-Up" : "Delivery"})
        </h1>
        <DeliveryForm fulfillment={fulfillment} />
      </div>
    </div>
  );
}
