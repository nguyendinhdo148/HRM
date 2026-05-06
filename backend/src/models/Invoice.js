import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    // Liên kết tới bảng Tháng
    monthBoard: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "InvoiceMonth", 
      required: true 
    },
    date: { type: Date, required: true },
    customerName: { type: String, default: "" },
    table: { type: String, default: "" },
    note: { type: String, default: "" },

    goodsAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    beforeServiceCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["UNPOSTED", "POSTED", "CANCELLED"],
      default: "UNPOSTED",
    },
    invoiceNumber: { type: String, default: "" },
    invoiceDate: { type: Date },
    
    taxCode: { type: String, default: "" },
    companyName: { type: String, default: "" },
    companyAddress: { type: String, default: "" },
    companyEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);