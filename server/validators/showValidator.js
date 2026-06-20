import { z } from "zod";


// ================= COMMON SCHEMAS =================
const ticketTypeSchema = z.object({
  name: z.string().trim().min(2),
  price: z.number().min(0),
  quantity: z.number().min(1),
});

const artistSchema = z.object({
  name: z.string().trim().min(2),
  image: z.string().url().optional(),
});

const venueSchema = z.object({
  name: z.string().trim().min(2),
  city: z.string().trim().min(2),
  address: z.string().trim().min(5),
});


// ================= CREATE SCHEMA =================
export const showCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),

  description: z.string().trim().min(10).max(2000),

  image: z.string().url().optional(),
  bannerImage: z.string().url().optional(),

  genre: z.enum([
    "Concert",
    "Music",
    "Comedy",
    "Festival",
    "Theatre",
    "DJ Night",
    "Sports",
    "Other",
  ]),

  tags: z.array(z.string()).optional(),

  artists: z.array(artistSchema).optional(),

  date: z.coerce.date(),

  startTime: z.string(),
  endTime: z.string(),

  venue: venueSchema,

  totalTickets: z.number().min(1),

  availableTickets: z.number().min(0),

  soldTickets: z.number().min(0).optional(),

  maxTicketsPerUser: z.number().min(1).max(20).optional(),

  ticketTypes: z.array(ticketTypeSchema).min(1),

  status: z.enum([
    "draft",
    "published",
    "cancelled",
    "completed",
  ]).optional(),

  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),

  bookingDeadline: z.coerce.date().optional(),

  refundPolicy: z.string().optional(),

  qrEnabled: z.boolean().optional(),
})
.refine(
  (data) =>
    data.availableTickets <= data.totalTickets,
  {
    message:
      "Available tickets cannot exceed total tickets",
    path: ["availableTickets"],
  }
)
.refine(
  (data) =>
    new Date(data.date) > new Date(),
  {
    message:
      "Show date must be in future",
    path: ["date"],
  }
);


// ================= UPDATE SCHEMA (FIXED) =================
export const showUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().min(10).max(2000).optional(),

  image: z.string().url().optional(),

  bannerImage: z.string().url().optional(),

  genre: z.enum([
    "Concert",
    "Music",
    "Comedy",
    "Festival",
    "Theatre",
    "DJ Night",
    "Sports",
    "Other",
  ]).optional(),

  tags: z.array(z.string()).optional(),

  artists: z.array(artistSchema).optional(),

  date: z.coerce.date().optional(),

  startTime: z.string().optional(),
  endTime: z.string().optional(),

  venue: venueSchema.optional(),

  totalTickets: z.number().min(1).optional(),

  availableTickets: z.number().min(0).optional(),

  soldTickets: z.number().min(0).optional(),

  maxTicketsPerUser: z.number().min(1).max(20).optional(),

  ticketTypes: z.array(ticketTypeSchema).optional(),

  status: z.enum([
    "draft",
    "published",
    "cancelled",
    "completed",
  ]).optional(),

  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),

  bookingDeadline: z.coerce.date().optional(),

  refundPolicy: z.string().optional(),

  qrEnabled: z.boolean().optional(),
});