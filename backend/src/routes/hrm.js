import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  createEmployee,
  getEmployees,
  getEmployeeDetails,
  updateEmployee, // Bổ sung import
  deleteEmployee, // Bổ sung import
  getHRStats,
} from "../controllers/employee.js";

const router = express.Router();

// ==========================================
// ROUTES: PHÒNG BAN (DEPARTMENT)
// ==========================================
router.post("/departments", authMiddleware, createDepartment);
router.get("/departments", authMiddleware, getDepartments);
router.put("/departments/:departmentId", authMiddleware, updateDepartment);
router.delete("/departments/:departmentId", authMiddleware, deleteDepartment);

// ==========================================
// ROUTES: NHÂN VIÊN (EMPLOYEE)
// ==========================================
router.post("/employees", authMiddleware, createEmployee);
router.get("/employees", authMiddleware, getEmployees);
router.get("/employees/:employeeId", authMiddleware, getEmployeeDetails);

// BỔ SUNG 2 CHỨC NĂNG UPDATE VÀ DELETE CHO NHÂN VIÊN
router.put("/employees/:employeeId", authMiddleware, updateEmployee);
router.delete("/employees/:employeeId", authMiddleware, deleteEmployee);

// ==========================================
// ROUTES: THỐNG KÊ (DASHBOARD STATS)
// ==========================================
router.get("/dashboard/stats", authMiddleware, getHRStats);

export default router;