import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3b82f6", // Màu sắc đại diện cho phòng ban
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Trưởng phòng
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);