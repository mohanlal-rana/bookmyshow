import { ZodError } from "zod";

const validate = (schema) => async (req, res, next) => {
  try {
    // 1. Convert numbers only if they exist in req.body
    const body = {
      ...req.body,
    };

    if (req.body.totalTickets !== undefined) {
      body.totalTickets = Number(req.body.totalTickets);
    }
    if (req.body.availableTickets !== undefined) {
      body.availableTickets = Number(req.body.availableTickets);
    }
    if (req.body.maxTicketsPerUser !== undefined) {
      body.maxTicketsPerUser = Number(req.body.maxTicketsPerUser);
    }

    // Convert dates if provided
    if (req.body.date) {
      body.date = new Date(req.body.date);
    }

    // Parse JSON stringified fields safely
    const jsonFields = ["venue", "tags", "artists", "ticketTypes"];
    jsonFields.forEach((field) => {
      if (typeof req.body[field] === "string") {
        try {
          body[field] = JSON.parse(req.body[field]);
        } catch {
          // If JSON parse fails, let Zod catch it as an invalid format
        }
      }
    });

    // 2. Evaluate schema dynamically if a schema factory function was passed
    const activeSchema =
      typeof schema === "function" ? schema(req.user?._id) : schema;

    // 3. Use parseAsync to support async Zod checks (e.g. database uniqueness)
    const validatedData = await activeSchema.parseAsync(body);

    // Replace req.body with clean validated data
    req.body = validatedData;

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "validation failed",
        errors: err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    next(err);
  }
};

export default validate;