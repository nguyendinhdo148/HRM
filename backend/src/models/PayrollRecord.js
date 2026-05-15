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
      overtime: { type: Number, default: 0 },
      miniShowMoney: { type: Number, default: 0 },
      bigShowMoney: { type: Number, default: 0 },
      kpiBonus: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      totalGross: { type: Number, default: 0 },
      allowances: {
        meal: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        phone: { type: Number, default: 0 },
        clothing: { type: Number, default: 0 },
        housing: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      }
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
    isEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

payrollRecordSchema.index({ month: 1, year: 1, employee: 1 }, { unique: true });


export const PayrollRecord = mongoose.model("PayrollRecord", payrollRecordSchema);