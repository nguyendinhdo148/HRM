import express from "express";
import authRoutes from "./auth.js";
import workspaceRoutes from "./workspace.js";
import projectRoutes from "./project.js";
import taskRoutes from "./task.js";
import userRoutes from "./user.js";
import epicRoutes from "./epic.js";
import storyRoutes from "./story.js";
import chatRoutes from "./chat.js"; 
import notificationRoutes from "./notification.js";
import monthlyReportRoutes from "./monthlyReport.js"; 
import dailyRevenueRoutes from "./dailyRevenue.js"; 
import invoiceMonthRoutes from "./invoiceMonth.js";
import invoiceRoutes from "./invoice.js"; 
import staffRoutes from "./staff.js";
import tipRoutes from "./tip.js"; 

// <-- IMPORT ROUTE HOA HỒNG RƯỢU -->
import wineCommissionRoutes from "./wineCommission.js";

// <-- IMPORT ROUTE QUẢN LÝ HỦY MÓN -->
import cancelReportRoutes from "./cancelReport.js";

// <-- IMPORT ROUTE GỬI RƯỢU (BOTTLE KEEP) -->
import bottleKeepRoutes from "./bottleKeep.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);
router.use("/epics", epicRoutes);
router.use("/stories", storyRoutes);
router.use("/chat", chatRoutes); 
router.use("/notifications", notificationRoutes);
router.use("/monthly-reports", monthlyReportRoutes); 
router.use("/daily-revenues", dailyRevenueRoutes); 
router.use("/invoice-months", invoiceMonthRoutes);
router.use("/invoices", invoiceRoutes); 
router.use("/tips", tipRoutes);
router.use("/staff", staffRoutes);

// <-- GẮN VÀO API -->
router.use("/wine-commission", wineCommissionRoutes);
router.use("/cancel-reports", cancelReportRoutes);

// <-- GẮN API GỬI RƯỢU VÀO ĐÂY -->
router.use("/bottle-keep", bottleKeepRoutes);

export default router;