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
const ESEWA_STATUS_CHECK_URL =
  "https://rc.esewa.com.np/api/epay/transaction/status/";

// Helper: HMAC SHA256 Signature
const generateEsewaSignature = (
  secretKey,
  totalAmount,
  transactionUuid,
  productCode,
) => {
  const dataString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(dataString)
    .digest("base64");
};

// ============================================================
//  HELPER: Recalculate show ticket counts from confirmed bookings
// ============================================================
export const updateShowTicketCounts = async (showId) => {
  try {
    const result = await Booking.aggregate([
      {
        $match: {
          showId: new mongoose.Types.ObjectId(showId),
          bookingStatus: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$totalTickets" },
        },
      },
    ]);

    const soldTickets = result.length > 0 ? result[0].totalSold : 0;

    const show = await Show.findById(showId);
    if (!show) {
      console.error(`Show ${showId} not found while updating ticket counts.`);
      return null;
    }

    show.soldTickets = soldTickets;
    show.availableTickets = show.totalTickets - soldTickets;
    await show.save();

    return { soldTickets, availableTickets: show.availableTickets };
  } catch (error) {
    console.error("Error updating show ticket counts:", error);
    throw error;
  }
};

// ============================================================
//  HELPER: Confirm a paid booking & generate QR tickets
//  (shared by real eSewa verification and demo mode)
// ============================================================
const confirmBookingWithTickets = async (booking, paymentInfo) => {
  const topologyType =
    mongoose.connection.getClient().topology?.description?.type;
  const isReplicaSet = topologyType && topologyType !== "Single";
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const freshBooking = await Booking.findById(booking._id).session(
      session || null,
    );
    if (!freshBooking) {
      const error = new Error("Booking record not found.");
      error.status = 404;
      throw error;
    }

    if (freshBooking.paymentStatus === "paid") {
      if (session) await session.abortTransaction();
      return { booking: freshBooking, alreadyPaid: true };
    }

    await Payment.findOneAndUpdate(
      { transactionUuid: paymentInfo.transactionUuid },
      {
        status: "completed",
        transactionCode: paymentInfo.transactionCode,
        rawGatewayResponse: paymentInfo.rawGatewayResponse,
      },
      { session: session || null },
    );

    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: freshBooking.showId,
        availableTickets: { $gte: freshBooking.totalTickets },
      },
      {
        $inc: {
          availableTickets: -freshBooking.totalTickets,
          soldTickets: freshBooking.totalTickets,
        },
      },
      { new: true, session: session || null },
    );

    if (!updatedShow) {
      if (session) await session.abortTransaction();
      const error = new Error("Tickets sold out or unavailable.");
      error.status = 400;
      throw error;
    }

    const tickets = await Promise.all(
      (freshBooking.tickets?.length
        ? freshBooking.tickets
        : Array.from({ length: freshBooking.totalTickets }, () => ({}))
      ).map(async (existingTicket) => {
        const ticketId =
          existingTicket?.ticketId || new mongoose.Types.ObjectId().toString();
        const qrPayload = JSON.stringify({
          bookingId: freshBooking._id,
          ticketId,
          showId: freshBooking.showId,
        });
        const qrCode = await QRCode.toDataURL(qrPayload);
        return {
          ...existingTicket,
          ticketId,
          qrCode,
          price: existingTicket?.price ?? updatedShow.price,
          isCheckedIn: existingTicket?.isCheckedIn ?? false,
        };
      }),
    );

    freshBooking.tickets = tickets;
    freshBooking.paymentStatus = "paid";
    freshBooking.bookingStatus = "confirmed";
    freshBooking.expireAt = undefined;

    await freshBooking.save({ session: session || null });

    if (session) await session.commitTransaction();
    await updateShowTicketCounts(freshBooking.showId);
    return { booking: freshBooking, alreadyPaid: false };
  } catch (error) {
    if (session && session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    if (session) await session.endSession();
  }
};

