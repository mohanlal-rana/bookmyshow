import Booking from "../models/bookingModel.js";
import Show from "../models/showModel.js";
import Payment from "../models/paymentModel.js";
import mongoose from "mongoose";
import QRCode from "qrcode";
import crypto from "crypto";

// Credentials (eSewa UAT Test Keys)
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_GATEWAY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_CHECK_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";

// Helper: HMAC SHA256 Signature
const generateEsewaSignature = (secretKey, totalAmount, transactionUuid, productCode) => {
  const dataString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", secretKey).update(dataString).digest("base64");
};

// ===============================
// 1. INITIATE ESEWA PAYMENT
// ===============================
export const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid Booking ID." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Booking is already paid." });
    }

    const totalAmount = booking.totalAmount;
    const transactionUuid = `${booking._id}-${Date.now()}`;

    const signature = generateEsewaSignature(
      ESEWA_SECRET_KEY,
      totalAmount,
      transactionUuid,
      ESEWA_PRODUCT_CODE
    );

    // Create a pending Payment record
    await Payment.create({
      bookingId: booking._id,
      userId: booking.userId,
      paymentMethod: "esewa",
      amount: totalAmount,
      status: "pending",
      transactionUuid: transactionUuid,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const esewaFormData = {
      amount: String(totalAmount),
      tax_amount: "0",
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${clientUrl}/payment/success`,
      failure_url: `${clientUrl}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
      action_url: ESEWA_GATEWAY_URL,
    };

    return res.status(200).json({
      success: true,
      esewaFormData,
    });
  } catch (error) {
    console.error("🔴 Error in initiateEsewaPayment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 2. VERIFY ESEWA PAYMENT & GENERATE TICKETS
// ===============================
export const verifyEsewaPayment = async (req, res) => {
  let session = null;

  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: "Missing payment token data." });
    }

    // 1. Decode Base64 string from eSewa
    const decodedString = Buffer.from(data, "base64").toString("utf-8");
    const decoded = JSON.parse(decodedString);

    if (decoded.status !== "COMPLETE") {
      // Mark pending payment record as failed
      await Payment.findOneAndUpdate(
        { transactionUuid: decoded.transaction_uuid },
        { status: "failed", rawGatewayResponse: decoded }
      );
      return res.status(400).json({ success: false, message: "Payment was not completed." });
    }

    // 2. HMAC Signature Check
    const fields = decoded.signed_field_names.split(",");
    const message = fields.map((field) => `${field}=${decoded[field]}`).join(",");
    const expectedSignature = crypto
      .createHmac("sha256", String(ESEWA_SECRET_KEY))
      .update(message)
      .digest("base64");

    if (decoded.signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed. Tampering detected.",
      });
    }

    // Extract booking ID
    const bookingId = decoded.transaction_uuid.split("-")[0];
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid transaction reference." });
    }

    // 3. Status Check with eSewa servers
    const statusCheckUrl = `${ESEWA_STATUS_CHECK_URL}?product_code=${decoded.product_code}&total_amount=${decoded.total_amount}&transaction_uuid=${decoded.transaction_uuid}`;
    const statusRes = await fetch(statusCheckUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      await Payment.findOneAndUpdate(
        { transactionUuid: decoded.transaction_uuid },
        { status: "failed", rawGatewayResponse: statusData }
      );
      return res.status(400).json({ success: false, message: "Transaction verification with eSewa failed." });
    }

    // Handle DB Session
    const topologyType = mongoose.connection.getClient().topology?.description?.type;
    const isReplicaSet = topologyType && topologyType !== "Single";

    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const booking = await Booking.findById(bookingId).session(session || null);
    if (!booking) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Booking record not found." });
    }

    // Idempotency check
    if (booking.paymentStatus === "paid") {
      if (session) await session.abortTransaction();
      return res.status(200).json({ success: true, message: "Already verified.", booking });
    }

    // 4. Update Payment Document to Completed
    await Payment.findOneAndUpdate(
      { transactionUuid: decoded.transaction_uuid },
      {
        status: "completed",
        transactionCode: decoded.transaction_code,
        rawGatewayResponse: decoded,
      },
      { session: session || null }
    );

    // 5. Atomic Show inventory update
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
      { new: true, session: session || null }
    );

    if (!updatedShow) {
      if (session) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Tickets sold out or unavailable." });
    }

    // 6. Generate Tickets and QR Codes
    const ticketPromises = Array.from({ length: booking.totalTickets }, async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const qrPayload = JSON.stringify({
        bookingId: booking._id,
        ticketId,
        showId: booking.showId,
      });

      const qrCode = await QRCode.toDataURL(qrPayload);

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
    booking.expireAt = undefined;

    await booking.save({ session: session || null });

    if (session) await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and QR tickets created.",
      booking,
    });
  } catch (error) {
    if (session && session.inTransaction()) await session.abortTransaction();
    console.error("🔴 Error in verifyEsewaPayment:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (session) await session.endSession();
  }
};

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
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User account not found.",
      });
    }

    // Only fetch bookings where paymentStatus is "paid"
    const bookings = await Booking.find({ 
      userId, 
      paymentStatus: "paid" 
    })
      .populate("showId", "name title date venue price bannerImage")
      .sort({ createdAt: -1 })
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

//admin can view all bookings for all events

export const getAdminBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      paymentStatus,
      bookingStatus,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // 1. Filter by Statuses
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (bookingStatus) query.bookingStatus = bookingStatus;

    // 2. Filter by Date Range
    if (startDate || endDate) {
      query.bookedAt = {};
      if (startDate) query.bookedAt.$gte = new Date(startDate);
      if (endDate) query.bookedAt.$lte = new Date(endDate);
    }

    // 3. Search Filter (Matches Transaction ID directly)
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { "tickets.ticketId": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute Main Query with Populates
    let bookings = await Booking.find(query)
      .populate("userId", "name email phone profileImage")
      .populate("showId", "name date venue price bannerImage genre")
      .populate("organizerId", "name email organizer.organizationName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Additional Memory Search across populated fields (User/Show)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      bookings = bookings.filter(
        (b) =>
          searchRegex.test(b.userId?.name) ||
          searchRegex.test(b.userId?.email) ||
          searchRegex.test(b.showId?.name) ||
          searchRegex.test(b.transactionId)
      );
    }

    const totalBookingsCount = await Booking.countDocuments(query);

    // 4. Admin High-Level Dashboard Analytics Aggregation
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0],
            },
          },
          totalTicketsSold: {
            $sum: {
              $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, "$totalTickets", 0],
            },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "pending"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalRevenue: 0,
        totalTicketsSold: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
      },
      pagination: {
        total: totalBookingsCount,
        page: pageNum,
        pages: Math.ceil(totalBookingsCount / limitNum),
        limit: limitNum,
      },
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};