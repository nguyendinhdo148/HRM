import mongoose from "mongoose";

const payrollMonthSchema = new mongoose.Schema(
  {
    month: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12 
    },
    year: { 
      type: Number, 
      required: true 
    },
    status: {
      type: String,
      enum: ["draft", "approved", "paid"],
      default: "draft", // draft: đang nháp, approved: đã khóa, paid: đã thanh toán
    },
    totalEmployees: { 
      type: Number, 
      default: 0 
    },
    totalGross: { 
      type: Number, 
      default: 0,
      description: "Tổng lương trước thuế/BH của toàn công ty tháng này"
    },
    totalNet: { 
      type: Number, 
      default: 0,
      description: "Tổng thực lĩnh phải trả"
    },
  },
  { timestamps: true }
);

// Đảm bảo không tạo trùng 2 kỳ lương cho cùng 1 tháng
payrollMonthSchema.index({ month: 1, year: 1 }, { unique: true });

export const PayrollMonth = mongoose.model("PayrollMonth", payrollMonthSchema);