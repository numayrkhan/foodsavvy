// client/src/utils/grouping.js

/**
 * Groups items (cart lines or order items) by their serviceDate.
 * Expects items to have a `serviceDate` property (YYYY-MM-DD string).
 * Returns an object: { [dateKey]: [items...] }
 */
export function groupByServiceDate(items) {
  return (items || []).reduce((acc, item) => {
    // Handle both direct serviceDate (Cart) and nested deliveryGroup.serviceDate (Order)
    let dateKey = item.serviceDate;
    
    // If item comes from an Order with relation, it might be in item.deliveryGroup.serviceDate
    if (!dateKey && item.deliveryGroup?.serviceDate) {
      dateKey = new Date(item.deliveryGroup.serviceDate).toISOString().slice(0, 10);
    }

    if (!dateKey) {
      // Fallback for items without a specific date (shouldn't happen for main items)
      // or legacy items. We'll group them under "Unscheduled" or similar if needed,
      // but for now let's skip or put in "unknown".
      return acc;
    }

    (acc[dateKey] ||= []).push(item);
    return acc;
  }, {});
}

/**
 * Returns a sorted array of groups for display.
 * Returns: [{ dateKey, label, items: [...] }, ...]
 */
export function getOrderedGroups(items, slotsMap = {}) {
  const groups = groupByServiceDate(items);
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, groupItems]) => ({
      dateKey,
      label: labelForDateKey(dateKey),
      slot: slotsMap[dateKey] || null,
      items: groupItems,
    }));
}

/**
 * Formats a YYYY-MM-DD date key into a friendly label (e.g., "Monday, Oct 14").
 * Uses UTC noon to avoid timezone shifts.
 */
export function labelForDateKey(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
