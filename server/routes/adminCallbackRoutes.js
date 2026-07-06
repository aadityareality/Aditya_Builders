import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCallbackRequests,
  updateCallbackStatus,
  deleteCallbackRequest,
} from "../controllers/adminCallbackController.js";

const router = express.Router();

router.use(protect);

router.get("/", getCallbackRequests);
router.patch("/:id/status", updateCallbackStatus);
router.delete("/:id", deleteCallbackRequest);

export default router;
