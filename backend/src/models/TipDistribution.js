import mongoose from "mongoose";

const tipDistributionSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    periodName: { type: String, required: true },
    totalTip: { type: Number, required: true },
    bonusAmount: { type: Number, default: 500000 },
    serviceFundPercent: { type: Number, default: 5 },
    totalDays: { type: Number, required: true },
    tipPerDay: { type: Number, required: true },
    details: [
      {
        employeeName: { type: String, required: true },
        department: { type: String, enum: ["FOH", "BOH"], required: true },
        workDays: { type: Number, required: true },
        isTopPerformer: { type: Boolean, default: false },
        baseTip: { type: Number, required: true },
        fundDeduction: { type: Number, required: true },
        penalty: { type: Number, default: 0 }, // THÊM TRƯỜNG NÀY
        finalTip: { type: Number, required: true },
      }
    ]
  },
  { timestamps: true }
);

export const TipDistribution = mongoose.model("TipDistribution", tipDistributionSchema);