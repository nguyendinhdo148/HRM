import DailyRevenue from "../models/dailyRevenue.js"; // Nhớ đổi tên import cho khớp với model mới

// [POST] Thêm doanh thu ngày mới (Frontend đã gửi kèm reportId trong req.body)
export const create = async (req, res) => {
  try {
    const newRevenue = new DailyRevenue(req.body);
    const savedRevenue = await newRevenue.save();
    return res.status(201).json({ success: true, data: savedRevenue });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Doanh thu ngày này đã tồn tại!" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] Lấy danh sách doanh thu CỦA 1 THÁNG (Lọc theo reportId)
export const getAll = async (req, res) => {
  try {
    const { reportId, search, sort = "desc" } = req.query;
    let query = {};

    // BẮT BUỘC LỌC THEO THÁNG: Chỉ lấy các ngày thuộc về reportId này
    if (reportId) {
      query.reportId = reportId;
    }

    // Tìm kiếm theo ghi chú hoặc ngày
    if (search) {
      query.$or = [
        { note: { $regex: search, $options: "i" } },
        { date: { $regex: search, $options: "i" } },
      ];
    }

    const sortDirection = sort === "asc" ? 1 : -1;
    const revenues = await DailyRevenue.find(query).sort({ date: sortDirection });

    return res.status(200).json({ success: true, data: revenues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] Lấy chi tiết 1 ngày
export const getById = async (req, res) => {
  try {
    const revenue = await DailyRevenue.findById(req.params.id);
    if (!revenue) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu" });
    return res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// [PUT] Cập nhật báo cáo ngày (Tự động tính lại tổng tiền)
export const update = async (req, res) => {
  try {
    const { cash, transfer, card, debt, ...rest } = req.body;
    
    // Tính toán lại tổng tiền từ body truyền lên
    const totalGross = (cash || 0) + (transfer || 0) + (card || 0) + (debt || 0);

    const updatedRevenue = await DailyRevenue.findByIdAndUpdate(
      req.params.id,
      { cash, transfer, card, debt, totalGross, ...rest },
      { new: true, runValidators: true }
    );

    if (!updatedRevenue) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu để sửa" });
    return res.status(200).json({ success: true, data: updatedRevenue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] Xóa báo cáo ngày
export const remove = async (req, res) => {
  try {
    const deletedRevenue = await DailyRevenue.findByIdAndDelete(req.params.id);
    if (!deletedRevenue) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu để xóa" });
    return res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};