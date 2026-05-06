import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // ==========================================
    // 1. THÔNG TIN ĐỊNH DANH (IDENTIFICATION)
    // ==========================================
    employeeCode: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      description: "CMT - Mã NV"
    },
    fullName: { 
      type: String, 
      required: true, 
      trim: true,
      description: "Họ và tên"
    },

    // ✅ THÊM EMAIL
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"]
    },

    // ==========================================
    // 2. THÔNG TIN CÁ NHÂN
    // ==========================================
    personalInfo: {
      dateOfBirth: { type: Date },
      gender: { 
        type: String, 
        enum: ["Nam", "Nữ", "Khác"],
        default: "Khác"
      },
      idCardIssueDate: { type: Date },
      idCardIssuePlace: { type: String, trim: true },
      nationality: { type: String, default: "Việt Nam", trim: true },
      ethnicity: { type: String, trim: true },
      hometown: { type: String, trim: true },
      permanentAddress: { type: String, trim: true },
    },

    // ==========================================
    // 3. WORK
    // ==========================================
    workInfo: {
      department: { type: String, trim: true },
      position: { type: String, trim: true },
      title: { type: String, trim: true },
      profession: { type: String, trim: true },
      jobDescription: { type: String, trim: true },
      workingTime: { type: String, trim: true },
      equipmentProvided: { type: String, trim: true },
      transportation: { type: String, trim: true },
    },

    // ==========================================
    // 4. CONTRACT
    // ==========================================
    contractInfo: {
      contractNumber: { type: String, trim: true },
      contractType: { type: String, trim: true },
      signDate: { type: Date },
      endDate: { type: Date },
      probationStartDate: { type: Date },
      probationEndDate: { type: Date },
      compensationRegime: { type: String, trim: true },
    },

    // ==========================================
    // 5. SALARY
    // ==========================================
    salaryAndBenefits: {
      taxCode: { type: String, trim: true },
      socialInsuranceNumber: { type: String, trim: true },
      insuranceSalary: { type: Number, default: 0 },
      baseSalary: { type: Number, default: 0 },
      paymentMethod: { type: String, trim: true },
      paymentPeriod: { type: String, trim: true },
      allowances: {
        meal: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        phone: { type: Number, default: 0 },
        clothing: { type: Number, default: 0 },
        housing: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      bonuses: {
        general: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
      }
    },

    // ==========================================
    // 6. STATUS
    // ==========================================
    status: {
      type: String,
      enum: ["active", "probation", "on_leave", "resigned"],
      default: "active",
    }
  },
  { timestamps: true }
);

employeeSchema.index({ employeeCode: 1 });
employeeSchema.index({ email: 1 }); // ✅ thêm index email
employeeSchema.index({ "workInfo.department": 1 });

export const Employee = mongoose.model("Employee", employeeSchema);