import express from "express";
import { create, getAll, remove } from "../controllers/monthlyReport.js";

const router = express.Router();

router.post("/", create);
router.get("/", getAll);
router.delete("/:id", remove);

export default router;