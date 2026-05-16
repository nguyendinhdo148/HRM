import mongoose from "mongoose";

const taxRecordSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    
    // Snapshot thông tin cơ bản tại thời điểm chốt thuế
    employeeSnapshot: {
      employeeCode: String,
      fullName: String,
      position: String,
    },

    // Dữ liệu thu nhập
    taxableIncome: { type: Number, default: 0 }, // Thu nhập chịu thuế (Lương Gross)
    allowances: {
      meal: { type: Number, default: 0 }, // Tiền ăn được miễn thuế
    },

    // Các khoản giảm trừ
    deductions: {
      personal: { type: Number, default: 15500000 }, // Giảm trừ bản thân cố định 15.5tr
      dependent: { type: Number, default: 0 },       // Sẽ tính toán: (Số NPT từ bảng Employee x 6.2tr)
      insurance: { type: Number, default: 0 },       // Bảo hiểm trừ vào lương
      total: { type: Number, default: 0 }
    },

    // Thu nhập tính thuế & Thuế phải nộp
    assessableIncome: { type: Number, default: 0 }, // Thu nhập tính thuế
    taxAmount: { type: Number, default: 0 },        // Thuế TNCN phải nộp
  },
  { timestamps: true }
);

// HOOK TÍNH THUẾ TỰ ĐỘNG (LŨY TIẾN 5 BẬC MỚI)
taxRecordSchema.pre("save", async function (next) {
  try {
    const PERSONAL_DEDUCTION = 15500000;
    const DEPENDENT_DEDUCTION = 6200000;

    // TRUY VẤN LẤY TRỰC TIẾP SỐ NPT TỪ MODEL EMPLOYEE RA ĐỂ TÍNH TOÁN
    let employeeDependents = 0;
    if (this.employee) {
      const employeeData = await mongoose.model("Employee").findById(this.employee);
      if (employeeData && employeeData.salaryAndBenefits) {
        employeeDependents = employeeData.salaryAndBenefits.dependents || 0;
      }
    }

    // Thiết lập các mức giảm trừ dựa trên số lượng lấy được từ bảng nhân sự
    this.deductions.personal = PERSONAL_DEDUCTION;
    this.deductions.dependent = employeeDependents * DEPENDENT_DEDUCTION;
    
    // Đảm bảo object allowances tồn tại
    this.allowances = this.allowances || {};

    // Tính tổng các khoản giảm trừ
    this.deductions = this.deductions || {};
    this.deductions.total = (this.deductions.personal || 0) + (this.deductions.dependent || 0) + (this.deductions.insurance || 0);

    // Thu nhập tính thuế = Thu nhập chịu thuế - Giảm trừ bản thân - Giảm trừ NPT - Tiền ăn - BHXH
    let assessable = (this.taxableIncome || 0) 
                   - (this.deductions.personal || 0) 
                   - (this.deductions.dependent || 0) 
                   - (this.allowances.meal || 0) 
                   - (this.deductions.insurance || 0);
                   
    if (assessable < 0) assessable = 0;
    this.assessableIncome = assessable;

    // TÍNH THUẾ LŨY TIẾN 5 BẬC
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
  } catch (error) {
    next(error);
  }
});

export const TaxRecord = mongoose.model("TaxRecord", taxRecordSchema);