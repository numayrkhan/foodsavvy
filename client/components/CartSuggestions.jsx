// src/components/CartSuggestions.jsx
import { useState } from "react";

export default function CartSuggestions({ suggestions, onAdd }) {
  const items = Array.isArray(suggestions) ? suggestions : [];
  const [expanded, setExpanded] = useState(false);

  const DISPLAY_LIMIT = 4;
  const visible = expanded ? items : items.slice(0, DISPLAY_LIMIT);

  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-3">
        You Might Also Like
      </h4>

      <div className="flex space-x-4 overflow-x-auto pb-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className="min-w-[140px] bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition p-4 flex-shrink-0"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-24 object-cover rounded-md mb-3"
              />
            )}
            <div className="text-white text-xs font-medium mb-1">
              {item.name}
            </div>
            <div className="text-white text-sm font-semibold mb-3">
              ${(item.priceCents / 100).toFixed(2)}
            </div>
            <button
              onClick={() => onAdd(item)}
              className="w-full text-center text-sm font-semibold px-2 py-1 rounded-full border border-accent text-accent hover:bg-accent hover:text-white transition"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {items.length > DISPLAY_LIMIT && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-accent hover:underline mt-2"
        >
          {expanded ? "Show Fewer" : `View All ${items.length}`}
        </button>
      )}
    </div>
  );
}
