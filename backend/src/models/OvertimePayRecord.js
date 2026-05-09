import mongoose from "mongoose";

const overtimePayRecordSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeSnapshot: { employeeCode: String, fullName: String, position: String },

    baseSalary: { type: Number, default: 0 }, 
    standardDays: { type: Number, default: 26 }, // Công chia lấy từ UI
    
    dailyRate: { type: Number, default: 0 }, 
    hourlyRate: { type: Number, default: 0 },

    // Số lượng lấy từ Attendance sang
    otData: {
      normalDays: { type: Number, default: 0 }, // X
      weekendDays: { type: Number, default: 0 }, // N
      holidayDays: { type: Number, default: 0 }, // T
      hours: { type: Number, default: 0 }        // Giờ
    },

    amounts: {
      normalMoney: { type: Number, default: 0 },
      weekendMoney: { type: Number, default: 0 },
      holidayMoney: { type: Number, default: 0 },
      hoursMoney: { type: Number, default: 0 },
      totalMoney: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

overtimePayRecordSchema.pre("save", function (next) {
  // 1. Tính lương Ngày & Giờ
  this.dailyRate = this.baseSalary / (this.standardDays || 26);
  this.hourlyRate = this.dailyRate / 8;

  // 2. Tính tiền theo hệ số
  // X: Làm đêm / Ngày thường -> 150% Lương ngày
  this.amounts.normalMoney = Math.round((this.otData.normalDays * this.dailyRate * 1.5) / 1000) * 1000;
  
  // N: Ngày nghỉ -> 200% Lương ngày
  this.amounts.weekendMoney = Math.round((this.otData.weekendDays * this.dailyRate * 2.0) / 1000) * 1000;
  
  // T: Lễ tết -> 300% Lương ngày
  this.amounts.holidayMoney = Math.round((this.otData.holidayDays * this.dailyRate * 3.0) / 1000) * 1000;

  // GIỜ: Nhập tay (100% lương Giờ)
  this.amounts.hoursMoney = Math.round((this.otData.hours * this.hourlyRate * 1.0) / 1000) * 1000;

  // Tổng cộng
  this.amounts.totalMoney = this.amounts.normalMoney + this.amounts.weekendMoney + this.amounts.holidayMoney + this.amounts.hoursMoney;

  next();
});

export const OvertimePayRecord = mongoose.model("OvertimePayRecord", overtimePayRecordSchema);