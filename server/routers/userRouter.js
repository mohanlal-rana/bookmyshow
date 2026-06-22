import express from "express";
import {
  beOrganizer,
  deleteUser,
  getAllUsers,
  getUserById,
  toggleUserActive,
  verifyOrganizer,
} from "../controllers/userController.js";
import {
  authenticateUser,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validateMiddleware.js";
import { organizerSchema } from "../validators/organizerValidator.js";
import fillFileNames from "../middlewares/fileMiddleware.js";
const router = express.Router();

router.get("/me", authenticateUser, async (req, res) => {
  res.status(200).json({ user: req.user });
});

//for organizer
router.put(
  "/upgrade-to-organizer",
  authenticateUser,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "govIDImage", maxCount: 1 },
  ]),
  fillFileNames,
  validate(organizerSchema), // consider renaming to organizerSchema
  beOrganizer,
);

// for admin
router.put("/verify/:id", authenticateUser, authorizeAdmin, verifyOrganizer);
router.get("/", authenticateUser, authorizeAdmin, getAllUsers);
router.put(
  "/toggle-active/:id",
  authenticateUser,
  authorizeAdmin,
  toggleUserActive,
);
router.get("/:id", authenticateUser, authorizeAdmin, getUserById);
router.delete("/:id", authenticateUser, authorizeAdmin, deleteUser);

export default router;
