import express from "express";
import {
  createBooking,
  getBookingById,
  cancelBooking,
  deleteBooking,
  mockPaymentSuccess,
  getOrganizerBookings,
  getUserBookings,
  getAdminBookings,
} from "../controllers/bookingController.js";
import { authenticateUser, authorizeAdmin, authorizeOrganizer } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/",authenticateUser,createBooking);

//make payment for booking (mock)

router.post("/mock-pay/:bookingId", authenticateUser, mockPaymentSuccess);

// READ ALL
router.get("/",authenticateUser ,getUserBookings);

// READ ONE
router.get("/:id",authenticateUser, getBookingById);

// CANCEL
router.put("/cancel/:id", authenticateUser, cancelBooking);

// DELETE
router.delete("/:id", authenticateUser, deleteBooking);

//organizer can view all bookings for their events
router.get("/organizer/bookings", authenticateUser,authorizeOrganizer, getOrganizerBookings);

//admin can view all bookings for all events
router.get("/admin/bookings", authenticateUser,authorizeAdmin, getAdminBookings);

export default router;