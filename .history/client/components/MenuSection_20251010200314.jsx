import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];



// Monday-based start-of-week helper
function startOfWeekIso(dateStrOrNull) {
  const dt = dateStrOrNull ? new Date(dateStrOrNull) : new Date();
  dt.setHours(0,0,0,0);
  const diff = (dt.getDay() + 6) % 7; // 0=Sun -> 6, 1=Mon -> 0 ...
  dt.setDate(dt.getDate() - diff);
  // return YYYY-MM-DD
  return dt.toISOString().slice(0,10);
}
function dateForWeekday(weekOfISO, weekdayIdx) {
  const base = new Date(weekOfISO); // Monday
  const d = new Date(base);
  d.setDate(base.getDate() + weekdayIdx); // 0..6
  return d.toISOString().slice(0,10);
}

export default function MenuSection({ title }) {
  const [weekday, setWeekday] = useState(1);          // Mon default
  const [weekOf, setWeekOf] = useState("");           // "" => template mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  // Fetch items for weekday (+ optional weekOf)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = weekOf
          ? `/api/menus/by-day?weekday=${weekday}&date=${startOfWeekIso(weekOf)}`
          : `/api/menus/by-day?weekday=${weekday}`;
        const res = await fetch(qs);
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
  }, [weekday, weekOf]);

  // Build category list from items (unchanged)
  const categories = useMemo(() => {
    const names = new Set((items || []).map(i => i?.category?.name).filter(Boolean));
    return ["All", ...names];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => { setActiveCategory("All"); }, [weekday, weekOf]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items || [];
    return (items || []).filter(i => i?.category?.name === activeCategory);
  }, [items, activeCategory]);

  // Compute label/date for the selected weekday
  const weekOfISO = weekOf ? startOfWeekIso(weekOf) : "";
  const serviceDate = weekOfISO ? dateForWeekday(weekOfISO, weekday) : null;
  const serviceLabel = weekOfISO
    ? `${WEEKDAYS[weekday]} ${new Date(serviceDate).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}`
    : WEEKDAYS[weekday];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">{title}</h2>

        {/* Week selector (optional). Empty = templates */}
        <div className="flex flex-wrap gap-3 mb-4 justify-center">
          <label className="text-sm">
            Week of (Mon):{" "}
            <input
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
        </div>

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

            {/* Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filtered.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  serviceDate={serviceDate}          // <-- now week-aware
                  serviceLabel={serviceLabel}        // e.g. "Mon 10/13" or just "Mon"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
