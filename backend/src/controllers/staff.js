import { Staff } from "../models/Staff.js";

// Lấy danh sách nhân sự đang làm việc
export const getActiveStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).sort({ department: -1, name: 1 });
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Thêm nhân sự mới
export const createStaff = async (req, res) => {
  try {
    const { name, department } = req.body;
    const newStaff = new Staff({ name, department });
    await newStaff.save();
    return res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Cập nhật thông tin nhân sự
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, isActive } = req.body;
    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      { name, department, isActive },
      { new: true }
    );
    return res.status(200).json({ success: true, data: updatedStaff });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Xóa nhân sự
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await Staff.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};