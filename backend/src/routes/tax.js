import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getTaxMonths, getTaxByMonth, initializeTaxMonth,
  updateTaxRecord, deleteTaxMonth
} from "../controllers/tax.js";

const router = express.Router();

router.get("/months", authMiddleware, getTaxMonths);
router.get("/", authMiddleware, getTaxByMonth);
router.post("/init", authMiddleware, initializeTaxMonth);
router.put("/:recordId", authMiddleware, updateTaxRecord);
router.delete("/", authMiddleware, deleteTaxMonth);

export default router;