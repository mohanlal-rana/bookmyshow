import express from 'express'
import { adminDashboard, organizerDashboard } from '../controllers/dashboardController.js';
import { authenticateUser, authorizeAdmin, authorizeOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/organizer/dashboard",authenticateUser,authorizeOrganizer,organizerDashboard)

router.get("/admin/dashboard",authenticateUser,authorizeAdmin,adminDashboard)

export default router