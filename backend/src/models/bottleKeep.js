// models/bottleKeep.js
import mongoose from "mongoose";

const withdrawalHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  actionType: { type: String, enum: ["Gửi thêm", "Rót rượu", "Mượn thêm", "Trả rượu"], required: true },
  amountChanged: { type: String, required: true }, // VD: "+1 chai", "Rót 2 ly"
  note: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const bottleKeepSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    bottleName: { type: String, required: true },
    category: { type: String, default: "General" },
    
    // Phân loại: Khách Gửi hay Cho Mượn
    recordType: { type: String, enum: ["Gửi", "Mượn"], default: "Gửi" },
    expirationDate: { type: Date }, // Hạn sử dụng

    // Quản lý số lượng
    fullBottles: { type: Number, default: 0 },
    fraction: { 
      type: String, 
      enum: ["0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"], 
      default: "0" 
    },
    
    status: { type: String, enum: ["Đang giữ", "Đã lấy hết", "Đang mượn", "Đã trả hết"], default: "Đang giữ" },
    history: [withdrawalHistorySchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const BottleKeep = mongoose.model("BottleKeep", bottleKeepSchema);