import express from "express";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import chatRoutes from "./chat.js"; 
import notificationRoutes from "./notification.js";
import insuranceRoutes from "./insurance.js";
import hrm from "./hrm.js";
import payrollRoutes from "./payroll.js";
import tax from "./tax.js";
// ✅ 1. IMPORT ROUTE CHẤM CÔNG VÀO ĐÂY (Lưu ý đuôi file của bạn, có thể là attendance.js hoặc attendance.routes.js)
import attendanceRoutes from "./attendance.js"; 

// <-- IMPORT ROUTE LÀM THÊM GIỜ (OT) -->
import overtimePayRoutes from "./overtimePay.js";


// <-- IMPORT ROUTE GỬI RƯỢU (BOTTLE KEEP) -->
import bottleKeepRoutes from "./bottleKeep.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes); 
router.use("/notifications", notificationRoutes);
router.use("/hrm", hrm);
router.use("/payroll", payrollRoutes);
router.use("/insurance", insuranceRoutes);
router.use("/tax", tax);
// ✅ 2. GẮN ENDPOINT "/attendance" CHO CHẤM CÔNG
router.use("/attendance", attendanceRoutes);

// <-- GẮN API LÀM THÊM GIỜ (OT) VÀO ĐÂY -->
router.use("/overtime-pay", overtimePayRoutes);


// <-- GẮN API GỬI RƯỢU VÀO ĐÂY -->
router.use("/bottle-keep", bottleKeepRoutes);

export default router;