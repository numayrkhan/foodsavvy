const { z } = require("zod");

// -------------------------------
// SLICE B2: GENERATE SERVICE DAYS
// -------------------------------
const GenerateServiceDaysBody = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  serviceOffsetDays: z.coerce.number().int().min(0).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default( [0,1,2,3,4,5,6] ),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

const GenerateServiceDaysResponse = z.object({
  summary: z.object({
    totalProcessed: z.number(),
    created: z.number(),
    skipped: z.number(),
  }),
  details: z.array(z.object({
    menuDate: z.string().datetime(),
    serviceDate: z.string().datetime(), // NEVER NULL (matches your earlier fix)
    status: z.enum(["CREATED", "SKIPPED_EXISTS", "SKIPPED_FILTER"]),
    id: z.number().nullable(),
  })),
});

// -------------------------------
// SLICE B5: UPDATE SERVICE DAY
// -------------------------------
const UpdateServiceDayParams = z.object({
  serviceDayId: z.coerce.number().int().positive(),
});

const UpdateServiceDayBody = z.object({
  isPublished: z.boolean().optional(),
  isClosed: z.boolean().optional(),
  closedReason: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  orderingCutoffAt: z.string().datetime().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Request body must contain at least one field to update",
  path: [],
});

const UpdateServiceDayResponse = z.object({
  id: z.number(),
  menuDate: z.string().datetime(),
  serviceDate: z.string().datetime(),
  label: z.string().nullable(),
  isPublished: z.boolean(),
  isClosed: z.boolean(),
  closedReason: z.string().nullable(),
  orderingCutoffAt: z.string().datetime().nullable(),
});

module.exports = {
  GenerateServiceDaysBody,
  GenerateServiceDaysResponse,
  UpdateServiceDayParams,
  UpdateServiceDayBody,
  UpdateServiceDayResponse,
};
