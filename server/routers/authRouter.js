import express from "express";
import { login, logout, signup } from "../controllers/authController.js";
import validate from "../middlewares/validateMiddleware.js";
import { loginSchema, signUpSchema } from "../validators/authValidator.js";

const router = express.Router();

router.post("/signup",validate(signUpSchema),signup);
router.post("/login",validate(loginSchema),login);
router.post("/logout",logout);

export default router;