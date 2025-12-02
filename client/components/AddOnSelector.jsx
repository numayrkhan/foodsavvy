// src/components/AddOnSelector.jsx
import { useState, useEffect } from "react";

export default function AddOnSelector({ addOns = [], onChange }) {
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const toggleAddOn = (addOn) => {
    setSelected((prev) =>
      prev.some((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  useEffect(() => {
    onChange?.(selected);
  }, [selected, onChange]);

  const DISPLAY_LIMIT = 5;
  const visible = expanded ? addOns : addOns.slice(0, DISPLAY_LIMIT);

  return (
    <section className="py-2">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Add-Ons</h4>

      <div
        className="flex space-x-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visible.map((addOn) => {
          const isActive = selected.some((a) => a.id === addOn.id);
          return (
            <button
              key={addOn.id}
              onClick={() => toggleAddOn(addOn)}
              className={`snap-start whitespace-nowrap px-2 sm:px-3 py-1 sm:py-2 rounded-full border transition focus:outline-none text-xs sm:text-sm ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {addOn.name} (+${(addOn.priceCents / 100).toFixed(2)})
            </button>
          );
        })}
      </div>

      {addOns.length > DISPLAY_LIMIT && (
        <button
          className="text-xs text-blue-600 hover:underline mt-1 hidden sm:inline-block"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show Less" : `+${addOns.length - DISPLAY_LIMIT} More`}
        </button>
      )}
    </section>
  );
}
