import mongoose from "mongoose";

const taxRecordSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    
    // Snapshot nhân viên
    employeeSnapshot: {
      employeeCode: String,
      fullName: String,
      position: String,
    },

    // Dữ liệu lấy từ các Model khác sang
    taxableIncome: { type: Number, default: 0 }, // Thu nhập chịu thuế (Kéo từ Lương Gross)
    dependents: { type: Number, default: 0 },    // Số người phụ thuộc

    // Các khoản giảm trừ
    deductions: {
      personal: { type: Number, default: 15500000 }, // Cố định 15.5tr (Mới 2026)
      dependent: { type: Number, default: 0 },       // Tính tự động (Số NPT x 6.2tr)
      insurance: { type: Number, default: 0 },       // BH trừ vào lương (Kéo từ Insurance)
      total: { type: Number, default: 0 }
    },

    // Thu nhập tính thuế & Thuế phải nộp
    assessableIncome: { type: Number, default: 0 }, // Thu nhập tính thuế
    taxAmount: { type: Number, default: 0 },        // Thuế TNCN
  },
  { timestamps: true }
);

// HOOK TÍNH THUẾ TỰ ĐỘNG (LŨY TIẾN 7 BẬC)
taxRecordSchema.pre("save", function (next) {
  // Cập nhật mức giảm trừ 2026 theo file Excel của bạn
  const PERSONAL_DEDUCTION = 15500000;
  const DEPENDENT_DEDUCTION = 6200000;

  this.deductions.personal = PERSONAL_DEDUCTION;
  this.deductions.dependent = (this.dependents || 0) * DEPENDENT_DEDUCTION;
  
  // Tổng giảm trừ
  this.deductions.total = this.deductions.personal + this.deductions.dependent + (this.deductions.insurance || 0);

  // Thu nhập tính thuế (Assessable Income)
  let assessable = (this.taxableIncome || 0) - this.deductions.total;
  if (assessable < 0) assessable = 0;
  this.assessableIncome = assessable;

  // Tính thuế TNCN theo công thức rút gọn lũy tiến 7 bậc của Tổng Cục Thuế VN
  let tax = 0;
  if (assessable <= 0) {
    tax = 0;
  } else if (assessable <= 5000000) {
    tax = assessable * 0.05;
  } else if (assessable <= 10000000) {
    tax = assessable * 0.10 - 250000;
  } else if (assessable <= 18000000) {
    tax = assessable * 0.15 - 750000;
  } else if (assessable <= 32000000) {
    tax = assessable * 0.20 - 1650000;
  } else if (assessable <= 52000000) {
    tax = assessable * 0.25 - 3250000;
  } else if (assessable <= 80000000) {
    tax = assessable * 0.30 - 5850000;
  } else {
    tax = assessable * 0.35 - 9850000;
  }

  this.taxAmount = Math.round(tax);
  next();
});

export const TaxRecord = mongoose.model("TaxRecord", taxRecordSchema);