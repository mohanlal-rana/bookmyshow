import mongoose from "mongoose";

const ShowSchema = new mongoose.Schema(
  {
    // ================= BASIC SHOW INFO =================
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    bannerImage: {
      type: String,
      default: "",
    },

    genre: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Concert",
        "Music",
        "Comedy",
        "Festival",
        "Theatre",
        "DJ Night",
        "Sports",
        "Other",
      ],
    },

    tags: [
      {
        type: String,
      },
    ],

    artists: [
      {
        name: String,
        image: String,
      },
    ],

    // ================= DATE & TIME =================
    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    // ================= VENUE =================
    venue: {
      name: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: false,
        },
      },
    },
    // ================= TICKETS =================
    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },

    availableTickets: {
      type: Number,
      required: true,
      min: 0,
    },

    soldTickets: {
      type: Number,
      default: 0,
    },

    maxTicketsPerUser: {
      type: Number,
      default: 5,
    },

        price: {
          type: Number,
          required: true,
        },

    // ================= ORGANIZER =================
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "cancelled",
        "completed",
      ],
      default: "published",
    },

    isVerified:{
      type: Boolean,
      default: false,
    },

    // ================= BOOKING INFO =================
    bookingDeadline: {
      type: Date,
    },

    // refundPolicy: {
    //   type: String,
    //   default: "No refund available",
    // },

    // ================= SECURITY =================
    qrEnabled: {
      type: Boolean,
      default: true,
    },

    // ================= ANALYTICS =================
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ================= INDEXES =================
ShowSchema.index({ name: "text", genre: "text" });


// ================= MODEL =================
const Show = mongoose.model(
  "Show",
  ShowSchema
);

export default Show;