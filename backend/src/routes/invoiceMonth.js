import express from "express";
import { 
  createMonthBoard, 
  getAllMonths, 
  getMonthDetails, 
  updateMonthBoard, 
  deleteMonthBoard 
} from "../controllers/invoiceMonth.js";

const router = express.Router();

router.post("/", createMonthBoard);
router.get("/", getAllMonths); // Lấy list tất cả các tháng
router.get("/:monthStr", getMonthDetails); // Lấy chi tiết 1 tháng
router.put("/:monthStr", updateMonthBoard); // Cập nhật tháng
router.delete("/:monthStr", deleteMonthBoard); // Xóa tháng

export default router;