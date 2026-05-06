import express from "express";
import { 
  createReportLog, 
  getReportsByMonth, 
  updateReportLog, 
  deleteReportLog, 
  deleteMonthReports 
} from "../controllers/cancelReport.js";

const router = express.Router();

// [GET] Lấy danh sách (Hỗ trợ lọc theo query: ?month=2026-03)
router.get("/", getReportsByMonth);

// [POST] Tạo mới 1 phiếu ghi nhận (Hủy món hoặc Đã Post)
router.post("/", createReportLog);

// [DELETE] Xóa toàn bộ dữ liệu của 1 tháng 
// (Lưu ý: Route này phải đặt TRƯỚC route /:id để Express không bị nhầm lẫn tham số)
router.delete("/month/:month", deleteMonthReports);

// [PUT] Cập nhật 1 phiếu ghi nhận theo ID
router.put("/:id", updateReportLog);

// [DELETE] Xóa 1 phiếu ghi nhận theo ID
router.delete("/:id", deleteReportLog);

export default router;