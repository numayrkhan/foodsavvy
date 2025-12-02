// client/src/context/CartProvider.jsx
import { useState } from "react";
import { CartContext } from "./cart-context";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [lastAddedItem, setLastAddedItem] = useState(null);

  const addToCart = (item, quantity) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevCart, { ...item, quantity }];
    });

    setLastAddedItem({ ...item, quantity });
    setTimeout(() => setLastAddedItem(null), 3000);
  };

  const removeFromCart = (itemId) =>
    setCart((prev) => prev.filter((i) => i.id !== itemId));

  const clearCart = () => setCart([]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId); // Remove if quantity drops to 0 or below
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        lastAddedItem,
        setLastAddedItem,
        updateQuantity, // Expose the new function
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
