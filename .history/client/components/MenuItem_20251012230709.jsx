// src/components/MenuSection.jsx
import { useEffect, useMemo, useState } from "react";
import MenuItem from "./MenuItem";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------- UI tokens (kept from your version) ---------- */
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

/* ---------- Helpers ---------- */
// Monday-based start-of-week ISO (YYYY-MM-DD)
function startOfWeekIso(dateStrOrNull) {
  const dt = dateStrOrNull ? new Date(dateStrOrNull) : new Date();
  dt.setHours(0, 0, 0, 0);
  const diff = (dt.getDay() + 6) % 7; // 0=Sun -> 6, 1=Mon -> 0
  dt.setDate(dt.getDate() - diff);
  return dt.toISOString().slice(0, 10);
}

// Next-day ISO for the selected tab IN THIS WEEK (tabs are Sun-based 0..6)
function nextDayISOOfThisWeek(weekdayIdx) {
  const monday = new Date(startOfWeekIso(null));
  const monIdx = (weekdayIdx + 6) % 7; // Sun->Mon remap
  const base = new Date(monday);
  base.setDate(monday.getDate() + monIdx); // base day
  base.setDate(base.getDate() + 1); // scheduled = next day
  return base.toISOString().slice(0, 10);
}

// Next-day ISO inside a chosen week (weekOfISO is that Monday)
function nextDayISOForWeek(weekOfISO, w) {
  const monday = new Date(weekOfISO);
  const monIdx = (w + 6) % 7;
  const base = new Date(monday);
  base.setDate(monday.getDate() + monIdx);
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0, 10);
}

// Compute ISO date for a weekday inside a given week (Mon-based index)
function dateForWeekday(weekOfISO, monIdx) {
  const monday = new Date(weekOfISO);
  const d = new Date(monday);
  d.setDate(monday.getDate() + monIdx);
  return d.toISOString().slice(0, 10);
}

// Next-day index (for hiding “scheduled-for today”)
const nextDayIdx = (w) => (w + 1) % 7;

/* ---------- Component ---------- */
export default function MenuSection({ title }) {
  const [weekday, setWeekday] = useState(1); // Mon default
  const [weekOf, setWeekOf] = useState(""); // "" = template mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  // Discover tabs
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [errorTabs, setErrorTabs] = useState("");
  const [daysWithItems, setDaysWithItems] = useState([]); // [0..6]

  const todayIdx = new Date().getDay();
  const currentTabLabel = WEEKDAYS[weekday];
  const weekOfISO = weekOf ? startOfWeekIso(weekOf) : "";

  /* ---- Discover which weekdays have items ---- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingTabs(true);
      setErrorTabs("");
      try {
        const results = await Promise.all(
          [...Array(7).keys()].map(async (w) => {
            const qs = weekOfISO
              ? `/api/menus/by-day?weekday=${w}&date=${nextDayISOForWeek(
                  weekOfISO,
                  w
                )}`
              : `/api/menus/by-day?weekday=${w}&date=${nextDayISOOfThisWeek(
                  w
                )}`;
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
        setDaysWithItems(results.filter((r) => r.count > 0).map((r) => r.w));
      } catch (e) {
        if (!cancel) setErrorTabs(e.message || "Failed to discover menus");
      } finally {
        if (!cancel) setLoadingTabs(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [weekOfISO]);

  /* ---- Only show days with items, hide past-in-week & “scheduled for today” ---- */
  const visibleTabs = useMemo(() => {
    const notPastThisWeek = daysWithItems.filter((w) => w >= todayIdx);
    const filtered = notPastThisWeek.filter((w) => nextDayIdx(w) !== todayIdx);
    return filtered.length ? filtered : [];
  }, [daysWithItems, todayIdx]);

  // Snap selection to a visible tab if needed
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(weekday)) {
      setWeekday(visibleTabs[0]);
    }
  }, [visibleTabs, weekday]);

  /* ---- Load items for the selected tab ---- */
  useEffect(() => {
    if (!visibleTabs.length) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = weekOfISO
          ? `/api/menus/by-day?weekday=${weekday}&date=${nextDayISOForWeek(
              weekOfISO,
              weekday
            )}`
          : `/api/menus/by-day?weekday=${weekday}&date=${nextDayISOOfThisWeek(
              weekday
            )}`;
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
  }, [weekday, weekOfISO, visibleTabs]);

  /* ---- Category chips ---- */
  const categories = useMemo(() => {
    const names = new Set(
      (items || []).map((i) => i?.category?.name).filter(Boolean)
    );
    return ["All", ...names];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => {
    setActiveCategory("All");
  }, [weekday, weekOfISO]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items || [];
    return (items || []).filter((i) => i?.category?.name === activeCategory);
  }, [items, activeCategory]);

  /* ---- Service date for card labels (weekOf label only) ---- */
  const serviceDate = weekOfISO
    ? dateForWeekday(weekOfISO, (weekday + 6) % 7) // Mon-based index
    : null;

  /* ---- Scheduled date we pass to MenuItem (actual next-day date) ---- */
  const scheduledISOThisWeek = nextDayISOOfThisWeek(weekday);
  const scheduledISOForWeek = weekOfISO
    ? nextDayISOForWeek(weekOfISO, weekday)
    : null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {title ? (
          <h2 className="text-3xl font-semibold text-center mb-8">{title}</h2>
        ) : null}

        {/* Week-of picker you already had (kept) */}
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

        {/* Weekday tabs — now driven by visibleTabs */}
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
            {!visibleTabs.length && (
              <span className="text-white/70">No menus available</span>
            )}
          </div>
        )}

        {/* Loading / error for items */}
        {loading && (
          <p className="text-center py-8">Loading {currentTabLabel}…</p>
        )}
        {!loading && error && (
          <p className="text-center py-8 text-red-500">Error: {error}</p>
        )}

        {/* Category chips */}
        {!loading && !error && !!visibleTabs.length && (
          <>
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
                  serviceDate={
                    weekOfISO ? scheduledISOForWeek : scheduledISOThisWeek
                  }
                  serviceLabel={
                    weekOfISO
                      ? `${WEEKDAYS[weekday]} ${new Date(
                          serviceDate
                        ).toLocaleDateString(undefined, {
                          month: "numeric",
                          day: "numeric",
                        })}`
                      : WEEKDAYS[weekday]
                  }
                />
              ))}
              {!filtered.length && (
                <p className="text-center col-span-full">No items.</p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
