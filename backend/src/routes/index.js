import express from "express";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import chatRoutes from "./chat.js"; 
import notificationRoutes from "./notification.js";
import monthlyReportRoutes from "./monthlyReport.js"; 
import dailyRevenueRoutes from "./dailyRevenue.js"; 
import invoiceMonthRoutes from "./invoiceMonth.js";
import invoiceRoutes from "./invoice.js"; 
import tipRoutes from "./tip.js"; 
import hrm from "./hrm.js";

// ✅ 1. IMPORT ROUTE CHẤM CÔNG VÀO ĐÂY (Lưu ý đuôi file của bạn, có thể là attendance.js hoặc attendance.routes.js)
import attendanceRoutes from "./attendance.js"; 

// <-- IMPORT ROUTE HOA HỒNG RƯỢU -->
import wineCommissionRoutes from "./wineCommission.js";

// <-- IMPORT ROUTE QUẢN LÝ HỦY MÓN -->
import cancelReportRoutes from "./cancelReport.js";

// <-- IMPORT ROUTE GỬI RƯỢU (BOTTLE KEEP) -->
import bottleKeepRoutes from "./bottleKeep.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes); 
router.use("/notifications", notificationRoutes);
router.use("/monthly-reports", monthlyReportRoutes); 
router.use("/daily-revenues", dailyRevenueRoutes); 
router.use("/invoice-months", invoiceMonthRoutes);
router.use("/invoices", invoiceRoutes); 
router.use("/tips", tipRoutes);
router.use("/hrm", hrm);

// ✅ 2. GẮN ENDPOINT "/attendance" CHO CHẤM CÔNG
router.use("/attendance", attendanceRoutes);


// <-- GẮN VÀO API -->
router.use("/wine-commission", wineCommissionRoutes);
router.use("/cancel-reports", cancelReportRoutes);

// <-- GẮN API GỬI RƯỢU VÀO ĐÂY -->
router.use("/bottle-keep", bottleKeepRoutes);

export default router;