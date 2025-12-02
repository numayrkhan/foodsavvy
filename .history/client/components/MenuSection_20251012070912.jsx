import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ui = {
  group: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 16,
  },
  chip(active) {
    return {
      padding: "8px 14px",
      borderRadius: 999,
      border: `1px solid ${
        active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)"
      }`,
      background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.92)",
      fontWeight: 600,
      letterSpacing: 0.2,
      cursor: "pointer",
      transition: "background 120ms, border-color 120ms, transform 80ms",
      outline: "none",
    };
  },
  chipHover: {
    background: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  chipFocus: { boxShadow: "0 0 0 3px rgba(255,255,255,0.2)" },
  chipActivePress: { transform: "translateY(1px)" },
  subtleLabel: { opacity: 0.8, fontSize: 12, marginRight: 6 },
};

const nextDayIdx = (w) => (w + 1) % 7;

// Monday-based start-of-week helper
function startOfWeekIso(dateStrOrNull) {
  const dt = dateStrOrNull ? new Date(dateStrOrNull) : new Date();
  dt.setHours(0, 0, 0, 0);
  const diff = (dt.getDay() + 6) % 7; // 0=Sun -> 6, 1=Mon -> 0 ...
  dt.setDate(dt.getDate() - diff);
  // return YYYY-MM-DD
  return dt.toISOString().slice(0, 10);
}
function dateForWeekday(weekOfISO, weekdayIdx) {
  const base = new Date(weekOfISO); // Monday
  const d = new Date(base);
  d.setDate(base.getDate() + weekdayIdx); // 0..6
  return d.toISOString().slice(0, 10);
}

// helper: compute next-day ISO for the selected tab *this* week
// 1) next day of *this* week for the selected tab
function nextDayISOOfThisWeek(weekdayIdx) {
  const now = new Date(); now.setHours(0,0,0,0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday anchor
  const monIdx = (weekdayIdx + 6) % 7;                       // <-- Sun->Mon remap
  const base = new Date(monday);
  base.setDate(monday.getDate() + monIdx);                   // base day in this week
  base.setDate(base.getDate() + 1);                          // scheduled = next day
  return base.toISOString().slice(0,10);
}
  // Convert Sun-based idx (0..6) to Mon-based (Mon=0..Sun=6)
  const monIdx = (weekdayIdx + 6) % 7;

  const base = new Date(monday);
  base.setDate(monday.getDate() + monIdx);
  const sched = new Date(base);
  sched.setDate(base.getDate() + 1);
  return sched.toISOString().slice(0, 10);
}

// Next-day (scheduled) ISO for a given weekday within a chosen week (weekOfISO = Monday)
// e.g., w=1 (Mon) → returns that week's Tuesday
// 2) next day for a *chosen week* (if you’re using weekOf)
function nextDayISOForWeek(weekOfISO, w) {
  const monday = new Date(weekOfISO);                        // weekOf is that Monday
  const monIdx = (w + 6) % 7;                                // <-- Sun->Mon remap
  const base = new Date(monday);
  base.setDate(monday.getDate() + monIdx);
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0,10);
}

