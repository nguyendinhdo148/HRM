import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    minishow: { type: Number, default: 0 },
    bigshow: { type: Number, default: 0 },
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeSnapshot: {
      employeeCode: { type: String, default: "" },
      fullName: { type: String, default: "" },
      status: { type: String, default: "" },
      department: { type: String, default: "" },
    },
    advancePayment: { type: Number, default: 0 },
    summary: {
      totalPaidDays: { type: Number, default: 0 },
    },
    records: {
      type: Map,
      of: String,
      default: {},
    },
    overtimeRecords: {
      type: Map,
      of: String,
      default: {},
    },
    shortfallRecords: {
      type: Map,
      of: Number,
      default: {},
    },
    kpiRecords: {
      type: Map,
      of: kpiSchema,
      default: {},
    },
  },
  { _id: true }
);

const attendanceReportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    // ✅ THÊM 2 FIELD NÀY — đánh dấu report dùng cho lương tháng nào
    payrollMonth: { type: Number, default: null },   // 7
    payrollYear: { type: Number, default: null },    // 2026

    scope: {
      mode: { type: String, default: "ALL" },
      department: { type: String, default: "" },
      employeeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    },
    rows: [rowSchema],
  },
  { timestamps: true }
);

attendanceReportSchema.index({ createdAt: -1 });
attendanceReportSchema.index({ payrollMonth: 1, payrollYear: 1 }); // ✅ Index để query nhanh

export const AttendanceReport = mongoose.model("AttendanceReport", attendanceReportSchema);