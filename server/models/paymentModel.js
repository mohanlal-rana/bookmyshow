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
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    // eSewa Specific Details
    transactionUuid: {
      type: String,
      required: true,
      unique: true,
    },
    transactionCode: {
      type: String, // eSewa's transaction_code returned after success
      sparse: true,
    },
    rawGatewayResponse: {
      type: Object, // Stores decoded JSON payload from eSewa verification
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);