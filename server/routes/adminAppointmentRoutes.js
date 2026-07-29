import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAppointments,
  sendManualReminder,
  cancelAppointment,
  rescheduleAppointment,
  deleteAppointment
} from "../controllers/adminAppointmentController.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getAppointments);

router.route("/:id")
  .delete(deleteAppointment);

router.route("/:id/reminder")
  .post(sendManualReminder);

router.route("/:id/cancel")
  .patch(cancelAppointment);

router.route("/:id/reschedule")
  .patch(rescheduleAppointment);

export default router;
