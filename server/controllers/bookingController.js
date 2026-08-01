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
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User account not found.",
      });
    }

    if (!showId || !totalTickets || totalTickets < 1) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid showId and ticket count.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({ success: false, message: "Invalid Show ID." });
    }

    // Lean query for read efficiency
    const show = await Show.findById(showId).select("price availableTickets organizerId status").lean();
    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    if (show.availableTickets < totalTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${show.availableTickets} tickets remaining.`,
      });
    }

    const pricePerTicket = show.price || 0;
    const totalAmount = pricePerTicket * totalTickets;

    const booking = await Booking.create({
      userId,
      showId,
      organizerId: show.organizerId || null,
      totalTickets,
      totalAmount,
      paymentStatus: "pending",
      bookingStatus: "pending",
      tickets: [],
    });

    return res.status(201).json({
      success: true,
      message: "Booking created (pending payment)",
      booking,
    });
  } catch (error) {
    console.error("🔴 Error in createBooking:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 💳 MOCK PAYMENT SUCCESS (Atomic Updates)
// ===============================
export const mockPaymentSuccess = async (req, res) => {
  let session = null;

  try {
    // Only start transactions if connected to a replica set
    const isReplicaSet = mongoose.connection.getClient().topology?.description?.type !== 'Single';
    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      if (session) {
        await session.endSession();
      }
      return res.status(400).json({ success: false, message: "Invalid Booking ID." });
    }

    const bookingQuery = Booking.findById(bookingId);
    if (session) bookingQuery.session(session);
    const booking = await bookingQuery;

    if (!booking) {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.paymentStatus === "paid") {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      return res.status(400).json({ success: false, message: "Booking is already paid." });
    }

    const updateOptions = { new: true };
    if (session) updateOptions.session = session;

    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: booking.showId,
        availableTickets: { $gte: booking.totalTickets },
      },
      {
        $inc: {
          availableTickets: -booking.totalTickets,
          soldTickets: booking.totalTickets,
        },
      },
      updateOptions
    );

    if (!updatedShow) {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      return res.status(400).json({
        success: false,
        message: "Tickets sold out or unavailable.",
      });
    }

    const ticketPromises = Array.from({ length: booking.totalTickets }, async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const qrPayload = {
        bookingId: booking._id,
        ticketId,
        showId: booking.showId,
      };
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrPayload));

      return {
        ticketId,
        price: updatedShow.price,
        qrCode,
        isCheckedIn: false,
      };
    });

    const tickets = await Promise.all(ticketPromises);

    booking.tickets = tickets;
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";
    
    if (session) {
      await booking.save({ session });
      await session.commitTransaction();
      await session.endSession();
    } else {
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful and tickets generated.",
      booking,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    console.error("🔴 Error in mockPaymentSuccess:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 📦 GET ORGANIZER BOOKINGS & ANALYTICS
// ===============================
export const getOrganizerBookings = async (req, res) => {
  try {
    const organizerId = req.user?._id || req.user?.id;
    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Organizer account missing.",
      });
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizerId);

    // Optimized aggregate query for instant KPIs + breakdown
    const [stats, bookings] = await Promise.all([
      Booking.aggregate([
        { $match: { organizerId: orgObjectId, paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalTicketsSold: { $sum: "$totalTickets" },
          },
        },
      ]),

      Booking.find({ organizerId: orgObjectId })
        .select("userId showId totalTickets totalAmount paymentStatus bookingStatus createdAt")
        .populate("userId", "name email")
        .populate("showId", "name bannerImage date venue totalTickets availableTickets soldTickets price")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue: stats[0]?.totalRevenue || 0,
        totalTicketsSold: stats[0]?.totalTicketsSold || 0,
      },
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Standard helper queries (Lean optimized)
export const getUserBookings = async (req, res) => {
  try {
    // Extract userId attached by your auth middleware
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User account not found.",
      });
    }

    // Filter bookings matching this specific userId
    const bookings = await Booking.find({ userId })
      .populate("showId", "name date venue price bannerImage")
      .sort({ createdAt: -1 }) // Sort newest first
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("showId")
      .lean();

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking already cancelled" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Paid bookings cannot be auto-cancelled." });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    return res.status(200).json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    return res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};