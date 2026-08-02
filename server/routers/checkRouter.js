import express from "express";
import {
  authenticateUser,
  authorizeChecker,
} from "../middlewares/authMiddleware.js";

import {
  scanTicket,
  getBookingStatus,
  searchBooking,
} from "../controllers/checkController.js"

const router = express.Router();

router.post(
  "/scan",
  authenticateUser,
  authorizeChecker,
  scanTicket
);

router.get(
  "/booking/:bookingId",
  authenticateUser,
  authorizeChecker,
  getBookingStatus
);

router.get("/search", authenticateUser, authorizeChecker, searchBooking);

export default router;