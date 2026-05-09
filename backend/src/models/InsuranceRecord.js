import mongoose from "mongoose";

const insuranceRecordSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    
    employeeSnapshot: {
      employeeCode: String,
      fullName: String,
      position: String,
    },

    insuranceSalary: { type: Number, required: true },

    companyPays: {
      bhxh: { type: Number, default: 0 }, 
      bhyt: { type: Number, default: 0 }, 
      bhtn: { type: Number, default: 0 }, 
      kpcd: { type: Number, default: 0 }, 
      total: { type: Number, default: 0 } 
    },

    employeePays: {
      bhxh: { type: Number, default: 0 }, 
      bhyt: { type: Number, default: 0 }, 
      bhtn: { type: Number, default: 0 }, 
      total: { type: Number, default: 0 } 
    },
  },
  { timestamps: true }
);

// HOOK: TỰ ĐỘNG TÍNH TOÁN FULL LƯƠNG (KHÔNG ÁP TRẦN)
insuranceRecordSchema.pre("save", function (next) {
  let salary = this.insuranceSalary || 0;

  // ==============================================
  // 1. DOANH NGHIỆP ĐÓNG (Bảo hiểm 21.5% + KPCĐ 2%)
  // ==============================================
  this.companyPays.bhxh = Math.round(salary * 0.18);   
  this.companyPays.bhyt = Math.round(salary * 0.03);   
  this.companyPays.bhtn = Math.round(salary * 0.005);  
  this.companyPays.kpcd = Math.round(salary * 0.02);   
  this.companyPays.total = this.companyPays.bhxh + this.companyPays.bhyt + this.companyPays.bhtn + this.companyPays.kpcd;

  // ==============================================
  // 2. NGƯỜI LAO ĐỘNG ĐÓNG (10.5%)
  // ==============================================
  this.employeePays.bhxh = Math.round(salary * 0.08);  
  this.employeePays.bhyt = Math.round(salary * 0.015); 
  this.employeePays.bhtn = Math.round(salary * 0.01);  
  this.employeePays.total = this.employeePays.bhxh + this.employeePays.bhyt + this.employeePays.bhtn;

  next();
});

export const InsuranceRecord = mongoose.model("InsuranceRecord", insuranceRecordSchema);