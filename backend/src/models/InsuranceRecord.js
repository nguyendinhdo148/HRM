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
    // Nếu nhân sự làm < 15 ngày trong tháng này thì không tham gia BH
    excludedFromInsurance: { type: Boolean, default: false },

    companyPays: {
      bhxh: { type: Number, default: 0 }, 
      bhyt: { type: Number, default: 0 }, 
      bhtn: { type: Number, default: 0 }, 
      // ❌ Đã xóa KPCĐ và Tổng CP Doanh Nghiệp theo Yêu cầu 7, 8
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

  // Nếu nhân sự bị loại khỏi đóng BH (ví dụ làm < 15 ngày) thì đặt mọi khoản đóng = 0
  if (this.excludedFromInsurance) {
    this.companyPays.bhxh = 0;
    this.companyPays.bhyt = 0;
    this.companyPays.bhtn = 0;

    this.employeePays.bhxh = 0;
    this.employeePays.bhyt = 0;
    this.employeePays.bhtn = 0;
    this.employeePays.total = 0;
    return next();
  }

  // ==============================================
  // 1. DOANH NGHIỆP ĐÓNG (Chỉ tính Bảo hiểm 21.5%)
  // ==============================================
  this.companyPays.bhxh = Math.round(salary * 0.18);   
  this.companyPays.bhyt = Math.round(salary * 0.03);   
  this.companyPays.bhtn = Math.round(salary * 0.005);  
  // ❌ Đã xóa logic tính KPCĐ và tính Tổng CP Doanh Nghiệp

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