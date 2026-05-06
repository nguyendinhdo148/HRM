import express from "express";
import { 
  createTipDistribution, 
  getTipDistributions,
  getTipDistributionById,
  updateTipDistribution,
  deleteTipDistribution
} from "../controllers/tip.js";

const router = express.Router();

// [CREATE] Tạo mới bảng tính tip
router.post("/", createTipDistribution);

// [READ ALL] Lấy danh sách tất cả các lịch sử tính tip
router.get("/", getTipDistributions);

// [READ ONE] Lấy chi tiết 1 lịch sử theo ID
router.get("/:id", getTipDistributionById);

// [UPDATE] Cập nhật lại 1 bảng tính tip
router.put("/:id", updateTipDistribution);

// [DELETE] Xóa 1 bảng tính tip
router.delete("/:id", deleteTipDistribution);

export default router;