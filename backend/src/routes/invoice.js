import express from "express";
import { createInvoice, updateInvoice, deleteInvoice } from "../controllers/invoice.js";

const router = express.Router();

// Không cần route getInvoice vì getMonthDetails đã populate ra hết rồi
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;