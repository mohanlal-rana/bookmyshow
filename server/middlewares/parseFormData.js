export const parseFormData = (req, res, next) => {
  try {
    // 1. Bridge Multer to Zod
    // If files were uploaded, put them into req.body.images so the schema can validate them
    if (req.files && Array.isArray(req.files)) {
      req.body.images = req.files;
    } else {
      // If no files, set to undefined (or empty array) so Zod triggers the .min(1) error
      req.body.images = undefined;
    }

    // 2. Parse JSON strings (Address & Location)
    if (req.body.address && typeof req.body.address === "string") {
      req.body.address = JSON.parse(req.body.address);
    }

    if (req.body.location && typeof req.body.location === "string") {
      req.body.location = JSON.parse(req.body.location);
    }

    // 3. Handle Features array
    // Multer creates a string if one item is sent, or an array if multiple are sent.
    // This ensures it's ALWAYS an array for Zod.
    if (req.body.features) {
      if (!Array.isArray(req.body.features)) {
        req.body.features = [req.body.features].filter(Boolean);
      }
    } else {
      req.body.features = [];
    }

    next();
  } catch (err) {
    return res.status(400).json({
      errors: [{ field: "form", message: "Invalid data format" }],
    });
  }
};