// ===============================
// 1. INITIATE ESEWA PAYMENT
// ===============================
export const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Booking ID." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Booking is already paid." });
    }

    const totalAmount = Math.round(booking.totalAmount);
    if (totalAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount." });
    }

    const transactionUuid = `${booking._id}-${Date.now()}`;

    const signature = generateEsewaSignature(
      ESEWA_SECRET_KEY,
      totalAmount,
      transactionUuid,
      ESEWA_PRODUCT_CODE,
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

    const dataString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
    console.log("🔵 eSewa form data:", {
      amount: esewaFormData.amount,
      total_amount: esewaFormData.total_amount,
      transaction_uuid: transactionUuid,
      signed_data_string: dataString,
      signature: signature,
      secret_key_length: ESEWA_SECRET_KEY.length,
      product_code: ESEWA_PRODUCT_CODE,
      gateway_url: ESEWA_GATEWAY_URL,
      success_url: esewaFormData.success_url,
      failure_url: esewaFormData.failure_url,
    });

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
  try {
    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment token data." });
    }

    // 1. Decode Base64 string from eSewa
    const decodedString = Buffer.from(data, "base64").toString("utf-8");
    const decoded = JSON.parse(decodedString);

    if (decoded.status !== "COMPLETE") {
      // Mark pending payment record as failed
      await Payment.findOneAndUpdate(
        { transactionUuid: decoded.transaction_uuid },
        { status: "failed", rawGatewayResponse: decoded },
      );
      return res
        .status(400)
        .json({ success: false, message: "Payment was not completed." });
    }

    // 2. HMAC Signature Check
    const fields = decoded.signed_field_names.split(",");
    const message = fields
      .map((field) => `${field}=${decoded[field]}`)
      .join(",");
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction reference." });
    }

    // 3. Status Check with eSewa servers
    const statusCheckUrl = `${ESEWA_STATUS_CHECK_URL}?product_code=${decoded.product_code}&total_amount=${decoded.total_amount}&transaction_uuid=${decoded.transaction_uuid}`;
    const statusRes = await fetch(statusCheckUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      await Payment.findOneAndUpdate(
        { transactionUuid: decoded.transaction_uuid },
        { status: "failed", rawGatewayResponse: statusData },
      );
      return res.status(400).json({
        success: false,
        message: "Transaction verification with eSewa failed.",
      });
    }

    // 4. Confirm booking & generate QR tickets
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking record not found." });
    }

    try {
      const { booking: confirmedBooking, alreadyPaid } =
        await confirmBookingWithTickets(booking, {
          transactionUuid: decoded.transaction_uuid,
          transactionCode: decoded.transaction_code,
          rawGatewayResponse: decoded,
        });

      if (alreadyPaid) {
        return res
          .status(200)
          .json({ success: true, message: "Already verified.", booking: confirmedBooking });
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully and QR tickets created.",
        booking: confirmedBooking,
      });
    } catch (confirmError) {
      return res
        .status(confirmError.status || 500)
        .json({ success: false, message: confirmError.message });
    }
  } catch (error) {
    console.error("🔴 Error in verifyEsewaPayment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 🔍 CHECK ESEWA STATUS OF LATEST PENDING PAYMENT
// ===============================
export const checkEsewaStatus = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User account not found.",
      });
    }

    const payment = await Payment.findOne({
      userId,
      status: "pending",
      paymentMethod: "esewa",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!payment) {
      return res.status(200).json({
        success: false,
        message: "No pending eSewa payment found. Create a booking and initiate payment first.",
      });
    }

    const params = new URLSearchParams({
      product_code: ESEWA_PRODUCT_CODE,
      total_amount: String(payment.amount),
      transaction_uuid: payment.transactionUuid,
    });

    const statusRes = await fetch(`${ESEWA_STATUS_CHECK_URL}?${params.toString()}`);
    const statusData = await statusRes.json();

    return res.status(200).json({
      success: true,
      payment: {
        bookingId: payment.bookingId,
        amount: payment.amount,
        transactionUuid: payment.transactionUuid,
      },
      esewaStatus: statusData,
    });
  } catch (error) {
    console.error("🔴 Error in checkEsewaStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 🎭 DEMO MODE: Simulate a successful eSewa payment
// (guarded by DEMO_MODE=true in server/.env)
// ===============================
export const demoConfirmBooking = async (req, res) => {
  try {
    if (process.env.DEMO_MODE !== "true") {
      return res.status(403).json({
        success: false,
        message: "Demo mode is disabled on the server.",
      });
    }

    const { bookingId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid Booking ID." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not your booking." });
    }

    // Reuse existing payment record if one exists, otherwise create it
    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        userId,
        paymentMethod: "esewa",
        amount: booking.totalAmount,
        status: "pending",
        transactionUuid: `${booking._id}-DEMO-${Date.now()}`,
      });
    }

    const { booking: confirmedBooking, alreadyPaid } =
      await confirmBookingWithTickets(booking, {
        transactionUuid: payment.transactionUuid,
        transactionCode: `DEMO-${Date.now()}`,
        rawGatewayResponse: { status: "COMPLETE", demoMode: true },
      });

    return res.status(200).json({
      success: true,
      message: alreadyPaid
        ? "Already verified."
        : "Demo payment confirmed and QR tickets created.",
      booking: confirmedBooking,
    });
  } catch (error) {
    console.error("🔴 Error in demoConfirmBooking:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
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

    // Normalize and validate ticket types
    const validTicketTypes = ["standard", "student"];
    const normalizedType = ticketType?.toString().toLowerCase();

    if (!showId || !totalTickets || totalTickets < 1 || !validTicketTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid showId, totalTickets, and ticketType ('standard' or 'student').",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({ success: false, message: "Invalid Show ID." });
    }

    // Fetch show pricing and general ticket availability
    const show = await Show.findById(showId)
      .select("price prices availableTickets organizerId status")
      .lean();

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    // Check shared ticket inventory
    if (show.availableTickets < totalTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${show.availableTickets} tickets remaining.`,
      });
    }

    // Determine unit price:
    // 1. Look up show.prices[normalizedType] if explicitly defined
    // 2. Otherwise compute dynamic student discount (20% off) or standard price
    const basePrice = show.price || 0;
    let pricePerTicket = show.prices?.[normalizedType];

    if (pricePerTicket === undefined) {
      pricePerTicket = normalizedType === "student" ? Math.round(basePrice * 0.8) : basePrice;
    }

    const totalAmount = pricePerTicket * totalTickets;

    // Generate individual ticket objects
    const generatedTickets = Array.from({ length: totalTickets }, () => ({
      ticketId: new mongoose.Types.ObjectId().toString(),
      ticketType: normalizedType,
      price: pricePerTicket,
      isCheckedIn: false,
    }));

    const booking = await Booking.create({
      userId,
      showId,
      organizerId: show.organizerId || null,
      totalTickets,
      totalAmount,
      paymentStatus: "pending",
      bookingStatus: "pending",
      tickets: generatedTickets,
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
        .select(
          "userId showId totalTickets totalAmount paymentStatus bookingStatus createdAt",
        )
        .populate("userId", "name email")
        .populate(
          "showId",
          "name bannerImage date venue totalTickets availableTickets soldTickets price",
        )
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

    // ✅ Fetch ALL bookings for the user – no paymentStatus filter
    const bookings = await Booking.find({ userId })
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

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // ==========================================
    // FIND BOOKING
    // ==========================================

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ==========================================
    // CHECK USER OWNERSHIP
    // ==========================================

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking",
      });
    }

    // ==========================================
    // ALREADY CANCELLED
    // ==========================================

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // ==========================================
    // 24 HOUR CANCELLATION WINDOW
    // ==========================================

    const bookingTime = new Date(booking.createdAt).getTime();

    const currentTime = Date.now();

    const hoursSinceBooking = (currentTime - bookingTime) / (1000 * 60 * 60);

    if (hoursSinceBooking > 24) {
      return res.status(400).json({
        success: false,
        message:
          "Cancellation period has expired. Cancellation is allowed only within 24 hours of booking.",
      });
    }

    // ==========================================
    // FIND SHOW
    // ==========================================

    const show = await Show.findById(booking.showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // ==========================================
    // CHECK ALREADY CHECKED-IN
    // ==========================================

    const checkedInTicket = booking.tickets?.some(
      (ticket) => ticket.isCheckedIn,
    );

    if (checkedInTicket) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled because one or more tickets have already been checked in.",
      });
    }

    // ==========================================
    // CANCEL BOOKING
    // ==========================================

    booking.bookingStatus = "cancelled";

    booking.cancelledAt = new Date();

    booking.cancellationReason = "Cancelled by user within 24 hours of booking";

    // ==========================================
    // RESTORE TICKET INVENTORY
    // ==========================================

    show.availableTickets += booking.totalTickets;

    show.soldTickets = Math.max(0, show.soldTickets - booking.totalTickets);

    await show.save();

    // ==========================================
    // PAID BOOKING
    // ==========================================

    if (booking.paymentStatus === "paid") {
      booking.refundStatus = "pending";

      booking.refundAmount = booking.totalAmount;

      booking.refundRequestedAt = new Date();

      await booking.save();

      await updateShowTicketCounts(booking.showId);

      // Find original payment
      const payment = await Payment.findOne({
        bookingId: booking._id,
        status: "completed",
      });

      if (!payment) {
        return res.status(200).json({
          success: true,
          message:
            "Booking cancelled, but payment record was not found. Refund requires manual processing.",
          booking,
        });
      }

      // Update payment refund status
      payment.refundStatus = "pending";

      payment.refundAmount = booking.totalAmount;

      payment.refundRequestedAt = new Date();

      await payment.save();

      return res.status(200).json({
        success: true,

        message:
          "Booking cancelled successfully. Refund request has been created.",

        booking,

        refund: {
          amount: booking.refundAmount,
          status: booking.refundStatus,
        },
      });
    }

    // ==========================================
    // UNPAID BOOKING
    // ==========================================

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    return res
      .status(200)
      .json({ success: true, message: "Booking deleted successfully" });
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
          searchRegex.test(b.transactionId),
      );
    }

    const totalBookingsCount = await Booking.countDocuments(query);

    // 4. Admin High-Level Dashboard Analytics Aggregation
    //    Now computes NET revenue = gross paid - total refunded amounts
    // 4. Admin High-Level Dashboard Analytics Aggregation
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          confirmedRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$bookingStatus", "confirmed"] },
                    { $eq: ["$paymentStatus", "paid"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
          cancellationFeeRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$bookingStatus", "cancelled"] },
                    {
                      $in: [
                        "$refundStatus",
                        ["pending", "processing", "processed"],
                      ],
                    },
                  ],
                },
                "$deductionAmount", // the fee you kept
                0,
              ],
            },
          },
          totalTicketsSold: {
            $sum: {
              $cond: [
                { $eq: ["$bookingStatus", "confirmed"] },
                "$totalTickets",
                0,
              ],
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
      {
        $project: {
          totalRevenue: {
            $add: ["$confirmedRevenue", "$cancellationFeeRevenue"],
          },
          totalTicketsSold: 1,
          confirmedBookings: 1,
          pendingBookings: 1,
          cancelledBookings: 1,
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
export const refundBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled bookings can be refunded.",
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid bookings can be refunded.",
      });
    }

    if (booking.refundStatus === "processed") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been refunded.",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: "completed",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    // ==========================================
    // CALCULATE REFUND AMOUNT (20% DEDUCTION)
    // ==========================================
    const deductionPercent = 20; // You can change this or make it dynamic
    const totalAmount = booking.totalAmount;
    const deductionAmount = (totalAmount * deductionPercent) / 100;
    const netRefundAmount =
      Math.round((totalAmount - deductionAmount) * 100) / 100; // round to 2 decimals

    // Store deduction details (optional)
    booking.deductionAmount = deductionAmount; // if you added the field
    booking.refundAmount = netRefundAmount; // store net refund amount

    // ==========================================
    // START REFUND (with net amount)
    // ==========================================

    booking.refundStatus = "processing";
    payment.refundStatus = "processing";

    await booking.save();
    await payment.save();

    /*
      IMPORTANT: Call payment gateway refund API with `netRefundAmount`.

      Example for eSewa:
      const gatewayResponse = await processEsewaRefund({
        transactionCode: payment.transactionCode,
        amount: netRefundAmount,   // <-- use net amount
      });
    */

    // ==========================================
    // AFTER GATEWAY CONFIRMS REFUND
    // ==========================================

    const refundTransactionId = `REFUND-${Date.now()}`;

    booking.refundStatus = "processed";
    booking.paymentStatus = "refunded";
    booking.refundedAt = new Date();
    booking.refundTransactionId = refundTransactionId;

    payment.refundStatus = "completed";
    payment.status = "refunded";
    payment.refundedAt = new Date();
    payment.refundTransactionId = refundTransactionId;

    await booking.save();
    await payment.save();

    return res.status(200).json({
      success: true,
      message: `Refund processed successfully (${deductionPercent}% deduction applied).`,
      refund: {
        originalAmount: totalAmount,
        deductionAmount,
        netRefundAmount,
        transactionId: refundTransactionId,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process refund",
    });
  }
};
