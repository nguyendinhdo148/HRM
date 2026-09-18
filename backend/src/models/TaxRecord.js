import mongoose from "mongoose";

const taxRecordSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    
    employeeSnapshot: {
      employeeCode: String,
      fullName: String,
      position: String,
    },

    // Thu nhập chịu thuế = Lương Gross từ PayrollBoard
    taxableIncome: { type: Number, default: 0 },

    deductions: {
      personal: { type: Number, default: 15500000 },
      dependent: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },              // BHXH đã trừ 88k
      housingAllowance: { type: Number, default: 0 },       // Tiền ở
      total: { type: Number, default: 0 }
    },

    assessableIncome: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ===== HOOK TÍNH THUẾ TỰ ĐỘNG =====
taxRecordSchema.pre("save", async function (next) {
  try {
    const PERSONAL_DEDUCTION = 15500000;
    const DEPENDENT_DEDUCTION = 6200000;

    // Lấy số NPT từ Employee
    let employeeDependents = 0;
    if (this.employee) {
      const employeeData = await mongoose.model("Employee").findById(this.employee);
      if (employeeData && employeeData.salaryAndBenefits) {
        employeeDependents = employeeData.salaryAndBenefits.dependents || 0;
      }
    }

    this.deductions = this.deductions || {};

    this.deductions.personal = PERSONAL_DEDUCTION;
    this.deductions.dependent = employeeDependents * DEPENDENT_DEDUCTION;

    // ===== TỔNG GIẢM TRỪ = Bản thân + NPT + BHXH + Tiền ở =====
    this.deductions.total =
      (this.deductions.personal || 0) +
      (this.deductions.dependent || 0) +
      (this.deductions.insurance || 0) +
      (this.deductions.housingAllowance || 0);

    // ===== THU NHẬP TÍNH THUẾ =====
    let assessable = (this.taxableIncome || 0) - this.deductions.total;
    if (assessable < 0) assessable = 0;
    this.assessableIncome = assessable;

    // ===== THUẾ LŨY TIẾN 5 BẬC =====
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