import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  cancelBooking,
  deleteBooking,
  mockPaymentSuccess,
} from "../controllers/bookingController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/",authenticateUser,createBooking);

//make payment for booking (mock)

router.post("/mock-pay/:bookingId", authenticateUser, mockPaymentSuccess);

// READ ALL
router.get("/",authenticateUser ,getAllBookings);

// READ ONE
router.get("/:id",authenticateUser, getBookingById);

// CANCEL
router.put("/cancel/:id", authenticateUser, cancelBooking);

// DELETE
router.delete("/:id", authenticateUser, deleteBooking);

export default router;