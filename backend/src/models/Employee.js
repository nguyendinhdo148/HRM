import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // Chỉ duy nhất Mã NV là unique: true
    employeeCode: { type: String, required: true, unique: true, trim: true, description: "Mã nhân viên nội bộ" },
    idCardNumber: { type: String, required: true, trim: true, description: "Số CCCD/CMND" }, // Xóa unique
    fullName: { type: String, required: true, trim: true, description: "Họ và tên" },
    email: { type: String, required: true, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"] },
    phoneNumber: { type: String, required: true, trim: true, description: "Số điện thoại" },

    personalInfo: {
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["Nam", "Nữ", "Khác"], default: "Nam" },
      idCardIssueDate: { type: Date },
      idCardIssuePlace: { type: String, trim: true },
      nationality: { type: String, default: "Việt Nam", trim: true },
      ethnicity: { type: String, trim: true },
      hometown: { type: String, trim: true },
      permanentAddress: { type: String, trim: true },
    },

    workInfo: {
      department: { type: String, trim: true },
      position: { type: String, trim: true },
      title: { type: String, trim: true },
      profession: { type: String, trim: true },
      jobDescription: { type: String, trim: true },
      workingTime: { type: String, trim: true },
      joinDate: { type: Date, required: true, description: "Ngày chính thức đi làm" },
      resignationDate: { type: Date, description: "Ngày nghỉ việc (nếu có)" },
    },

    contractInfo: {
      contractNumber: { type: String, trim: true },
      contractType: { 
        type: String, 
        enum: ["PROBATION", "FIXED_TERM", "INDEFINITE", "FREELANCE", "INTERNSHIP"],
        required: true 
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
      socialInsuranceNumber: { type: String, trim: true },
      insuranceSalary: { type: Number, default: 0 },
      baseSalary: { type: Number, default: 0 },
      
      paymentMethod: { type: String, trim: true },
      bankName: { type: String, trim: true, description: "Tên ngân hàng" },
      bankAccountNumber: { type: String, trim: true, description: "Số tài khoản" },
      paymentPeriod: { type: String, trim: true },
      
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

// Chỉ đánh index tìm kiếm, KHÔNG GẮN UNIQUE cho các trường này
employeeSchema.index({ employeeCode: 1 }); 
employeeSchema.index({ idCardNumber: 1 }); 
employeeSchema.index({ email: 1 });
employeeSchema.index({ phoneNumber: 1 });
employeeSchema.index({ "workInfo.department": 1 });

export const Employee = mongoose.model("Employee", employeeSchema);