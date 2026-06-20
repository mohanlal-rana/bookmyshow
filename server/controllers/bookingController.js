import Booking from "../models/bookingModel.js";
import Show from "../models/showModel.js";
import mongoose from "mongoose";
import QRCode from "qrcode";


// ===============================
// 🎫 CREATE BOOKING
// ===============================
export const createBooking = async (req, res) => {
  try {
    const { showId, ticketType, totalTickets } = req.body;
    const userId = req.user._id;

    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    const ticketInfo = show.ticketTypes.find(
      (t) => t.name === ticketType
    );

    if (!ticketInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket type",
      });
    }

    // ⚠️ ONLY CHECK availability (NO deduction)
    if (ticketInfo.quantity < totalTickets) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets available",
      });
    }

    const totalAmount = ticketInfo.price * totalTickets;

    const booking = await Booking.create({
      userId,
      showId,
      organizerId: show.organizerId,
      totalTickets,
      totalAmount,
      ticketType,
      paymentStatus: "pending",
      bookingStatus: "pending",
      tickets: [],
    });

    res.status(201).json({
      success: true,
      message: "Booking created (pending payment)",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const mockPaymentSuccess = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const show = await Show.findById(booking.showId);

    const ticketInfo = show.ticketTypes.find(
      (t) => t.name === booking.ticketType
    );

    // ⚠️ Re-check availability (important for concurrency)
    if (ticketInfo.quantity < booking.totalTickets) {
      return res.status(400).json({
        message: "Tickets no longer available",
      });
    }

    // ✅ NOW deduct seats (ONLY after payment)
    ticketInfo.quantity -= booking.totalTickets;
    show.availableSeats -= booking.totalTickets;
    await show.save();

    // ✅ Generate QR tickets
    const tickets = [];

    for (let i = 0; i < booking.totalTickets; i++) {
      const ticketId = new mongoose.Types.ObjectId().toString();

      const qrPayload = {
        bookingId: booking._id,
        ticketId,
        showId: booking.showId,
      };

      const qrCode = await QRCode.toDataURL(
        JSON.stringify(qrPayload)
      );

      tickets.push({
        seatNumber: null,
        ticketType: booking.ticketType,
        price: ticketInfo.price,
        qrCode,
        isCheckedIn: false,
      });
    }

    booking.tickets = tickets;
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";

    await booking.save();

    res.json({
      success: true,
      message: "Payment successful (mock)",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===============================
// 📦 GET ALL BOOKINGS
// ===============================
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("showId", "title date venue")
      .populate("organizerId", "name");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// 🎟️ GET SINGLE BOOKING
// ===============================
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("showId")
      .populate("organizerId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// ❌ CANCEL BOOKING
// ===============================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Already cancelled",
      });
    }

    // ❌ If paid → block for now (future refund system)
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Refund system not implemented yet",
      });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===============================
// 🗑️ DELETE BOOKING
// ===============================
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};