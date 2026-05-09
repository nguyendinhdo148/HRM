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
// 3. KHỞI TẠO BẢNG CHẤM CÔNG THÁNG MỚI (CHỈ NHÂN VIÊN ACTIVE)
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

    // 3. Setup ngày đi làm mặc định (Full công hành chính chữ 'x', OT/Thiếu giờ để trống)
    const daysInMonth = getDaysInMonth(month, year);
    const defaultRecords = {};
    const defaultOTRecords = {};
    const defaultShortfallRecords = {};

    for (let day = 1; day <= daysInMonth; day++) {
      defaultRecords[day.toString()] = "x";
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
      overtimeRecords: defaultOTRecords,         // ✅ Thêm OT
      shortfallRecords: defaultShortfallRecords, // ✅ Thêm đi muộn/về sớm
    }));

    // 6. Insert tất cả vào DB
    const createdAttendances = await Attendance.insertMany(attendanceDocs);
    
    // Lưu lại từng doc để kích hoạt Hook `pre("save")` tính toán tổng số công (bao gồm cả OT và Shortfall)
    for (const doc of createdAttendances) {
      const attendance = await Attendance.findById(doc._id);
      await attendance.save(); 
    }

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
// 4. SỬA CÔNG CỦA 1 NHÂN VIÊN (UPDATE ROW)
// ==========================================
export const updateAttendanceBulk = async (req, res) => {
  try {
    const { recordId } = req.params;
    // ✅ Nhận thêm overtimeRecords và shortfallRecords từ request body
    const { advancePayment, records, overtimeRecords, shortfallRecords } = req.body;

    const attendance = await Attendance.findById(recordId);
    if (!attendance) return res.status(404).json({ message: "Không tìm thấy dữ liệu nhân viên này" });

    // Kiểm tra xem tháng có bị khóa (chốt công) chưa
    const monthData = await AttendanceMonth.findOne({ month: attendance.month, year: attendance.year });
    if (monthData && monthData.status === "closed") {
      return res.status(403).json({ message: "Kỳ chấm công này đã bị khóa, không thể sửa chữa!" });
    }

    // Cập nhật các trường dữ liệu
    attendance.advancePayment = advancePayment !== undefined ? advancePayment : attendance.advancePayment;
    if (records) {
      attendance.records = records;
    }
    // ✅ Cập nhật OT và Shortfall
    if (overtimeRecords) {
      attendance.overtimeRecords = overtimeRecords;
    }
    if (shortfallRecords) {
      attendance.shortfallRecords = shortfallRecords;
    }

    // Gọi save() -> Hook pre('save') trong Model sẽ tự động quét qua MAP records, overtimeRecords, shortfallRecords để tính lại TỔNG cho phần SUMMARY
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

    // Xóa tất cả các record của nhân viên trong tháng đó
    await Attendance.deleteMany({ month: Number(month), year: Number(year) });
    
    // Xóa kỳ chấm công
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
    const { id } = req.params; // ID của AttendanceMonth
    const { status } = req.body; // "open" hoặc "closed"

    const monthData = await AttendanceMonth.findByIdAndUpdate(id, { status }, { new: true });
    if (!monthData) return res.status(404).json({ message: "Không tìm thấy kỳ chấm công" });

    res.status(200).json({ message: `Đã chuyển trạng thái thành: ${status}`, data: monthData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi đổi trạng thái kỳ chấm công" });
  }
};