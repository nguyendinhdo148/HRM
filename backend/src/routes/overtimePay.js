import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getOTMonths, getOTByMonth, initializeOTMonth, deleteOTMonth
} from "../controllers/overtimePay.js";

const router = express.Router();

router.get("/months", authMiddleware, getOTMonths);
router.get("/", authMiddleware, getOTByMonth);
router.post("/init", authMiddleware, initializeOTMonth);
router.delete("/", authMiddleware, deleteOTMonth);

export default router;