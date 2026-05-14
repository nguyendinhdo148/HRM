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

    // ==========================================
    // CÁC KHOẢN THU NHẬP (INCOMES)
    // ==========================================
    // Tìm đến phần schema định nghĩa incomes và sửa lại thành:

incomes: {
  timeSalary: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  
  // 1. Thêm 2 trường mới cho Show và KPI
  miniShowMoney: { type: Number, default: 0 },
  bigShowMoney: { type: Number, default: 0 },
  kpiBonus: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  totalGross: { type: Number, default: 0 },

  // 2. Chuyển allowances từ Mảng (Array []) sang Object {}
  allowances: {
    meal: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    phone: { type: Number, default: 0 },
    clothing: { type: Number, default: 0 },
    housing: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  }
},

    // ==========================================
    // CÁC KHOẢN KHẤU TRỪ (DEDUCTIONS)
    // ==========================================
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

    isEmailSent: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

payrollRecordSchema.index({ month: 1, year: 1, employee: 1 }, { unique: true });

// ==========================================
// HOOK: TỰ ĐỘNG TÍNH TOÁN LƯƠNG
// ==========================================
payrollRecordSchema.pre("save", function (next) {
  // 1. Tính lương theo thời gian thực tế
  this.incomes.timeSalary = this.standardDays > 0 
    ? Math.round((this.baseSalary / this.standardDays) * this.actualDays)
    : 0;

  // 2. Tính tổng phụ cấp từ mảng linh hoạt
  let totalAllw = 0;
  if (this.incomes.allowances && this.incomes.allowances.length > 0) {
    totalAllw = this.incomes.allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  // 3. Tính tiền thưởng trách nhiệm (Theo công thức Yêu cầu 11)
  const mini = this.incomes.kpiShow.totalMinishow || 0;
  const big = this.incomes.kpiShow.totalBigshow || 0;
  const respBase = this.incomes.responsibility.baseAmount || 0;
  const stdDays = this.standardDays || 26; // Tránh chia cho 0

  if (respBase > 0) {
    const kpiFactor = ((mini / 5) + big) / 2;
    this.incomes.responsibility.calculatedAmount = Math.round((respBase / stdDays) * kpiFactor);
  } else {
    this.incomes.responsibility.calculatedAmount = 0;
  }

  // 4. Tính Total Gross (Gộp TẤT CẢ thu nhập để làm cơ sở tính Thuế TNCN sau này)
  this.incomes.totalGross = 
    this.incomes.timeSalary + 
    totalAllw + 
    this.incomes.overtime + 
    this.incomes.bonus + 
    this.incomes.kpiShow.amount + // Tiền từ show
    this.incomes.responsibility.calculatedAmount; // Tiền thưởng trách nhiệm

  // 5. Tính Khấu trừ
  this.deductions.insurance.total = 
    this.deductions.insurance.bhxh + 
    this.deductions.insurance.bhyt + 
    this.deductions.insurance.bhtn;
    
  this.deductions.totalDeductions = 
    this.deductions.advance + 
    this.deductions.insurance.total + 
    this.deductions.taxTNCN;

  // 6. Lương thực nhận
  this.netSalary = this.incomes.totalGross - this.deductions.totalDeductions;
  if (this.netSalary < 0) this.netSalary = 0;

  next();
});

export const PayrollRecord = mongoose.model("PayrollRecord", payrollRecordSchema);