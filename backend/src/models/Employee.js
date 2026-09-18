import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true, description: "Mã nhân viên nội bộ" },
    idCardNumber: { type: String, trim: true, description: "Số CCCD/CMND" },
    fullName: { type: String, trim: true, description: "Họ và tên" },
    email: { type: String, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true, description: "Số điện thoại" },

    personalInfo: {
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["Nam", "Nữ", "Khác"], default: "Nam" },
      idCardIssueDate: { type: Date },
      idCardIssuePlace: { type: String, trim: true },
      nationality: { type: String, default: "Việt Nam", trim: true },
      ethnicity: { type: String, trim: true },
      hometown: { type: String, trim: true },

      permanentAddress: {
        houseStreet: { type: String, trim: true, description: "Số nhà + tên đường" },
        ward: { type: String, trim: true, description: "Phường/Xã" },
        province: { type: String, trim: true, description: "Tỉnh/TP" },
      },

      currentAddress: {
        houseStreet: { type: String, trim: true, description: "Số nhà + tên đường" },
        ward: { type: String, trim: true, description: "Phường/Xã" },
        province: { type: String, trim: true, description: "Tỉnh/TP" },
      },
    },

    workInfo: {
      department: { type: String, trim: true },
      position: { type: String, trim: true },
      title: { type: String, trim: true },
      profession: { type: String, trim: true },
      jobDescription: { type: String, trim: true },
      workingTime: { type: String, trim: true },
      joinDate: { type: Date, description: "Ngày chính thức đi làm" },
      resignationDate: { type: Date, description: "Ngày nghỉ việc (nếu có)" },
    },

    contractInfo: {
      contractNumber: { type: String, trim: true },
      contractType: { 
        type: String, 
        enum: ["PROBATION", "FIXED_TERM", "INDEFINITE", "FREELANCE", "INTERNSHIP"],
        default: "PROBATION"
      },
      contractDuration: { type: String, trim: true, description: "Thời hạn HĐ" },
      signDate: { type: Date },
      endDate: { type: Date },
      probationStartDate: { type: Date },
      probationEndDate: { type: Date },
      compensationRegime: { type: String, trim: true },
    },

    salaryAndBenefits: {
      taxCode: { type: String, trim: true },
      dependents: { type: Number, default: 0, description: "Số người phụ thuộc" },
      socialInsuranceNumber: { type: String, trim: true },
      insuranceSalary: { type: Number, default: 0 },
      baseSalary: { type: Number, default: 0 },
      
      paymentMethod: { type: String, trim: true },
      bankName: { type: String, trim: true, description: "Tên ngân hàng" },
      bankAccountNumber: { type: String, trim: true, description: "Số tài khoản" },
      paymentPeriod: { type: String, trim: true },

      // ===== PHỤ CẤP Ở =====
      housingCost: { type: Number, default: 0, description: "Chi phí ở" },
      dormitoryDeduction: { type: Number, default: 0, description: "KTX tt VS (khấu trừ KTX)" },
      housingAllowance: { type: Number, default: 0, description: "Phụ cấp Ở = Chi phí ở - KTX tt VS" },

      // ===== ĐƠN GIÁ SHOW, ĂN CA & CA TẬP =====
      minishowRate: { type: Number, default: 65000, description: "Đơn giá Mini Show" },
      bigshowRate: { type: Number, default: 213462, description: "Đơn giá Big Show" },
      mealRate: { type: Number, default: 0, description: "Tiền ăn/công = 1.800.000/26" },
      // ===== PHỤ CẤP CA TẬP / CÔNG =====
      // Nhập đơn giá/công, backend sẽ nhân với actualDays khi gom lương (giống Tiền ăn ca, không trần)
      trainingAllowanceRate: { type: Number, default: 0, description: "Phụ cấp ca tập / công (VD: 39.000)" },
      trainingAllowance: { type: Number, default: 0, description: "Phụ cấp ca tập (giá trị cuối = rate × actualDays)" },
      
      bonuses: {
        general: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        responsibility: { type: Number, default: 0, description: "Thưởng trách nhiệm ngày công" } 
      }
    },

    status: {
      type: String,
      enum: ["active", "probation", "on_leave", "resigned"],
      default: "active",
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

employeeSchema.virtual("workingDuration").get(function () {
  if (!this.workInfo?.joinDate) return null;
  const start = new Date(this.workInfo.joinDate);
  const end = this.workInfo.resignationDate ? new Date(this.workInfo.resignationDate) : new Date();

  if (start > end) return "Chưa bắt đầu làm việc";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    days,
    totalDays: Math.floor((end - start) / (1000 * 60 * 60 * 24)),
    formatted: `${years} năm, ${months} tháng, ${days} ngày`
  };
});

employeeSchema.virtual("currentContractStatus").get(function () {
  const { contractType, endDate, probationEndDate } = this.contractInfo;
  if (contractType === "INDEFINITE") return "KHONG_THOI_HAN";

  const targetDate = contractType === "PROBATION" ? probationEndDate : endDate;
  if (!targetDate) return "CHUA_XAC_DINH";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);

  if (end < today) return "HET_HAN";
  return "CON_HAN";
});

employeeSchema.index({ idCardNumber: 1 }); 
employeeSchema.index({ email: 1 });
employeeSchema.index({ phoneNumber: 1 });
employeeSchema.index({ "workInfo.department": 1 });

export const Employee = mongoose.model("Employee", employeeSchema);