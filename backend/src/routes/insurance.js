import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getInsuranceMonths,
  getInsuranceByMonth,
  initializeInsuranceMonth,
  deleteInsuranceMonth // Thêm import hàm xóa ở đây
} from "../controllers/insurance.js";

const router = express.Router();

router.get("/months", authMiddleware, getInsuranceMonths);
router.get("/", authMiddleware, getInsuranceByMonth);
router.post("/init", authMiddleware, initializeInsuranceMonth);

// KHAI BÁO ROUTE XÓA
router.delete("/", authMiddleware, deleteInsuranceMonth);

export default router;