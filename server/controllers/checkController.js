import Booking from "../models/bookingModel.js";
import mongoose from "mongoose";

export const scanTicket = async (req, res) => {
  try {
    const { qrData, showId } = req.body;

    // 1. Ensure a show was selected by the checker
    if (!showId) {
      return res.status(400).json({
        success: false,
        message: "No show selected. Please select a show to scan tickets for.",
      });
    }

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: "QR data is required",
      });
    }

    // 2. Safely parse payload
    let payload;
    try {
      payload = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code format",
      });
    }

    const { bookingId, ticketId } = payload;

    if (!bookingId || !ticketId) {
      return res.status(400).json({
        success: false,
        message: "Missing booking ID or ticket ID in QR payload",
      });
    }

    // 3. Fetch booking to verify existence, payment status, AND show match
    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 4. Verify that the booking belongs to the current selected show
    if (booking.showId.toString() !== showId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Wrong Show! This ticket is not valid for the selected show.",
      });
    }

    // 5. Check payment status
    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: `Payment pending or invalid (Status: ${booking.paymentStatus})`,
      });
    }
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking has been cancelled",
      });
    } 
    // 6. Find target ticket inside booking array
    const ticket = booking.tickets.find((t) => t.ticketId === ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Invalid ticket ID for this booking",
      });
    }

    // 7. Check if already checked in
    if (ticket.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: "Ticket already used",
        checkedInAt: ticket.checkedInAt,
      });
    }

    // 8. Atomic Update to prevent double-scan race conditions & enforce show ID lock
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        showId: showId, // Ensures the show requirement holds during update
        "tickets.ticketId": ticketId,
        "tickets.isCheckedIn": false, // Lock guard
      },
      {
        $set: {
          "tickets.$.isCheckedIn": true,
          "tickets.$.checkedInAt": new Date(),
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: "Ticket was just scanned by another checker or show mismatch occurred",
      });
    }

    // Extract the updated ticket record
    const verifiedTicket = updatedBooking.tickets.find(
      (t) => t.ticketId === ticketId
    );

    return res.status(200).json({
      success: true,
      message: "Entry allowed",
      ticket: verifiedTicket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Get booking details and check-in status for checkers
 * @route GET /api/tickets/booking/:bookingId
 */
export const getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email phone")
      .populate("showId", "title venue date startTime");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const searchBooking = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = query.trim();
    let searchCriteria = [];

    // 1. Search by Valid MongoDB ObjectId (_id)
    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      searchCriteria.push({ _id: searchTerm });
    }

    // 2. Search by ticketId inside tickets array
    searchCriteria.push({ "tickets.ticketId": searchTerm });

    // 3. Search by transactionId if applicable
    searchCriteria.push({ transactionId: searchTerm });

    let booking = await Booking.findOne({ $or: searchCriteria })
      .populate("userId", "name email phone")
      .populate("showId", "title name venue date startTime");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found matching the provided search query",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error in searchBooking:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while searching ticket",
    });
  }
};