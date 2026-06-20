import multer from "multer";

const errorMiddleware = (err, req, res, next) => {
  // console.error(err); // log for debugging

  // Multer file type error
  if (err instanceof multer.MulterError || (err.message && err.message.includes("Only .jpg"))) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Zod validation error
  if (err.errors) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors
    });
  }

  // Generic server error
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    errors: err.errors || []
  });
};

export default errorMiddleware;
