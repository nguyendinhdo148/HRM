import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  listAttendanceReports,
  createAttendanceReport,
  getAttendanceReportData,
  updateAttendanceReportStatus,
  deleteAttendanceReport,
  updateAttendanceReportRow,
  setPayrollMonth,  // ✅ THÊM
} from "../controllers/attendanceReport.js";

const router = express.Router();

router.get("/list", authMiddleware, listAttendanceReports);
router.post("/create", authMiddleware, createAttendanceReport);
router.get("/:reportId/data", authMiddleware, getAttendanceReportData);
router.put("/:reportId/status", authMiddleware, updateAttendanceReportStatus);
router.delete("/:reportId", authMiddleware, deleteAttendanceReport);
router.put("/:reportId/row/:rowId", authMiddleware, updateAttendanceReportRow);

// ✅ Route mới — gán tháng lương cho report
router.put("/:reportId/payroll-month", authMiddleware, setPayrollMonth);

export default router;