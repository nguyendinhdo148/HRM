import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String, enum: ["FOH", "BOH"], required: true },
    isActive: { type: Boolean, default: true } // Ẩn đi nếu nhân viên nghỉ việc
  },
  { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);