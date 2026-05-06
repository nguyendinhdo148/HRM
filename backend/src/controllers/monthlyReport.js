import MonthlyReport from "../models/monthlyReport.js";
import DailyRevenue from "../models/dailyRevenue.js";

// [POST] Tạo tháng mới
export const create = async (req, res) => {
  try {
    const { monthKey, title } = req.body;
    const newReport = new MonthlyReport({ monthKey, title });
    await newReport.save();
    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Tháng này đã tồn tại!" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] Lấy danh sách các tháng (Tự động cộng dồn doanh thu các ngày bên trong)
export const getAll = async (req, res) => {
  try {
    const reports = await MonthlyReport.aggregate([
      {
        $lookup: {
          from: "dailyrevenues", // Tên collection con trong MongoDB (chữ thường, có 's')
          localField: "_id",
          foreignField: "reportId",
          as: "dailyData"
        }
      },
      {
        $addFields: {
          totalGross: { $sum: "$dailyData.totalGross" },
          preTaxRevenue: { $sum: "$dailyData.preTaxRevenue" },
          guestCount: { $sum: "$dailyData.guestCount" },
          billCount: { $sum: "$dailyData.billCount" },
          daysCount: { $size: "$dailyData" } // Đếm số ngày đã nhập
        }
      },
      { $project: { dailyData: 0 } }, // Ẩn mảng chi tiết đi cho nhẹ API
      { $sort: { monthKey: -1 } } // Sắp xếp tháng mới nhất lên đầu
    ]);
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] XOÁ THÁNG LÀ XOÁ SẠCH DỮ LIỆU NGÀY BÊN TRONG
export const remove = async (req, res) => {
  try {
    const reportId = req.params.id;
    await MonthlyReport.findByIdAndDelete(reportId);
    // Lệnh này quét sạch các báo cáo ngày thuộc tháng này
    await DailyRevenue.deleteMany({ reportId: reportId }); 
    
    res.status(200).json({ success: true, message: "Đã xoá tháng và toàn bộ dữ liệu ngày bên trong." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};