import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Next-day helper for a weekday index (0..6)
const nextDayIdx = (w) => (w + 1) % 7;

export default function MenuSection({ title }) {
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [errorTabs, setErrorTabs] = useState("");
  const [daysWithItems, setDaysWithItems] = useState([]); // array of weekday numbers that have items

  const [weekday, setWeekday] = useState(1); // default Mon
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState("");
  const [items, setItems] = useState([]);

  const todayIdx = new Date().getDay();

  // Discover which weekdays actually have items (from templates)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingTabs(true);
      setErrorTabs("");
      try {
        const results = await Promise.all(
          [...Array(7).keys()].map(async (w) => {
            const res = await fetch(`/api/menus/by-day?weekday=${w}`);
            if (!res.ok) throw new Error("Failed to load menu");
            const json = await res.json();
            return { w, count: Array.isArray(json.items) ? json.items.length : 0 };
          })
        );
        if (cancel) return;

        // Keep days that actually have at least one item
        const withItems = results.filter(r => r.count > 0).map(r => r.w);
        setDaysWithItems(withItems);
      } catch (e) {
        if (!cancel) setErrorTabs(e.message || "Failed to discover menus");
      } finally {
        if (!cancel) setLoadingTabs(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Visible tabs = have items AND their scheduled day (next day) is not "today"
  const visibleTabs = useMemo(() => {
    const filtered = daysWithItems.filter(w => nextDayIdx(w) !== todayIdx);
    // If everything was filtered out (edge case), show the raw daysWithItems
    return filtered.length ? filtered : daysWithItems;
  }, [daysWithItems, todayIdx]);

  // Ensure selected weekday is one of the visible tabs
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(weekday)) {
      setWeekday(visibleTabs[0]); // pick the first available tab
    }
  }, [visibleTabs, weekday]);

  // Load items for the currently selected weekday
  useEffect(() => {
    if (!visibleTabs.length) return; // nothing to show
    let cancel = false;
    (async () => {
      setLoadingItems(true);
      setErrorItems("");
      try {
        const res = await fetch(`/api/menus/by-day?weekday=${weekday}`);
        if (!res.ok) throw new Error("Failed to load menu");
        const json = await res.json();
        if (!cancel) setItems(json.items || []);
      } catch (e) {
        if (!cancel) setErrorItems(e.message || "Failed to load menu");
      } finally {
        if (!cancel) setLoadingItems(false);
      }
    })();
    return () => { cancel = true; };
  }, [weekday, visibleTabs]);

  // Build category list from returned items
  const categories = useMemo(() => {
    const names = new Set((items || []).map(i => i?.category?.name).filter(Boolean));
    return ["All", ...names];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => { setActiveCategory("All"); }, [weekday]); // reset on tab change

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items || [];
    return (items || []).filter(i => i?.category?.name === activeCategory);
  }, [items, activeCategory]);

  const currentTabLabel = WEEKDAYS[weekday];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {title ? <h2 className="text-3xl font-semibold text-center mb-8">{title}</h2> : null}

        {/* Tabs: only days that have items, and not "scheduled for today" */}
        {loadingTabs && <p className="text-center py-8">Loading days…</p>}
        {!loadingTabs && errorTabs && (
          <p className="text-center py-8 text-red-500">Error: {errorTabs}</p>
        )}
        {!loadingTabs && !errorTabs && (
          <>
            {visibleTabs.length ? (
              <div className="flex flex-wrap gap-3 mb-8 justify-center" role="tablist" aria-label="Service days">
                {visibleTabs.map((w) => {
                  const selected = w === weekday;
                  return (
                    <button
                      key={w}
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setWeekday(w)}
                      className={`px-4 py-2 rounded-lg ${selected ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10"}`}
                    >
                      {WEEKDAYS[w]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8">No menus available right now.</p>
            )}
          </>
        )}

        {/* Loading / error for items */}
        {loadingItems && <p className="text-center py-8">Loading {currentTabLabel}…</p>}
        {!loadingItems && errorItems && <p className="text-center py-8 text-red-500">Error: {errorItems}</p>}

        {/* Category chips & items grid */}
        {!loadingItems && !errorItems && !!visibleTabs.length && (
          <>
            {/* Category filter */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              <span className="text-sm opacity-80 mr-2">Category:</span>
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    aria-pressed={active}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg ${active ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10"}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filtered.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  // We keep passing the tab's label; MenuItem already renders "Scheduled for <NextDay>"
                  serviceDate={null}
                  serviceLabel={currentTabLabel}
                />
              ))}
              {!filtered.length && <p className="text-center col-span-full">No items.</p>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
