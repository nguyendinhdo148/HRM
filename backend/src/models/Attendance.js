import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      description: "Liên kết đến Nhân viên"
    },
    month: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12 
    },
    year: { 
      type: Number, 
      required: true 
    },
    advancePayment: { 
      type: Number, 
      default: 0,
      description: "Tạm ứng trong tháng (VNĐ)"
    },
    
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
    // 4. TỔNG HỢP THỐNG KÊ (AUTO-CALCULATED)
    // ==========================================
    summary: {
      totalFullDays: { type: Number, default: 0 }, 
      totalHalfDays: { type: Number, default: 0 }, 
      totalPaidDays: { type: Number, default: 0 }, 

      totalOTNormal: { type: Number, default: 0 },  // Ngày thường (X) hoặc nhập số giờ
      totalOTWeekend: { type: Number, default: 0 }, // Ngày nghỉ (N)
      totalOTHoliday: { type: Number, default: 0 }, // Lễ tết (T)
      totalOT: { type: Number, default: 0 },        // Tổng cộng

      totalShortfallHours: { type: Number, default: 0 } // Tổng giờ đi muộn/về sớm
    }
  },
  { timestamps: true }
);

// Đảm bảo 1 nhân viên chỉ có 1 bảng chấm công trong 1 tháng/năm
attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ==========================================
// HOOK: TỰ ĐỘNG TÍNH TOÁN TỔNG HỢP TRƯỚC KHI LƯU
// ==========================================
attendanceSchema.pre("save", function (next) {
  // 1. Tính công chuẩn
  let fullDays = 0;
  let halfDays = 0;

  if (this.records) {
    this.records.forEach((val) => {
      const value = val?.toString().trim().toUpperCase().replace(",", ".");
      if (value === "X") fullDays += 1;
      else if (value === "0.5") halfDays += 1;
    });
  }

  // 2. Tính làm thêm giờ (Hỗ trợ cả Chữ và Số)
  let otNormal = 0;
  let otWeekend = 0;
  let otHoliday = 0;

  if (this.overtimeRecords) {
    this.overtimeRecords.forEach((val) => {
      const value = val?.toString().trim().toUpperCase();
      
      if (value === "X") otNormal += 1;
      else if (value === "N") otWeekend += 1;
      else if (value === "T") otHoliday += 1;
      // Nếu HR nhập số (ví dụ: 2, 4.5 tiếng) thì cộng vào OT Thường
      else if (!isNaN(Number(value)) && Number(value) > 0) {
        otNormal += Number(value); 
      }
    });
  }

  // 3. Tính giờ thiếu
  let shortHours = 0;
  if (this.shortfallRecords) {
    this.shortfallRecords.forEach((val) => {
      shortHours += Number(val) || 0;
    });
  }

  // 4. Gán vào summary
  this.summary.totalFullDays = fullDays;
  this.summary.totalHalfDays = halfDays;
  this.summary.totalPaidDays = fullDays + (halfDays * 0.5);

  this.summary.totalOTNormal = otNormal;
  this.summary.totalOTWeekend = otWeekend;
  this.summary.totalOTHoliday = otHoliday;
  this.summary.totalOT = otNormal + otWeekend + otHoliday;

  this.summary.totalShortfallHours = shortHours;

  next();
});

export const Attendance = mongoose.model("Attendance", attendanceSchema);