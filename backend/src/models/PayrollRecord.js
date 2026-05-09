import mongoose from "mongoose";

const payrollRecordSchema = new mongoose.Schema(
  {
    payrollMonth: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollMonth" }, 
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    
    employeeSnapshot: {
      fullName: { type: String, required: true },
      employeeCode: { type: String, required: true },
      department: { type: String },
      position: { type: String }
    },

    month: { type: Number, required: true },
    year: { type: Number, required: true },

    baseSalary: { type: Number, default: 0 },
    insuranceSalary: { type: Number, default: 0 },
    standardDays: { type: Number, default: 26 },
    actualDays: { type: Number, default: 0 },

    incomes: {
      timeSalary: { type: Number, default: 0 },
      allowances: {
        meal: { type: Number, default: 0 },
        transport: { type: Number, default: 0 }, // ✅ Đổi gas thành transport
        phone: { type: Number, default: 0 },
        clothing: { type: Number, default: 0 },
        housing: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      overtime: { type: Number, default: 0 }, 
      bonus: { type: Number, default: 0 },    
      totalGross: { type: Number, default: 0 },
    },

    deductions: {
      advance: { type: Number, default: 0 },  
      insurance: {
        bhxh: { type: Number, default: 0 },
        bhyt: { type: Number, default: 0 },
        bhtn: { type: Number, default: 0 },
        total: { type: Number, default: 0 }, 
      },
      taxTNCN: { type: Number, default: 0 }, 
      totalDeductions: { type: Number, default: 0 },
    },

    netSalary: { type: Number, default: 0 },

    // ==========================================
    // ✅ THÊM TRƯỜNG TRẠNG THÁI GỬI EMAIL
    // ==========================================
    isEmailSent: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

payrollRecordSchema.index({ month: 1, year: 1, employee: 1 }, { unique: true });

payrollRecordSchema.pre("save", function (next) {
  this.incomes.timeSalary = this.standardDays > 0 
    ? Math.round((this.baseSalary / this.standardDays) * this.actualDays)
    : 0;

  const allw = this.incomes.allowances;
  // ✅ Tính tổng bằng transport
  const totalAllw = allw.meal + allw.transport + allw.phone + allw.clothing + allw.housing + allw.other;

  this.incomes.totalGross = this.incomes.timeSalary + totalAllw + this.incomes.overtime + this.incomes.bonus;

  this.deductions.insurance.total = this.deductions.insurance.bhxh + this.deductions.insurance.bhyt + this.deductions.insurance.bhtn;
  this.deductions.totalDeductions = this.deductions.advance + this.deductions.insurance.total + this.deductions.taxTNCN;

  this.netSalary = this.incomes.totalGross - this.deductions.totalDeductions;
  
  if (this.netSalary < 0) this.netSalary = 0;

  next();
});

export const PayrollRecord = mongoose.model("PayrollRecord", payrollRecordSchema);