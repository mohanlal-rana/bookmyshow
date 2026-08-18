import express from "express";
import {
  createBooking,
  getBookingById,
  cancelBooking,
  deleteBooking,
  getOrganizerBookings,
  getUserBookings,
  getAdminBookings,
  initiateEsewaPayment,
  verifyEsewaPayment,
  checkEsewaStatus,
  demoConfirmBooking,
  refundBooking,
} from "../controllers/bookingController.js";
import { authenticateUser, authorizeAdmin, authorizeOrganizer } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/",authenticateUser,createBooking);
router.post("/esewa-initiate/:bookingId", authenticateUser, initiateEsewaPayment);
router.post("/esewa-verify", authenticateUser, verifyEsewaPayment);
router.get("/esewa-status", authenticateUser, checkEsewaStatus);
router.post("/demo-confirm/:bookingId", authenticateUser, demoConfirmBooking);

// READ ALL
router.get("/",authenticateUser ,getUserBookings);

// READ ONE
router.get("/:id",authenticateUser, getBookingById);

// CANCEL
router.put("/:id/cancel", authenticateUser, cancelBooking);

// DELETE
router.delete("/:id", authenticateUser, deleteBooking);

//organizer can view all bookings for their events
router.get("/organizer/bookings", authenticateUser,authorizeOrganizer, getOrganizerBookings);

//admin can view all bookings for all events
router.get("/admin/bookings", authenticateUser,authorizeAdmin, getAdminBookings);
router.put(
  "/admin/:id/refund",
  authenticateUser,
  authorizeAdmin,
  refundBooking
);

export default router;