import { InsuranceRecord } from "../models/InsuranceRecord.js";
import { Employee } from "../models/Employee.js";

// ==========================================
// 1. LẤY DANH SÁCH CÁC THÁNG ĐÃ KHỞI TẠO
// ==========================================
export const getInsuranceMonths = async (req, res) => {
  try {
    // Gom nhóm các tháng đã tạo bảng BH
    const months = await InsuranceRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year" } }
    ]);
    res.status(200).json(months);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách kỳ Bảo hiểm" });
  }
};

// ==========================================
// 2. LẤY CHI TIẾT BẢNG BH CỦA 1 THÁNG
// ==========================================
export const getInsuranceByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Thiếu tháng hoặc năm" });

    const records = await InsuranceRecord.find({ month: Number(month), year: Number(year) })
      .sort({ "employeeSnapshot.employeeCode": 1 });

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy dữ liệu Bảo hiểm" });
  }
};

// ==========================================
// 3. KHỞI TẠO BẢNG TÍNH BẢO HIỂM THÁNG MỚI
// ==========================================
export const initializeInsuranceMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    // 1. Kiểm tra xem tháng này đã tạo chưa
    const existingData = await InsuranceRecord.findOne({ month, year });
    if (existingData) {
      await InsuranceRecord.deleteMany({ month, year });
    }

    // 2. Lấy danh sách nhân viên ĐANG HOẠT ĐỘNG
    const activeEmployees = await Employee.find({ status: "active" });
    if (activeEmployees.length === 0) {
      return res.status(400).json({ message: "Không có nhân viên nào đang hoạt động!" });
    }

    // 3. Map dữ liệu để chuẩn bị insert
    const insuranceDocs = activeEmployees.map((emp) => {
      const insSalary = emp.salaryAndBenefits?.insuranceSalary || emp.salaryAndBenefits?.baseSalary || 0;

      return {
        month,
        year,
        employee: emp._id,
        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position: emp.workInfo?.position || "Chưa có", // ✅ Sửa thành workInfo.position
          department: emp.workInfo?.department || "N/A"
        },
        insuranceSalary: insSalary,
      };
    });

    // 4. Insert vào DB
    const createdRecords = await InsuranceRecord.insertMany(insuranceDocs);

    // 5. Chạy Hook save() để Mongoose tự động nhân chia tỷ lệ 21.5% (Đã bỏ KPCĐ) và 10.5% (Như đã viết ở Model)
    for (const doc of createdRecords) {
      const record = await InsuranceRecord.findById(doc._id);
      await record.save(); 
    }

    res.status(201).json({ 
      message: `Đã khởi tạo Bảng bảo hiểm tháng ${month}/${year} cho ${activeEmployees.length} nhân sự.` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi khởi tạo bảng Bảo hiểm" });
  }
};

// ==========================================
// 4. XÓA BẢNG BẢO HIỂM CỦA 1 THÁNG
// ==========================================
export const deleteInsuranceMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Vui lòng cung cấp tháng và năm cần xóa." });
    }

    // Xóa tất cả các record bảo hiểm của tháng/năm đó
    const result = await InsuranceRecord.deleteMany({ 
      month: Number(month), 
      year: Number(year) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu bảo hiểm của tháng này để xóa." });
    }

    res.status(200).json({ message: `Đã xóa thành công toàn bộ dữ liệu bảo hiểm tháng ${month}/${year}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa bảng Bảo hiểm" });
  }
};