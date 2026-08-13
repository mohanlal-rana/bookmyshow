import { z } from "zod";
import User from "../models/userModel.js";

export const createOrganizerSchema = (currentUserId) => {
  return z
    .object({
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

      govIDType: z.string().min(1, "Government ID type is required"),

      govIDNumber: z
        .string()
        .min(3, "Government ID number is required")
        .max(50, "Government ID number is too long"),
    })
    .superRefine(async (data, ctx) => {
      // Build dynamic $or array so we don't query for empty websites
      const orConditions = [
        { "organizer.organizationName": data.organizationName },
        { "organizer.phone": data.phone },
        { "organizer.govIDNumber": data.govIDNumber },
      ];

      // Only check website uniqueness if user provided a non-empty string
      if (data.website && data.website.trim() !== "") {
        orConditions.push({ "organizer.website": data.website });
      }

      // Single database call to check for any conflicts
      const existingUser = await User.findOne({
        _id: { $ne: currentUserId }, // Exclude current user
        $or: orConditions,
      });

      if (existingUser && existingUser.organizer) {
        const org = existingUser.organizer;

        if (org.organizationName?.toLowerCase() === data.organizationName.toLowerCase()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Organization name is already taken",
            path: ["organizationName"],
          });
        }

        if (data.website && org.website === data.website) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Website URL is already in use by another organization",
            path: ["website"],
          });
        }

        if (org.phone === data.phone) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Phone number is already registered to another account",
            path: ["phone"],
          });
        }

        if (org.govIDNumber === data.govIDNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Government ID number is already registered",
            path: ["govIDNumber"],
          });
        }
      }
    });
};