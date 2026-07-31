import { z } from "zod";

// ================= COMMON SCHEMAS =================
const artistSchema = z.object({
  name: z.string().trim().min(2, "Artist name must be at least 2 characters"),
  image: z.string().optional(),
});

const venueSchema = z.object({
  name: z.string().trim().min(2, "Venue name is required"),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
});

// ================= CREATE SCHEMA =================
export const showCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),

    bannerImage: z.string().optional(),

    genre: z.enum(
      [
        "Concert",
        "Music",
        "Comedy",
        "Festival",
        "Theatre",
        "DJ Night",
        "Sports",
        "Other",
      ],
      { required_error: "Genre is required" }
    ),

    tags: z.array(z.string()).optional().default([]),

    artists: z.array(artistSchema).optional().default([]),

    date: z.coerce.date({ required_error: "Date is required" }),

    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),

    venue: venueSchema,

    price: z.coerce
      .number({ invalid_type_error: "Price must be a valid number" })
      .min(0, "Price cannot be negative"),

    totalTickets: z.coerce
      .number({ invalid_type_error: "Total tickets must be a number" })
      .min(1, "Total tickets must be at least 1"),

    availableTickets: z.coerce
      .number({ invalid_type_error: "Available tickets must be a number" })
      .min(0, "Available tickets cannot be negative"),

    soldTickets: z.coerce.number().min(0).optional().default(0),

    maxTicketsPerUser: z.coerce.number().min(1).max(20).optional().default(5),

    status: z
      .enum(["draft", "published", "cancelled", "completed"])
      .optional()
      .default("published"),

    bookingDeadline: z.coerce.date().optional(),

    refundPolicy: z.string().optional().default("No refund available"),

    qrEnabled: z.boolean().optional().default(true),
  })
  .refine((data) => data.availableTickets <= data.totalTickets, {
    message: "Available tickets cannot exceed total tickets",
    path: ["availableTickets"],
  })
  .refine((data) => new Date(data.date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Show date cannot be in the past",
    path: ["date"],
  });

// ================= UPDATE SCHEMA =================
export const showUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().min(10).max(2000).optional(),

  bannerImage: z.string().optional(),

  genre: z
    .enum([
      "Concert",
      "Music",
      "Comedy",
      "Festival",
      "Theatre",
      "DJ Night",
      "Sports",
      "Other",
    ])
    .optional(),

  tags: z.array(z.string()).optional(),

  artists: z.array(artistSchema).optional(),

  date: z.coerce.date().optional(),

  startTime: z.string().optional(),
  endTime: z.string().optional(),

  venue: venueSchema.optional(),

  price: z.coerce.number().min(0).optional(),

  totalTickets: z.coerce.number().min(1).optional(),

  availableTickets: z.coerce.number().min(0).optional(),

  soldTickets: z.coerce.number().min(0).optional(),

  maxTicketsPerUser: z.coerce.number().min(1).max(20).optional(),

  status: z
    .enum(["draft", "published", "cancelled", "completed"])
    .optional(),

  bookingDeadline: z.coerce.date().optional(),

  refundPolicy: z.string().optional(),

  qrEnabled: z.boolean().optional(),
});