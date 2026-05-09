import { OvertimePayRecord } from "../models/OvertimePayRecord.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";

export const getOTMonths = async (req, res) => {
  try {
    const months = await OvertimePayRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year" } }
    ]);
    res.status(200).json(months);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy danh sách kỳ OT" }); }
};

export const getOTByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const records = await OvertimePayRecord.find({ month: Number(month), year: Number(year) })
      .sort({ "employeeSnapshot.employeeCode": 1 });
    res.status(200).json(records);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy dữ liệu OT" }); }
};

// LIÊN KẾT CHÉO TỪ BẢNG CHẤM CÔNG SANG LƯƠNG OT
export const initializeOTMonth = async (req, res) => {
  try {
    const { month, year, standardDays } = req.body;

    const existing = await OvertimePayRecord.findOne({ month, year });
    if (existing) {
      await OvertimePayRecord.deleteMany({ month, year });
    }

    const attendances = await Attendance.find({ month, year }).populate("employee");
    if (attendances.length === 0) return res.status(400).json({ message: "Chưa có dữ liệu chấm công." });

    const otDocs = [];
    for (const att of attendances) {
      await att.save(); // Kích hoạt Hook để chắc chắn summary được tính toán mới nhất

      const emp = att.employee;
      if (!emp) continue;

      otDocs.push({
        month, year, employee: emp._id,
        employeeSnapshot: { employeeCode: emp.employeeCode, fullName: emp.fullName, position: emp.workInfo?.position },
        baseSalary: emp.salaryAndBenefits?.baseSalary || 0,
        standardDays: Number(standardDays) || 26,
        
        // ===============================================
        // ĐÃ SỬA: KHỚP 100% VỚI SCHEMA ATTENDANCE CỦA BẠN
        // ===============================================
        otData: {
          normalDays: att.summary.totalOTNormal || 0,     // Bốc chữ X
          weekendDays: att.summary.totalOTWeekend || 0,   // Bốc chữ N
          holidayDays: att.summary.totalOTHoliday || 0,   // Bốc chữ T
          hours: att.summary.totalShortfallHours || 0     // Bốc Số Giờ (+/-)
        }
      });
    }

    const createdRecords = await OvertimePayRecord.insertMany(otDocs);
    for (const rec of createdRecords) {
      const doc = await OvertimePayRecord.findById(rec._id);
      await doc.save(); // Gọi Hook nhân lương thành tiền
    }

    res.status(201).json({ message: "Đã bốc dữ liệu Chấm công và Tính lương OT thành công!" });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" }); 
  }
};

export const deleteOTMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    await OvertimePayRecord.deleteMany({ month: Number(month), year: Number(year) });
    res.status(200).json({ message: `Đã xóa bảng lương OT tháng ${month}/${year}.` });
  } catch (error) { res.status(500).json({ message: "Lỗi xóa bảng OT" }); }
};