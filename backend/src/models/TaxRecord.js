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
    allowances: {
      meal: { type: Number, default: 0 }, // Chỉ lấy tiền ăn
    },
    dependents: { type: Number, default: 0 },    // Số người phụ thuộc

    // Các khoản giảm trừ
    deductions: {
      personal: { type: Number, default: 15500000 }, // Cố định 15.5tr (Mới)
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

// HOOK TÍNH THUẾ TỰ ĐỘNG (LŨY TIẾN 5 BẬC MỚI)
taxRecordSchema.pre("save", function (next) {
  // Cập nhật mức giảm trừ theo file cấu hình
  const PERSONAL_DEDUCTION = 15500000;
  const DEPENDENT_DEDUCTION = 6200000;

  this.deductions.personal = PERSONAL_DEDUCTION;
  this.deductions.dependent = (this.dependents || 0) * DEPENDENT_DEDUCTION;
  
  // Đảm bảo object allowances tồn tại
  this.allowances = this.allowances || {};

  // Tổng giảm trừ
  this.deductions = this.deductions || {};
  this.deductions.total = (this.deductions.personal || 0) + (this.deductions.dependent || 0) + (this.deductions.insurance || 0);

  // Thu nhập tính thuế = Thu nhập chịu thuế - Giảm trừ bản thân - NPT - tiền ăn - BHXH
  let assessable = (this.taxableIncome || 0) 
                 - (this.deductions.personal || 0) 
                 - (this.deductions.dependent || 0) 
                 - (this.allowances.meal || 0) 
                 - (this.deductions.insurance || 0);
                 
  if (assessable < 0) assessable = 0;
  this.assessableIncome = assessable;

  // TÍNH THUẾ TNCN THEO BIỂU THUẾ 5 BẬC MỚI (Công thức rút gọn)
  let tax = 0;
  if (assessable <= 0) {
    tax = 0;
  } else if (assessable <= 10000000) {
    tax = assessable * 0.05;
  } else if (assessable <= 30000000) {
    tax = assessable * 0.10 - 500000;
  } else if (assessable <= 60000000) {
    tax = assessable * 0.20 - 3500000;
  } else if (assessable <= 100000000) {
    tax = assessable * 0.30 - 9500000;
  } else {
    tax = assessable * 0.35 - 14500000;
  }

  this.taxAmount = Math.round(tax);
  next();
});

export const TaxRecord = mongoose.model("TaxRecord", taxRecordSchema);