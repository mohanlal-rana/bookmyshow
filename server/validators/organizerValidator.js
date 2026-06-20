import { z } from "zod";

export const organizerSchema = z.object({
  body: z.object({
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name cannot exceed 100 characters"),

    address: z
      .string()
      .min(3, "Address is required")
      .max(200, "Address cannot exceed 200 characters"),

    website: z
      .string()
      .url("Invalid website URL")
      .optional()
      .or(z.literal("")),

    phone: z
      .string()
      .min(7, "Phone number is too short")
      .max(20, "Phone number is too long"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description cannot exceed 1000 characters"),

    govIDType: z
      .string()
      .min(1, "Government ID type is required"),

    govIDNumber: z
      .string()
      .min(3, "Government ID number is required")
      .max(50, "Government ID number is too long"),
  }),
});