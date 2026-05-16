import { Attendance } from "../models/Attendance.js";
import { AttendanceMonth } from "../models/AttendanceMonth.js";
import { Employee } from "../models/Employee.js";

// Hàm hỗ trợ đếm số ngày trong tháng
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

// ==========================================
// 1. LẤY DANH SÁCH CÁC THÁNG ĐÃ KHỞI TẠO
// ==========================================
export const getAttendanceMonths = async (req, res) => {
  try {
    const months = await AttendanceMonth.find().sort({ year: -1, month: -1 });
    res.status(200).json(months);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách kỳ chấm công" });
  }
};

// ==========================================
// 2. LẤY CHI TIẾT BẢNG CHẤM CÔNG CỦA 1 THÁNG
// ==========================================
export const getAttendanceByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Thiếu tháng hoặc năm" });

    const attendances = await Attendance.find({ month: Number(month), year: Number(year) })
      .populate("employee", "employeeCode fullName workInfo salaryAndBenefits status")
      .sort({ "employee.employeeCode": 1 }); // Sắp xếp theo mã nhân viên

    res.status(200).json(attendances);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy dữ liệu chấm công" });
  }
};

// ==========================================
// 3. KHỞI TẠO BẢNG CHẤM CÔNG THÁNG MỚI
// ==========================================
export const initializeMonthAttendance = async (req, res) => {
  try {
    const { month, year } = req.body;

    // 1. Kiểm tra xem tháng này đã tạo chưa
    const existingMonth = await AttendanceMonth.findOne({ month, year });
    if (existingMonth) {
      if (existingMonth.status === "closed") {
        return res.status(400).json({ message: "Kỳ chấm công này đã bị khóa, không thể chạy lại đồng bộ!" });
      }
      await Attendance.deleteMany({ month, year });
      await AttendanceMonth.findByIdAndDelete(existingMonth._id);
    }

    // 2. Lấy danh sách nhân viên ĐANG HOẠT ĐỘNG
    const activeEmployees = await Employee.find({ status: "active" });
    if (activeEmployees.length === 0) {
      return res.status(400).json({ message: "Không có nhân viên nào đang hoạt động để tạo bảng công!" });
    }

    // 3. Setup mặc định (Mặc định để trắng "", rỗng OT/Shortfall/KPI)
    const daysInMonth = getDaysInMonth(month, year);
    const defaultRecords = {};
    const defaultOTRecords = {};
    const defaultShortfallRecords = {};
    const defaultKpiRecords = {}; // Setup KPI mặc định

    for (let day = 1; day <= daysInMonth; day++) {
      // ĐÃ SỬA: Để trống "" thay vì "x" như trước đây
      defaultRecords[day.toString()] = "";
    }

    // 4. Lưu vào bảng AttendanceMonth trước
    const newMonth = await AttendanceMonth.create({
      month,
      year,
      status: "open",
      totalEmployees: activeEmployees.length
    });

    // 5. Chuẩn bị mảng data cho bảng Attendance
    const attendanceDocs = activeEmployees.map((emp) => ({
      employee: emp._id,
      month,
      year,
      advancePayment: 0,
      records: defaultRecords,
      overtimeRecords: defaultOTRecords,
      shortfallRecords: defaultShortfallRecords,
      kpiRecords: defaultKpiRecords // Gắn mảng KPI rỗng vào lúc khởi tạo
    }));

    // 6. Insert tất cả vào DB (Sử dụng create để chạy pre-save hook ngay lập tức)
    await Attendance.create(attendanceDocs);

    res.status(201).json({ 
      message: `Đã khởi tạo thành công tháng ${month}/${year} cho ${activeEmployees.length} nhân sự.`,
      data: newMonth
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi khởi tạo bảng chấm công" });
  }
};

// ==========================================
// 4. SỬA CÔNG CỦA 1 NHÂN VIÊN (CẬP NHẬT FULL ROW)
// ==========================================
export const updateAttendanceBulk = async (req, res) => {
  try {
    const { recordId } = req.params;
    // Lấy tất cả tham số truyền lên từ Frontend (Bao gồm cả kpiRecords)
    const { advancePayment, records, overtimeRecords, shortfallRecords, kpiRecords } = req.body;

    const attendance = await Attendance.findById(recordId);
    if (!attendance) return res.status(404).json({ message: "Không tìm thấy dữ liệu nhân viên này" });

    // Kiểm tra xem tháng có bị khóa (chốt công) chưa
    const monthData = await AttendanceMonth.findOne({ month: attendance.month, year: attendance.year });
    if (monthData && monthData.status === "closed") {
      return res.status(403).json({ message: "Kỳ chấm công này đã bị khóa, không thể sửa chữa!" });
    }

    // Cập nhật các trường
    attendance.advancePayment = advancePayment !== undefined ? advancePayment : attendance.advancePayment;
    if (records) attendance.records = records;
    if (overtimeRecords) attendance.overtimeRecords = overtimeRecords;
    if (shortfallRecords) attendance.shortfallRecords = shortfallRecords;
    
    // ✅ CẬP NHẬT TRƯỜNG KPI SHOW
    if (kpiRecords) attendance.kpiRecords = kpiRecords;

    // Gọi save() -> Hook pre('save') trong Model Attendance sẽ tự động quét tính tổng công, tổng giờ, và tổng show
    await attendance.save();

    res.status(200).json({ message: "Cập nhật thành công", data: attendance });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật bảng công" });
  }
};

// ==========================================
// 5. XÓA KỲ CHẤM CÔNG (Nếu tạo nhầm)
// ==========================================
export const deleteAttendanceMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    const monthData = await AttendanceMonth.findOne({ month: Number(month), year: Number(year) });
    if (!monthData) return res.status(404).json({ message: "Không tìm thấy kỳ chấm công này" });

    if (monthData.status === "closed") {
      return res.status(403).json({ message: "Tháng này đã chốt công, không được phép xóa!" });
    }

    await Attendance.deleteMany({ month: Number(month), year: Number(year) });
    await AttendanceMonth.findByIdAndDelete(monthData._id);

    res.status(200).json({ message: `Đã xóa toàn bộ dữ liệu chấm công tháng ${month}/${year}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa kỳ chấm công" });
  }
};

// ==========================================
// 6. CHỐT CÔNG (Khóa tháng, không cho sửa)
// ==========================================
export const toggleMonthStatus = async (req, res) => {
  try {
    const { id } = req.params; 
    const { status } = req.body; 

    const monthData = await AttendanceMonth.findByIdAndUpdate(id, { status }, { new: true });
    if (!monthData) return res.status(404).json({ message: "Không tìm thấy kỳ chấm công" });

    res.status(200).json({ message: `Đã chuyển trạng thái thành: ${status}`, data: monthData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi đổi trạng thái kỳ chấm công" });
  }
};