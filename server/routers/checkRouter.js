import express from "express";
import {
  authenticateUser,
  authorizeChecker,
} from "../middlewares/authMiddleware.js";

import {
  scanTicket,
  getBookingStatus,
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

export default router;