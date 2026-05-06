import express from "express";
import { 
  createCommissionBill, 
  getAllCommissionBills, 
  updateCommissionBill, 
  deleteCommissionBill,
  deleteCommissionByMonth // <-- Hàm mới
} from "../controllers/wineCommission.js";

const router = express.Router();

// Lọc danh sách hoặc lấy tất cả
router.get("/", getAllCommissionBills);

// Tạo mới
router.post("/", createCommissionBill);

// Xóa TOÀN BỘ bill theo tháng (Phải đặt trước route /:id để tránh xung đột)
router.delete("/month/:month", deleteCommissionByMonth);

// Cập nhật và Xóa theo ID lẻ
router.put("/:id", updateCommissionBill);
router.delete("/:id", deleteCommissionBill);

export default router;