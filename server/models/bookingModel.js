import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tickets: [
      {
        ticketId: {
          type: String,
          required: true,
        },

        seatNumber: String,

        ticketType: String,

        price: Number,

        qrCode: String,

        isCheckedIn: {
          type: Boolean,
          default: false,
        },

        checkedInAt: Date,
      },
    ],

    totalTickets: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
    },

    transactionId: {
      type: String,
    },

    // ==========================================
    // BOOKING STATUS
    // ==========================================

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    bookedAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // TTL
    // ==========================================

    // Temporary expiration time for unpaid
    // pending bookings.
    //
    // This does NOT mean the booking will always
    // be deleted after 10 minutes because the TTL
    // index below is a PARTIAL TTL index.
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },

    // ==========================================
    // REFUND
    // ==========================================

    refundStatus: {
      type: String,
      enum: ["pending", "processing", "processed", "failed", "none"],
      default: "none",
    },

    refundAmount: {
      type: Number,
      default: 0,
    },
// In bookingSchema
deductionAmount: { type: Number, default: 0 }, // 20% cancellation fee
    refundRequestedAt: {
      type: Date,
    },

    refundedAt: {
      type: Date,
    },

    refundTransactionId: {
      type: String,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// TTL INDEX
// ==========================================
//
// ONLY delete bookings that are:
// bookingStatus = pending
// AND
// paymentStatus = pending
//
// Paid/confirmed/cancelled/refunded bookings
// will NOT be automatically deleted.
//

bookingSchema.index(
  { expireAt: 1 },
  {
    expireAfterSeconds: 0,

    partialFilterExpression: {
      bookingStatus: "pending",
      paymentStatus: "pending",
    },
  },
);

export default mongoose.model("Booking", bookingSchema);
