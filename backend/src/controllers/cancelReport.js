import { CancelReport } from "../models/CancelReport.js";

// [CREATE] Tạo phiếu mới (Tạo vô tư trong cùng 1 ngày)
export const createReportLog = async (req, res) => {
  try {
    const { date, type, invoiceNumber, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Thiếu món" });

    const monthStr = date.substring(0, 7); 
    const newLog = new CancelReport({ date, monthStr, type, invoiceNumber, items });
    
    await newLog.save();
    return res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getReportsByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    const query = month ? { monthStr: month } : {};
    const logs = await CancelReport.find(query).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateReportLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, invoiceNumber, items } = req.body;
    const monthStr = date.substring(0, 7);

    const updated = await CancelReport.findByIdAndUpdate(
      id, { date, monthStr, type, invoiceNumber, items }, { new: true }
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteReportLog = async (req, res) => {
  try {
    await CancelReport.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMonthReports = async (req, res) => {
  try {
    const { month } = req.params;
    await CancelReport.deleteMany({ monthStr: month });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};