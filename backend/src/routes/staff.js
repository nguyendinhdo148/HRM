import express from "express";
import { getActiveStaff, createStaff, updateStaff, deleteStaff } from "../controllers/staff.js";

const router = express.Router();

router.get("/", getActiveStaff);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;