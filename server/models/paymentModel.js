import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["esewa", "khalti", "cash"],
      default: "esewa",
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    transactionUuid: {
      type: String,
      required: true,
      unique: true,
    },

    transactionCode: {
      type: String,
      sparse: true,
    },

    // ==========================================
    // REFUND
    // ==========================================

    refundStatus: {
      type: String,
      enum: [
        "none",
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "none",
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundTransactionId: {
      type: String,
      default: null,
    },

    refundRequestedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    rawGatewayResponse: {
      type: Object,
    },

    rawRefundResponse: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", paymentSchema);