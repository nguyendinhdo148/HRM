import { Invoice } from "../models/Invoice.js";
import { InvoiceMonth } from "../models/InvoiceMonth.js";

// [CREATE] Tạo Hóa Đơn Mới (Và nhét nó vào Tháng tương ứng)
export const createInvoice = async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    const savedInvoice = await newInvoice.save();

    // Push ID của bill này vào mảng invoices của Tháng
    await InvoiceMonth.findByIdAndUpdate(
      req.body.monthBoard,
      { $push: { invoices: savedInvoice._id } }
    );

    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(400).json({ message: "Lỗi tạo hóa đơn", error: error.message });
  }
};

// [UPDATE] Cập nhật hóa đơn
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await Invoice.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedInvoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: "Lỗi cập nhật", error: error.message });
  }
};

// [DELETE] Xóa Hóa đơn (Và gỡ nó khỏi Tháng)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    // Kéo ID bill này ra khỏi bảng Tháng
    await InvoiceMonth.findByIdAndUpdate(
      deletedInvoice.monthBoard,
      { $pull: { invoices: deletedInvoice._id } }
    );

    res.status(200).json({ message: "Xóa hóa đơn thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa dữ liệu", error: error.message });
  }
};