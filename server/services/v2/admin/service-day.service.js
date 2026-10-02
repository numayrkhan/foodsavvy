const prisma = require("../../../db");

/**
 * Enforce Noon UTC Strategy for ServiceDay anchor dates.
 */
function normalizeToNoonUTC(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

/**
 * Slice B2: Bulk Generate ServiceDays
 * - Always returns serviceDate as an ISO string (never null)
 */
const generate = async ({ startDate, endDate, serviceOffsetDays, daysOfWeek }) => {
  const start = normalizeToNoonUTC(startDate);
  const end = normalizeToNoonUTC(endDate);

  const results = [];
  const stats = { totalProcessed: 0, created: 0, skipped: 0 };

  const current = new Date(start);

  while (current <= end) {
    stats.totalProcessed++;

    const menuDate = new Date(current);
    menuDate.setUTCHours(12, 0, 0, 0);

    const serviceDate = new Date(menuDate);
    serviceDate.setUTCDate(serviceDate.getUTCDate() + serviceOffsetDays);

    const dayIndex = menuDate.getUTCDay();

    // Filter
    if (!daysOfWeek.includes(dayIndex)) {
      stats.skipped++;
      results.push({
        menuDate: menuDate.toISOString(),
        serviceDate: serviceDate.toISOString(),
        status: "SKIPPED_FILTER",
        id: null,
      });
      current.setUTCDate(current.getUTCDate() + 1);
      continue;
    }

    // Existence check by unique serviceDate
    const existing = await prisma.serviceDay.findUnique({
      where: { serviceDate },
      select: { id: true },
    });

    if (existing) {
      stats.skipped++;
      results.push({
        menuDate: menuDate.toISOString(),
        serviceDate: serviceDate.toISOString(),
        status: "SKIPPED_EXISTS",
        id: existing.id,
      });
    } else {
      const created = await prisma.serviceDay.create({
        data: {
          menuDate,
          serviceDate,
          isPublished: false,
          isClosed: false,
          closedReason: null,
          orderingCutoffAt: null,
          label: null,
        },
        select: { id: true },
      });

      stats.created++;
      results.push({
        menuDate: menuDate.toISOString(),
        serviceDate: serviceDate.toISOString(),
        status: "CREATED",
        id: created.id,
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { summary: stats, details: results };
};

/**
 * Slice B5: Update a single ServiceDay
 */
const updateServiceDay = async (serviceDayId, body) => {
  const existing = await prisma.serviceDay.findUnique({
    where: { id: serviceDayId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error(`ServiceDay ${serviceDayId} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  // Only update provided keys (supports false/null correctly)
  const updateData = {};

  if ("isPublished" in body) updateData.isPublished = body.isPublished;
  if ("isClosed" in body) updateData.isClosed = body.isClosed;
  if ("label" in body) updateData.label = body.label;
  if ("closedReason" in body) updateData.closedReason = body.closedReason;

  // If explicitly reopening and closedReason not provided, clear it
  if ("isClosed" in body && body.isClosed === false && !("closedReason" in body)) {
    updateData.closedReason = null;
  }

  if ("orderingCutoffAt" in body) {
    updateData.orderingCutoffAt = body.orderingCutoffAt
      ? new Date(body.orderingCutoffAt)
      : null;
  }

  const updated = await prisma.serviceDay.update({
    where: { id: serviceDayId },
    data: updateData,
    select: {
      id: true,
      menuDate: true,
      serviceDate: true,
      label: true,
      isPublished: true,
      isClosed: true,
      closedReason: true,
      orderingCutoffAt: true,
    },
  });

  return {
    ...updated,
    menuDate: updated.menuDate.toISOString(),
    serviceDate: updated.serviceDate.toISOString(),
    orderingCutoffAt: updated.orderingCutoffAt ? updated.orderingCutoffAt.toISOString() : null,
  };
};

module.exports = {
  generate,
  updateServiceDay,
  normalizeToNoonUTC,
};
