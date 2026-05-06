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
    
    // Lưu trữ dữ liệu chấm công theo ngày. 
    // Key là ngày (vd: "1", "2", "31"), Value là ký hiệu (vd: "x", "0,5", "", "p")
    records: {
      type: Map,
      of: String,
      default: {}
    },

    // Thống kê tự động tính (do Mongoose pre-save đảm nhiệm)
    summary: {
      totalFullDays: { type: Number, default: 0 }, // Số ngày làm việc cả ngày [x]
      totalHalfDays: { type: Number, default: 0 }, // Số ngày làm việc nửa ngày [0,5]
      totalPaidDays: { type: Number, default: 0 }  // Tổng số công làm việc = Full + (Half * 0.5)
    }
  },
  { timestamps: true }
);

// Đảm bảo 1 nhân viên chỉ có 1 bảng chấm công trong 1 tháng/năm
attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ==========================================
// HOOK: TỰ ĐỘNG TÍNH TỔNG SỐ CÔNG TRƯỚC KHI LƯU
// ==========================================
attendanceSchema.pre("save", function (next) {
  let fullDays = 0;
  let halfDays = 0;

  if (this.records) {
    this.records.forEach((val, key) => {
      // Chuẩn hóa chuỗi (chữ thường, đổi dấu phẩy thành dấu chấm)
      const value = val?.toString().trim().toLowerCase().replace(",", ".");
      
      if (value === "x") {
        fullDays += 1;
      } else if (value === "0.5") {
        halfDays += 1;
      }
    });
  }

  this.summary.totalFullDays = fullDays;
  this.summary.totalHalfDays = halfDays;
  this.summary.totalPaidDays = fullDays + (halfDays * 0.5);

  next();
});

export const Attendance = mongoose.model("Attendance", attendanceSchema);