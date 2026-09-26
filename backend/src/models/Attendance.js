import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      description: "Liên kết đến Nhân viên"
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    advancePayment: { type: Number, default: 0, description: "Tạm ứng trong tháng (VNĐ)" },

    // ==========================================
    // 1. CHẤM CÔNG CHUẨN (HÀNH CHÍNH)
    // ==========================================
    records: {
      type: Map,
      of: String,
      default: {}
    },

    // ==========================================
    // 2. CHẤM CÔNG LÀM THÊM GIỜ (OVERTIME)
    // ==========================================
    overtimeRecords: {
      type: Map,
      of: String,
      default: {}
    },

    // ==========================================
    // 3. ĐI MUỘN / VỀ SỚM / THIẾU GIỜ
    // ==========================================
    shortfallRecords: {
      type: Map,
      of: Number,
      default: {}
    },

    // ==========================================
    // 4. KPI SHOW (MINI / BIG SHOW THEO NGÀY)
    // ==========================================
    kpiRecords: {
      type: Map,
      of: new mongoose.Schema(
        {
          minishow: { type: Number, default: 0 },
          bigshow: { type: Number, default: 0 }
        },
        { _id: false }
      ),
      default: {},
      description: "Lưu số show theo từng ngày. Key là ngày (VD: '15')"
    },

    // ==========================================
    // 5. TỔNG HỢP THỐNG KÊ (AUTO-CALCULATED)
    // ==========================================
    summary: {
      totalFullDays: { type: Number, default: 0 },
      totalHalfDays: { type: Number, default: 0 },
      totalPaidDays: { type: Number, default: 0 },

      totalOTNormal: { type: Number, default: 0 },
      totalOTWeekend: { type: Number, default: 0 },
      totalOTHoliday: { type: Number, default: 0 },
      totalOT: { type: Number, default: 0 },

      totalShortfallHours: { type: Number, default: 0 },

      totalMinishow: { type: Number, default: 0 },
      totalBigshow: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ==========================================
// HOOK: TỰ ĐỘNG TÍNH TOÁN TRƯỚC KHI LƯU
// ==========================================
attendanceSchema.pre("save", function (next) {
  // ---------- 1. ĐẾM CÔNG CHUẨN ----------
  let fullDays = 0;
  let halfDays = 0;

  if (this.records) {
    this.records.forEach((val) => {
      const value = val?.toString().trim().toUpperCase().replace(",", ".");
      if (value === "X" || value === "CHẠM" || value === "CHAM") fullDays += 1;
      else if (value === "0.5") halfDays += 1;
    });
  }

  // ---------- 2. ĐẾM OT ----------
  let otNormal = 0;
  let otWeekend = 0;
  let otHoliday = 0;

  if (this.overtimeRecords) {
    this.overtimeRecords.forEach((val) => {
      const value = val?.toString().trim().toUpperCase();
      if (value === "X") otNormal += 1;
      else if (value === "N") otWeekend += 1;
      else if (value === "T") otHoliday += 1;
      else if (!isNaN(Number(value)) && Number(value) > 0) otNormal += Number(value);
    });
  }

  // ---------- 3. ĐẾM SHORTFALL ----------
  let shortHours = 0;
  if (this.shortfallRecords) {
    this.shortfallRecords.forEach((val) => {
      shortHours += Number(val) || 0;
    });
  }

  // ---------- 4. TỔNG SHOW ----------
  let tMinishow = 0;
  let tBigshow = 0;

  if (this.kpiRecords) {
    this.kpiRecords.forEach((val) => {
      tMinishow += Number(val?.minishow) || 0;
      tBigshow += Number(val?.bigshow) || 0;
    });
  }

  // ---------- 5. GÁN SUMMARY ----------
  this.summary.totalFullDays = fullDays;
  this.summary.totalHalfDays = halfDays;

  const directTotalPaidDays = Number(this.summary?.totalPaidDays);
  const hasDirectOverride = this.isModified("summary.totalPaidDays") && Number.isFinite(directTotalPaidDays);

  // ✅ Nếu người dùng sửa trực tiếp tổng công thì giữ giá trị đó; ngược lại tính từ records.
  this.summary.totalPaidDays = hasDirectOverride
    ? Math.max(0, directTotalPaidDays)
    : fullDays + halfDays * 0.5;

  this.summary.totalOTNormal = otNormal;
  this.summary.totalOTWeekend = otWeekend;
  this.summary.totalOTHoliday = otHoliday;
  this.summary.totalOT = otNormal + otWeekend + otHoliday;

  this.summary.totalShortfallHours = shortHours;
  this.summary.totalMinishow = tMinishow;
  this.summary.totalBigshow = tBigshow;

  next();
});

export const Attendance = mongoose.model("Attendance", attendanceSchema);