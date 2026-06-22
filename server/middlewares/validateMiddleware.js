import { ZodError } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    const body = {
      ...req.body,

      // convert numbers
      totalTickets: Number(req.body.totalTickets),
      availableTickets: Number(req.body.availableTickets),
      maxTicketsPerUser: Number(req.body.maxTicketsPerUser),

      // convert date
      date: req.body.date ? new Date(req.body.date) : undefined,

      // parse JSON fields
      venue: req.body.venue
        ? JSON.parse(req.body.venue)
        : undefined,

      tags: req.body.tags
        ? JSON.parse(req.body.tags)
        : undefined,

      artists: req.body.artists
        ? JSON.parse(req.body.artists)
        : undefined,

      ticketTypes: req.body.ticketTypes
        ? JSON.parse(req.body.ticketTypes)
        : undefined,
    };

    schema.parse(body);

    req.body = body;

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