import express from "express";
import { createShow, getShows, getShowById, updateShow, deleteShow, getShowsByOrganizer, verifyShow, getShowsByAdmin, getShowByAdminId, deleteShowByAdmin, getOneShowByOrganizer, searchShows, getRecommendedShows, toggleSaveShow, getSavedShows } from "../controllers/showController.js";
import { authenticateUser, authorizeAdmin, authorizeOrganizer } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validateMiddleware.js";
import { showCreateSchema, showUpdateSchema } from "../validators/showValidator.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

//public routes
router.get("/", getShows);
router.get("/search",searchShows); 
router.get("/recommended", authenticateUser, getRecommendedShows); 

//user routes
router.put("/saved/:showId", authenticateUser, toggleSaveShow);
router.get("/saved-shows", authenticateUser, getSavedShows);

//organizer routes

router.post("/",authenticateUser,authorizeOrganizer,  upload.fields([
    { name: "bannerImage", maxCount: 1 },
  ]), validate(showCreateSchema), createShow);
router.get("/organizer/getShows", authenticateUser, authorizeOrganizer, getShowsByOrganizer);
router.get("/organizer/shows/:id", authenticateUser, authorizeOrganizer, getOneShowByOrganizer);
router.put("/organizer/shows/:id", authenticateUser, authorizeOrganizer,   upload.fields([
    { name: "bannerImage", maxCount: 1 },
  ]), validate(showUpdateSchema), updateShow);
router.delete("/organizer/shows/:id", authenticateUser, authorizeOrganizer, deleteShow);


//admin routes

router.get("/admin",authenticateUser,authorizeAdmin, getShowsByAdmin);
router.get("/admin/:id", authenticateUser, authorizeAdmin, getShowByAdminId);
router.delete("/admin/:id", authenticateUser, authorizeAdmin, deleteShowByAdmin);
router.patch(
  "/admin/:id/verify",
  authenticateUser,
  authorizeAdmin,
  verifyShow
);

router.get("/:id", getShowById);

export default router;