export default function MenuSection({ title }) {
  const [weekday, setWeekday] = useState(1); // Mon default
  const [weekOf, setWeekOf] = useState(""); // "" => template mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  // Discover which weekdays actually have items (based on template or selected week)
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [errorTabs, setErrorTabs] = useState("");
  const [daysWithItems, setDaysWithItems] = useState([]); // array of weekday numbers that have items

  const todayIdx = new Date().getDay();

  // Fetch items for weekday (+ optional weekOf)
  // Discover which weekdays have items (respect weekOf if chosen)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingTabs(true);
      setErrorTabs("");
      try {
        const results = await Promise.all(
          [...Array(7).keys()].map(async (w) => {
            // derive a concrete "scheduled for" date for the selected tab when NOT using weekOf
            const scheduledISO = nextDayISOOfThisWeek(w);

            
            const res = await fetch(qs);
            if (!res.ok) throw new Error("Failed to load menu");
            const json = await res.json();
            return {
              w,
              count: Array.isArray(json.items) ? json.items.length : 0,
            };
          })
        );
        if (cancel) return;

        const withItems = results.filter((r) => r.count > 0).map((r) => r.w);
        setDaysWithItems(withItems);
      } catch (e) {
        if (!cancel) setErrorTabs(e.message || "Failed to discover menus");
      } finally {
        if (!cancel) setLoadingTabs(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [weekOf]);

  // Visible tabs = have items AND their scheduled day (next day) is not "today"
  // Visible tabs = days that have items AND
  // 1) their base day is today or later in the week, AND
  // 2) their scheduled day (next day) is not "today" (no same-day prep)
  const visibleTabs = useMemo(() => {
    // keep only days >= today (Mon/Tue/... earlier in the week get hidden)
    const notPastThisWeek = daysWithItems.filter((w) => w >= todayIdx);
    // also hide tabs whose next-day equals today
    const filtered = notPastThisWeek.filter((w) => nextDayIdx(w) !== todayIdx);
    // if nothing qualifies, show none
    return filtered.length ? filtered : [];
  }, [daysWithItems, todayIdx]);

  // Ensure selected weekday is one of the visible tabs
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(weekday)) {
      setWeekday(visibleTabs[0]); // pick the first available tab
    }
  }, [visibleTabs, weekday]);

  // Ensure selected weekday is one of the visible tabs
  // Load items for the currently selected weekday (respect weekOf if chosen)
  useEffect(() => {
    if (!visibleTabs.length) return; // nothing to show yet
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const scheduledISO = nextDayISOOfThisWeek(weekday);

        const qs = weekOf
          ? `/api/menus/by-day?weekday=${weekday}&date=${nextDayISOForWeek(
              startOfWeekIso(weekOf),
              weekday
            )}`
          : `/api/menus/by-day?weekday=${weekday}&date=${scheduledISO}`;
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
    return () => {
      cancel = true;
    };
  }, [weekday, weekOf, visibleTabs]);
  // Build category list from items (unchanged)
  const categories = useMemo(() => {
    const names = new Set(
      (items || []).map((i) => i?.category?.name).filter(Boolean)
    );
    return ["All", ...names];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => {
    setActiveCategory("All");
  }, [weekday, weekOf]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items || [];
    return (items || []).filter((i) => i?.category?.name === activeCategory);
  }, [items, activeCategory]);

  // Compute label/date for the selected weekday
  const weekOfISO = weekOf ? startOfWeekIso(weekOf) : "";
  const serviceDate = weekOfISO ? dateForWeekday(weekOfISO, weekday) : null;
  const serviceLabel = weekOfISO
    ? `${WEEKDAYS[weekday]} ${new Date(serviceDate).toLocaleDateString(
        undefined,
        { month: "numeric", day: "numeric" }
      )}`
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

        {/* Weekday tabs — only days that have items and not scheduled for "today" */}
        {loadingTabs && <p className="text-center py-4">Loading days…</p>}
        {!loadingTabs && errorTabs && (
          <p className="text-center py-4 text-red-500">Error: {errorTabs}</p>
        )}
        {!loadingTabs && !errorTabs && (
          <div style={ui.group} role="tablist" aria-label="Service days">
            {visibleTabs.map((w) => {
              const selected = w === weekday;
              return (
                <button
                  key={w}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setWeekday(w)}
                  style={ui.chip(selected)}
                  onMouseEnter={(e) =>
                    Object.assign(e.currentTarget.style, ui.chipHover)
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.currentTarget.style, ui.chip(selected))
                  }
                  onFocus={(e) =>
                    Object.assign(e.currentTarget.style, {
                      ...ui.chip(selected),
                      ...ui.chipFocus,
                    })
                  }
                  onBlur={(e) =>
                    Object.assign(e.currentTarget.style, ui.chip(selected))
                  }
                  onMouseDown={(e) =>
                    Object.assign(e.currentTarget.style, {
                      ...ui.chip(selected),
                      ...ui.chipActivePress,
                    })
                  }
                  onMouseUp={(e) =>
                    Object.assign(e.currentTarget.style, ui.chip(selected))
                  }
                >
                  {WEEKDAYS[w]}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading / error */}
        {loading && <p className="text-center py-8">Loading {title}…</p>}
        {!loading && error && (
          <p className="text-center py-8 text-red-500">Error: {error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Category chips */}
            <div style={ui.group}>
              <span style={ui.subtleLabel}>Category:</span>
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    aria-pressed={active}
                    onClick={() => setActiveCategory(cat)}
                    style={ui.chip(active)}
                    onMouseEnter={(e) =>
                      Object.assign(e.currentTarget.style, ui.chipHover)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.currentTarget.style, ui.chip(active))
                    }
                    onFocus={(e) =>
                      Object.assign(e.currentTarget.style, {
                        ...ui.chip(active),
                        ...ui.chipFocus,
                      })
                    }
                    onBlur={(e) =>
                      Object.assign(e.currentTarget.style, ui.chip(active))
                    }
                    onMouseDown={(e) =>
                      Object.assign(e.currentTarget.style, {
                        ...ui.chip(active),
                        ...ui.chipActivePress,
                      })
                    }
                    onMouseUp={(e) =>
                      Object.assign(e.currentTarget.style, ui.chip(active))
                    }
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
                  serviceDate={serviceDate} // <-- now week-aware
                  serviceLabel={serviceLabel} // e.g. "Mon 10/13" or just "Mon"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
