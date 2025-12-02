import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function MenuSection({ title }) {
  const [weekday, setWeekday] = useState(1); // Mon default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/menus/by-day?weekday=${weekday}`);
        if (!res.ok) throw new Error("Failed to load menu");
        const json = await res.json();
        if (!cancel) setItems(json.items || []);
      } catch (e) {
        if (!cancel) setError(e.message || "Failed to load menu");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [weekday]);

  // Group items by category for section chips
  const categories = useMemo(() => {
    const names = new Set((items || []).map(i => i?.category?.name).filter(Boolean));
    return ["All", ...names];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => { setActiveCategory("All"); }, [weekday]); // reset when day changes

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items || [];
    return (items || []).filter(i => i?.category?.name === activeCategory);
  }, [items, activeCategory]);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">{title}</h2>

        {/* Weekday tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center" role="tablist" aria-label="Service days">
          {WEEKDAYS.map((label, i) => {
            const selected = i === weekday;
            return (
              <button
                key={label}
                role="tab"
                aria-selected={selected}
                onClick={() => setWeekday(i)}
                className={`px-4 py-2 rounded-lg ${selected ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Loading / error */}
        {loading && <p className="text-center py-8">Loading {title}…</p>}
        {!loading && error && <p className="text-center py-8 text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <>
            {/* Category chips */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg ${activeCategory === cat ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filtered.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  serviceDate={null}                  // no specific date now
                  serviceLabel={WEEKDAYS[weekday]}    // "Mon", "Tue", ...
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
