import mongoose from "mongoose";

const invoiceMonthSchema = new mongoose.Schema(
  {
    monthStr: { 
      type: String, 
      required: true, 
      unique: true // VD: "2026-03"
    },
    note: { 
      type: String, 
      default: "" 
    },
    isClosed: { 
      type: Boolean, 
      default: false // Trạng thái chốt sổ
    },
    // Chứa danh sách ID của các bill thuộc tháng này (1-N)
    invoices: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }
    ]
  },
  { timestamps: true }
);

// HOOK TỰ ĐỘNG XÓA: Khi xóa Tháng, xóa luôn toàn bộ Hóa đơn (Bill) bên trong
invoiceMonthSchema.pre('findOneAndDelete', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
      await mongoose.model('Invoice').deleteMany({ monthBoard: doc._id });
  }
  next();
});

export const InvoiceMonth = mongoose.model("InvoiceMonth", invoiceMonthSchema);