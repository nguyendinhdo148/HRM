import mongoose from "mongoose";

const MonthlyReportSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true }, // Định dạng: "YYYY-MM" (VD: "2026-04")
    title: { type: String, required: true }, // VD: "Tháng 04/2026"
  },
  { timestamps: true }
);

export default mongoose.model("MonthlyReport", MonthlyReportSchema);