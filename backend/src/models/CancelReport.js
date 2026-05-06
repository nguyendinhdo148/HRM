import mongoose from "mongoose";

const cancelItemSchema = new mongoose.Schema({
  category: { type: String },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 }
});

const cancelReportSchema = new mongoose.Schema({
  date: { type: String, required: true }, 
  monthStr: { type: String, required: true }, 
  type: { type: String, enum: ["UNPOSTED", "POSTED"], required: true }, 
  invoiceNumber: { type: String, default: "" }, // Lưu số Hóa đơn
  items: [cancelItemSchema]
}, { timestamps: true });

// ĐỔI TÊN THÀNH CancelTicket ĐỂ MONGODB XÓA CÁI LUẬT BỊ LỖI CŨ ĐI
export const CancelReport = mongoose.model("CancelTicket", cancelReportSchema);