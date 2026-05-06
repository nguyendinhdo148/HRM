import { InvoiceMonth } from "../models/InvoiceMonth.js";

// [CREATE] Tạo tháng mới
export const createMonthBoard = async (req, res) => {
  try {
    const { monthStr, note } = req.body;
    const existingMonth = await InvoiceMonth.findOne({ monthStr });
    if (existingMonth) return res.status(400).json({ message: "Tháng này đã được tạo!" });

    const newMonth = new InvoiceMonth({ monthStr, note });
    await newMonth.save();
    res.status(201).json(newMonth);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo tháng", error: error.message });
  }
};

// [READ ALL] Lấy danh sách tất cả các tháng (dùng cho filter dropdown nếu cần)
export const getAllMonths = async (req, res) => {
  try {
    const months = await InvoiceMonth.find().sort({ monthStr: -1 }).select("-invoices");
    res.status(200).json(months);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách", error: error.message });
  }
};

// [READ ONE] Lấy 1 tháng chi tiết kèm toàn bộ bill bên trong
export const getMonthDetails = async (req, res) => {
  try {
    const { monthStr } = req.params;
    const monthBoard = await InvoiceMonth.findOne({ monthStr }).populate({
      path: "invoices",
      options: { sort: { date: -1 } } // Sắp xếp bill mới nhất lên đầu
    });
    
    if (!monthBoard) return res.status(404).json({ message: "Chưa có dữ liệu" });
    res.status(200).json(monthBoard);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu", error: error.message });
  }
};

// [UPDATE] Sửa thông tin tháng (VD: Đổi ghi chú hoặc khóa sổ)
export const updateMonthBoard = async (req, res) => {
  try {
    const { monthStr } = req.params;
    const updatedMonth = await InvoiceMonth.findOneAndUpdate(
      { monthStr },
      req.body,
      { new: true }
    );
    if (!updatedMonth) return res.status(404).json({ message: "Không tìm thấy tháng" });
    res.status(200).json(updatedMonth);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
  }
};

// [DELETE] Xóa tháng (Sẽ tự động trigger xóa các bill bên trong nhờ Hook bên Model)
export const deleteMonthBoard = async (req, res) => {
  try {
    const { monthStr } = req.params;
    const deletedMonth = await InvoiceMonth.findOneAndDelete({ monthStr });
    if (!deletedMonth) return res.status(404).json({ message: "Không tìm thấy tháng" });
    res.status(200).json({ message: "Xóa tháng thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa", error: error.message });
  }
};