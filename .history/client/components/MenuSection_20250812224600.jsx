import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

// helper: Monday of the current week (local)
function startOfWeekLocal(d = new Date()) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay(); // 0..6 (Sun..Sat)
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function MenuSection({ title, type = "weekly" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // new weekly-days shape: [{ id, date, label, items: [...] }, ...]
  const [weeklyDays, setWeeklyDays] = useState(null);
  const [activeDayId, setActiveDayId] = useState(null);

  // fallback (current behavior): a flat menu with items + categories
  const [fallbackMenu, setFallbackMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // fetch weekly days first; if 404 or empty, fallback to legacy menu
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const weekOf = dateKey(startOfWeekLocal(new Date()));
        const res = await fetch(`/api/weekly/days?weekOf=${weekOf}`);
        if (res.ok) {
          const days = await res.json();
          days.sort((a, b) => new Date(a.date) - new Date(b.date));
          if (!cancelled && Array.isArray(days) && days.length) {
            setWeeklyDays(days);
            setActiveDayId(days[0].id);
            setLoading(false);
            return;
          }
        }
        const legacy = await fetch(`/api/menus/${type}`);
        if (!legacy.ok) throw new Error("Failed to fetch menu");
        const data = await legacy.json();
        if (!cancelled) {
          setFallbackMenu(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load menu");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  // ✅ Hooks BEFORE any returns; null-safe so they run even while loading
  const usingWeekly = Array.isArray(weeklyDays) && weeklyDays.length > 0;

  const activeDay = useMemo(() => {
    const list = usingWeekly ? weeklyDays : [];
    return list.find((d) => d.id === activeDayId) || null;
  }, [usingWeekly, weeklyDays, activeDayId]);

  const dayCategories = useMemo(() => {
    if (!activeDay) return ["All"];
    const names = new Set(
      (activeDay.items || []).map((i) => i?.category?.name).filter(Boolean)
    );
    return ["All", ...names];
  }, [activeDay]);

  const dayFilteredItems = useMemo(() => {
    if (!activeDay) return [];
    if (activeCategory === "All") return activeDay.items || [];
    return (activeDay.items || []).filter(
      (i) => i?.category?.name === activeCategory
    );
  }, [activeDay, activeCategory]);

  // --- Fallback (legacy) data still supported exactly like before
  const legacyCategories = useMemo(() => {
    if (!fallbackMenu) return ["All"];
    const names = new Set(
      (fallbackMenu.items || []).map((i) => i?.category?.name).filter(Boolean)
    );
    return ["All", ...names];
  }, [fallbackMenu]);

  const legacyFilteredItems = useMemo(() => {
    if (!fallbackMenu) return [];
    if (activeCategory === "All") return fallbackMenu.items || [];
    return (fallbackMenu.items || []).filter(
      (i) => i?.category?.name === activeCategory
    );
  }, [fallbackMenu, activeCategory]);

  // ⬇️ Render state handled in JSX instead of early returns
  return (
    <section className="py-12 bg-black text-white">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl text-center mb-8">{title}</h2>

        {loading && (
          <p className="text-center py-8 text-white">Loading {title}…</p>
        )}
        {!loading && error && (
          <p className="text-center py-8 text-red-500">Error: {error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Day Tabs */}
            {usingWeekly && (
              <div
                role="tablist"
                aria-label="Service days"
                className="flex flex-wrap gap-3 mb-8 justify-center"
              >
                {weeklyDays.map((d) => {
                  const selected = d.id === activeDayId;
                  return (
                    <button
                      key={d.id}
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`day-panel-${d.id}`}
                      id={`day-tab-${d.id}`}
                      onClick={() => {
                        setActiveDayId(d.id);
                        setActiveCategory("All");
                      }}
                      className={`px-4 py-2 rounded-lg outline-offset-2 ${
                        selected
                          ? "bg-accent text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {d.label ||
                        new Date(d.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "numeric",
                          day: "numeric",
                        })}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category chips */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              {(usingWeekly ? dayCategories : legacyCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg ${
                    activeCategory === cat
                      ? "bg-accent text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div
              id={
                usingWeekly && activeDay
                  ? `day-panel-${activeDay.id}`
                  : undefined
              }
              role={usingWeekly ? "tabpanel" : undefined}
              aria-labelledby={
                usingWeekly && activeDay ? `day-tab-${activeDay.id}` : undefined
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {(usingWeekly ? dayFilteredItems : legacyFilteredItems).map(
                (item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    // only defined when using weekly days
                    serviceDate={
                      usingWeekly && activeDay ? activeDay.date : null
                    }
                    serviceLabel={
                      usingWeekly && activeDay
                        ? activeDay.label ||
                          new Date(activeDay.date).toLocaleDateString(
                            undefined,
                            {
                              weekday: "short",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : null
                    }
                    weeklyDayId={usingWeekly && activeDay ? activeDay.id : null}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
