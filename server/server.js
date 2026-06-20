import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import CONNECT_DB from "./utils/db.js"
import authRouter from "./routers/authRouter.js"
import showRouter from "./routers/showRouter.js"
import bookingRouter from "./routers/bookingRouter.js"
import userRouter from "./routers/userRouter.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,   
};

app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth",authRouter)
app.use("/api/shows",showRouter)
app.use("/api/bookings",bookingRouter)
app.use("/api/users",userRouter)
CONNECT_DB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});