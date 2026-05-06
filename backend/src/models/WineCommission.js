import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  wineId: { type: String, required: true },
  wineName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true }
});

const wineCommissionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // Ngày bán (YYYY-MM-DD)
    monthStr: { type: String, required: true }, // Tháng để lọc (YYYY-MM)
    staffName: { type: String, required: true }, // Tên nhân viên FOH
    customerName: { type: String, default: "" }, // Tên khách
    items: [itemSchema], // Mảng các chai rượu trong Bill
    totalBillAmount: { type: Number, required: true }, // Tổng tiền cả Bill
    commissionEarned: { type: Number, required: true }, // Hoa hồng nhận được
    isVipRuleApplied: { type: Boolean, default: false }, // Bill có chai >= 10tr
  },
  { timestamps: true }
);

export const WineCommission = mongoose.model("WineCommission", wineCommissionSchema);