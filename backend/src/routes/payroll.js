import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getPayrollMonths,
  initializePayroll,
  getPayrollByMonth,
  updatePayrollRecord,
  updatePayrollStatus,
  deletePayrollMonth,
  sendPayslipEmail,
  getPayrollRecordById,
  viewPayrollByCCCD // ✅ Import thêm hàm này
} from "../controllers/payroll.js";

const router = express.Router();

// Lấy danh sách các kỳ lương đã tạo
router.get("/months", authMiddleware, getPayrollMonths);

// Lấy chi tiết bảng lương của 1 tháng/năm (?month=5&year=2026)
router.get("/", authMiddleware, getPayrollByMonth);

// Khởi tạo bảng lương tháng mới (Kéo data từ Nhân sự & Chấm công)
router.post("/init", authMiddleware, initializePayroll);

// Cập nhật 1 dòng phiếu lương (Nhập thêm giờ, thưởng, thuế TNCN, ...)
router.put("/:recordId", authMiddleware, updatePayrollRecord);

// Đổi trạng thái bảng lương (Chốt / Thanh toán)
router.put("/months/:monthId/status", authMiddleware, updatePayrollStatus);

// Xóa bảng lương (Nếu tạo nhầm)
router.delete("/", authMiddleware, deletePayrollMonth);

router.post("/send-email/:payrollRecordId", sendPayslipEmail);
router.get("/record/:id", authMiddleware, getPayrollRecordById);

// ==========================================
// ✅ ROUTE PUBLIC: NHÂN VIÊN TỰ TRA CỨU (KHÔNG DÙNG authMiddleware)
// ==========================================
router.post("/view-by-cccd", viewPayrollByCCCD);

export default router;