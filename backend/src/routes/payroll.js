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
  viewPayrollByCCCD,
  updatePayrollAdjustment,
  syncPayrollRow   // ✅ THÊM
} from "../controllers/payroll.js";

const router = express.Router();

router.get("/months", authMiddleware, getPayrollMonths);
router.get("/", authMiddleware, getPayrollByMonth);
router.post("/init", authMiddleware, initializePayroll);
router.post("/initialize", authMiddleware, initializePayroll);

// ⚠️ ĐIỀU CHỈNH CHI PHÍ KHÁC — PHẢI ĐẶT TRƯỚC ROUTE GENERIC "/:recordId"
router.put("/:recordId/adjustment", authMiddleware, updatePayrollAdjustment);

// ✅ SYNC 1 ROW — Cập nhật lại số liệu chấm công cho 1 nhân sự
router.post("/:recordId/sync", authMiddleware, syncPayrollRow);

// Cập nhật 1 dòng phiếu lương
router.put("/:recordId", authMiddleware, updatePayrollRecord);

router.put("/months/:monthId/status", authMiddleware, updatePayrollStatus);
router.delete("/", authMiddleware, deletePayrollMonth);

router.post("/send-email/:payrollRecordId", sendPayslipEmail);
router.get("/record/:id", authMiddleware, getPayrollRecordById);
router.post("/view-by-cccd", viewPayrollByCCCD);

export default router;