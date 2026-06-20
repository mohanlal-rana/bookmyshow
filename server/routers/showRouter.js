import express from "express";
import { createShow, getShows, getShowById, updateShow, deleteShow } from "../controllers/showController.js";
import { authenticateUser, authorizeOrganizer } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validateMiddleware.js";
import { showCreateSchema, showUpdateSchema } from "../validators/showValidator.js";

const router = express.Router();

router.post("/",authenticateUser,authorizeOrganizer, validate(showCreateSchema), createShow);
router.get("/", getShows);
router.get("/:id", getShowById);
router.put("/:id",authenticateUser, authorizeOrganizer, validate(showUpdateSchema), updateShow);
router.delete("/:id", authenticateUser, authorizeOrganizer, deleteShow);

export default router;