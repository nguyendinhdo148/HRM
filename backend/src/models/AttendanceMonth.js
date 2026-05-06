import mongoose from "mongoose";

const attendanceMonthSchema = new mongoose.Schema(
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
      enum: ["open", "closed"], // open: đang chấm, closed: đã chốt công (không cho sửa)
      default: "open",
    },
    totalEmployees: { 
      type: Number, 
      default: 0,
      description: "Số nhân sự được tạo trong tháng này"
    }
  },
  { timestamps: true }
);

// Đảm bảo không tạo trùng 2 bảng cho cùng 1 tháng
attendanceMonthSchema.index({ month: 1, year: 1 }, { unique: true });

export const AttendanceMonth = mongoose.model("AttendanceMonth", attendanceMonthSchema);