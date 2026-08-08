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
        ticketId: { type: String, required: true },
        seatNumber: String,
        ticketType: String,
        price: Number,
        qrCode: String,
        isCheckedIn: { type: Boolean, default: false },
        checkedInAt: Date,
      },
    ],
    totalTickets: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    bookedAt: { type: Date, default: Date.now },
    // TTL Expiration Field (Defaults to 15 minutes from creation)
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
  },
  { timestamps: true },
);

// Create TTL Index: Mongo auto-deletes the document when current time > expireAt
bookingSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Booking", bookingSchema);
