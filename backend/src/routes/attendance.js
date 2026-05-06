import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getAttendanceMonths,
  initializeMonthAttendance,
  getAttendanceByMonth,
  updateAttendanceBulk,
  deleteAttendanceMonth,
  toggleMonthStatus
} from "../controllers/attendance.js"; 

const router = express.Router();

// Lấy danh sách các kỳ chấm công
router.get("/months", authMiddleware, getAttendanceMonths);

// Lấy dữ liệu bảng chấm công chi tiết theo tháng/năm (?month=5&year=2026)
router.get("/", authMiddleware, getAttendanceByMonth);

// Khởi tạo bảng công cho 1 tháng mới
router.post("/init", authMiddleware, initializeMonthAttendance);

// Cập nhật 1 dòng dữ liệu (tạm ứng, các ngày đi làm)
router.put("/:recordId/bulk-update", authMiddleware, updateAttendanceBulk);

// Đổi trạng thái chốt công (Mở / Khóa)
router.put("/months/:id/status", authMiddleware, toggleMonthStatus);

// Xóa kỳ chấm công
router.delete("/", authMiddleware, deleteAttendanceMonth);

export default router;