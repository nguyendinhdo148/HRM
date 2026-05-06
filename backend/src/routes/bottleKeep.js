import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import { 
  getBottleKeeps, 
  createBottleKeep, 
  withdrawBottle,
  updateBottleHistory,                 // <--- Nhớ import 
  deleteBottleHistoryAndUpdateStock,   // <--- Nhớ import
  deleteBottle                       // <--- Nhớ import

} from "../controllers/bottleKeep.js";

const router = express.Router();

const checkBarRole = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole !== "bar" && userRole !== "admin") {
    return res.status(403).json({ message: "Truy cập bị từ chối." });
  }
  next();
};

router.get("/", authMiddleware, checkBarRole, getBottleKeeps);
router.post("/", authMiddleware, checkBarRole, createBottleKeep);
router.post("/:id/withdraw", authMiddleware, checkBarRole, withdrawBottle);

// ---> KHAI BÁO 2 ROUTE MỚI DÀNH CHO LỊCH SỬ <---
// Route xử lý việc Sửa Text 
router.put("/:bottleId/history/:historyId", authMiddleware, checkBarRole, updateBottleHistory);

// Route xử lý việc Xóa & Cập nhật lại kho
router.post("/:bottleId/history/:historyId/delete", authMiddleware, checkBarRole, deleteBottleHistoryAndUpdateStock);
router.delete("/:id", authMiddleware, checkBarRole, deleteBottle);
export default router;