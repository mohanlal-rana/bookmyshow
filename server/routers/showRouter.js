import express from "express";
import { createShow, getShows, getShowById, updateShow, deleteShow, getShowsByOrganizer, verifyShow, getShowsByAdmin, getShowByAdminId, deleteShowByAdmin } from "../controllers/showController.js";
import { authenticateUser, authorizeOrganizer } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validateMiddleware.js";
import { showCreateSchema, showUpdateSchema } from "../validators/showValidator.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

//public routes
router.get("/", getShows);
router.get("/:id", getShowById);

//organizer routes

router.post("/",authenticateUser,authorizeOrganizer,upload.single("image"), validate(showCreateSchema), createShow);
router.get("/organizer/getShows", authenticateUser, authorizeOrganizer, getShowsByOrganizer);
router.put("/:id",authenticateUser, authorizeOrganizer, validate(showUpdateSchema), updateShow);
router.delete("/:id", authenticateUser, authorizeOrganizer, deleteShow);


//admin routes

router.get("/admin/",authenticateUser,authorizeAdmin, getShowsByAdmin);
router.get("/admin/:id", authenticateUser, authorizeAdmin, getShowByAdminId);
router.delete("/admin/:id", authenticateUser, authorizeAdmin, deleteShowByAdmin);
router.patch(
  "/admin/:id/verify",
  authenticateUser,
  authorizeAdmin,
  verifyShow
);


export default router;