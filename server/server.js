import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import CONNECT_DB from "./utils/db.js";
import path from "path";

import authRouter from "./routers/authRouter.js";
import showRouter from "./routers/showRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import userRouter from "./routers/userRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

// ================= MIDDLEWARE =================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================= ROUTES =================
app.use("/api/auth", authRouter);
app.use("/api/shows", showRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/users", userRouter);

// ================= START SERVER =================
const startServer = async () => {
  try {
    await CONNECT_DB();

    app.listen(PORT, () => {
      console.log(
        `Server is running on http://localhost:${PORT}`
      );
    });
  } catch (err) {
    console.error("DB connection failed", err);
  }
};

startServer();