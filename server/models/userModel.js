import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // hidden by default
    },

    phone: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    // ================= ROLE SYSTEM =================
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },

    // ================= SAVED EVENTS =================
    savedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    // ================= BOOKINGS =================
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],

    // ================= ORGANIZER INFO =================
    organizer: {
      organizationName: {
        type: String,
      },

      address: {
        type: String,
      },

      website: {
        type: String,
      },

      phone: {
        type: String,
      },

      description: {
        type: String,
      },

      govIDType: {
        type: String,
      },

      govIDNumber: {
        type: String,
      },

      govIDImage: {
        type: String,
      },

      isVerified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: {
        type: Date,
      },
    },

    // ================= AUTH =================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
    },

    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },

    // ================= ACCOUNT STATUS =================
    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// ================= HASH PASSWORD =================
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();
  } catch (error) {
    next(error);
  }
});


// ================= COMPARE PASSWORD =================
UserSchema.methods.comparePassword =
  async function (password) {
    return await bcrypt.compare(
      password,
      this.password
    );
  };


// ================= GENERATE JWT =================
UserSchema.methods.generateToken =
  function () {
    return jwt.sign(
      {
        userId: this._id,
        role: this.role,
        email: this.email,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
  };


// ================= UPDATE LAST LOGIN =================
UserSchema.methods.updateLastLogin =
  async function () {
    this.lastLogin = new Date();
    await this.save();
  };


// ================= MODEL =================
const User = mongoose.model(
  "User",
  UserSchema
);

export default User;