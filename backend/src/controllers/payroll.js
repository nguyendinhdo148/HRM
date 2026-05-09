import { PayrollRecord } from "../models/PayrollRecord.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";
import { OvertimePayRecord } from "../models/OvertimePayRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";
import { TaxRecord } from "../models/TaxRecord.js";
import { sendEmail, buildPayslipTemplate } from "../libs/send-email.js";

export const getPayrollMonths = async (req, res) => {
  try {
    const months = await PayrollRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" }, status: { $first: "$status" }, totalNet: { $sum: "$netSalary" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year", status: 1, totalNet: 1 } }
    ]);
    res.status(200).json(months);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy danh sách kỳ lương" }); }
};

export const getPayrollByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const records = await PayrollRecord.find({ month: Number(month), year: Number(year) })
      .populate({
        path: "employee",
        select: "email status",
      })
      .sort({ "employeeSnapshot.employeeCode": 1 });
    res.status(200).json({ success: true, records });
  } catch (error) { res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu bảng lương" }); }
};
export const getPayrollRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm phiếu lương và populate lấy email của nhân viên
    const record = await PayrollRecord.findById(id).populate({
      path: "employee",
      select: "email status"
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu lương này."
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết phiếu lương:", error);
    next(error);
  }
};
export const initializePayroll = async (req, res) => {
  try {
    // ✅ BƯỚC 0: DỌN DẸP INDEX CŨ GÂY LỖI TRÙNG LẶP (E11000)
    try {
      await PayrollRecord.collection.dropIndex("payrollMonth_1_employee_1");
      console.log("✅ Đã dọn dẹp Index cũ thành công!");
    } catch (err) {
      // Bỏ qua nếu index đã được xóa từ trước hoặc không tồn tại
    }

    const { month, year, standardDays } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Vui lòng cung cấp tháng và năm." });
    }

    // 1. Kiểm tra trạng thái khóa sổ
    const existing = await PayrollRecord.findOne({ month, year });
    if (existing && existing.status && existing.status !== "draft") {
      return res.status(400).json({ message: "Bảng lương tháng này đã bị khóa, không thể chạy lại đồng bộ!" });
    }

    // 2. Lấy danh sách nhân sự
    const activeEmployees = await Employee.find({ status: "active" });
    if (activeEmployees.length === 0) {
      return res.status(400).json({ message: "Không có nhân viên nào đang hoạt động!" });
    }

    // 3. Kéo song song dữ liệu từ 4 collection
    const [attendances, overtimes, insurances, taxes] = await Promise.all([
      Attendance.find({ month, year }),
      OvertimePayRecord.find({ month, year }),
      InsuranceRecord.find({ month, year }),
      TaxRecord.find({ month, year })
    ]);

    // 4. Map dữ liệu và Chủ động tính toán các trường
    const payrollDocs = activeEmployees.map((emp) => {
      const empIdStr = emp._id.toString();
      
      const att = attendances.find(a => a.employee?.toString() === empIdStr);
      const ot = overtimes.find(o => o.employee?.toString() === empIdStr);
      const ins = insurances.find(i => i.employee?.toString() === empIdStr);
      const tax = taxes.find(t => t.employee?.toString() === empIdStr);

      const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;
      const allw = emp.salaryAndBenefits?.allowances || {};
      const stdDays = Number(standardDays) || 26;

      // ✅ Dùng optional chaining (?.) để tránh crash nếu biến bị undefined
      const actualDays = att?.summary?.totalPaidDays || 0;
      const overtimePay = ot?.amounts?.totalMoney || 0;
      const advancePayment = att?.advancePayment || 0;
      
      const bhxh = ins?.employeePays?.bhxh || 0;
      const bhyt = ins?.employeePays?.bhyt || 0;
      const bhtn = ins?.employeePays?.bhtn || 0;
      const totalIns = ins?.employeePays?.total || (bhxh + bhyt + bhtn);
      
      const taxTNCN = tax?.taxAmount || 0;

      // Tính toán Thu nhập & Giảm trừ
      const timeSalary = stdDays > 0 ? Math.round((baseSalary / stdDays) * actualDays) : 0;
      
      const meal = allw.meal || 0;
      const transport = allw.transport || 0;
      const phone = allw.phone || 0;
      const clothing = allw.clothing || 0;
      const housing = allw.housing || 0;
      const other = allw.other || 0;
      const totalAllw = meal + transport + phone + clothing + housing + other;

      const totalGross = timeSalary + totalAllw + overtimePay; // (Mặc định bonus ban đầu là 0)
      const totalDeductions = advancePayment + totalIns + taxTNCN;
      let netSalary = totalGross - totalDeductions;
      
      if (netSalary < 0) netSalary = 0;

      return {
        month, 
        year, 
        employee: emp._id,
        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position: emp.workInfo?.position,
          department: emp.workInfo?.department
        },
        baseSalary: baseSalary,
        standardDays: stdDays,
        actualDays: actualDays, 
        
        incomes: {
          timeSalary: timeSalary, 
          overtime: overtimePay,
          allowances: { meal, transport, phone, clothing, housing, other },
          bonus: 0, 
          totalGross: totalGross
        },

        deductions: {
          advance: advancePayment, 
          insurance: { bhxh, bhyt, bhtn, total: totalIns },
          taxTNCN: taxTNCN,
          totalDeductions: totalDeductions
        },
        netSalary: netSalary,
        isEmailSent: false // Reset trạng thái email khi tạo lại bảng lương
      };
    });

    // 5. Xóa bản nháp cũ và Insert hàng loạt cực nhanh
    await PayrollRecord.deleteMany({ month, year });
    await PayrollRecord.insertMany(payrollDocs);

    res.status(201).json({ 
      success: true, 
      message: "Đã đồng bộ toàn bộ dữ liệu (Công, OT, Bảo Hiểm, Thuế) và tạo Bảng Lương thành công!" 
    });

  } catch (error) {
    console.error("🔥 LỖI INIT PAYROLL:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi khởi tạo bảng lương" });
  }
};

export const updatePayrollRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { bonus } = req.body; 

    const record = await PayrollRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (bonus !== undefined) record.incomes.bonus = Number(bonus);

    await record.save();
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) { res.status(500).json({ message: "Lỗi cập nhật phiếu lương" }); }
};

export const updatePayrollStatus = async (req, res) => {
  try {
    const { month, year, status } = req.body;
    await PayrollRecord.updateMany({ month, year }, { $set: { status } });
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) { res.status(500).json({ message: "Lỗi cập nhật trạng thái" }); }
};

export const deletePayrollMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    await PayrollRecord.deleteMany({ month: Number(month), year: Number(year) });
    res.status(200).json({ message: `Đã xóa bảng lương tháng ${month}/${year}.` });
  } catch (error) { res.status(500).json({ message: "Lỗi xóa bảng lương" }); }
};

export const sendPayslipEmail = async (req, res, next) => {
  try {
    const { payrollRecordId } = req.params;

    // 1. Tìm bản ghi lương và populate thông tin employee để lấy Email
    const record = await PayrollRecord.findById(payrollRecordId).populate({
      path: "employee",
      select: "email status",
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bảng lương này.",
      });
    }

    if (!record.employee || !record.employee.email) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên này chưa được cập nhật địa chỉ Email.",
      });
    }

    // 2. Tạo HTML nội dung email
    const companyName = "CÔNG TY CỔ PHẦN XYZ"; // Bạn có thể lấy từ DB hoặc cấu hình chung
    const htmlContent = buildPayslipTemplate(record, companyName);
    
    // 3. Set Tiêu đề email
    const subject = `[${companyName}] - Phiếu lương tháng ${record.month}/${record.year} - ${record.employeeSnapshot.fullName}`;

    // 4. Gửi email
    const isSent = await sendEmail(record.employee.email, subject, htmlContent);

    if (isSent) {
  // ✅ Đánh dấu là đã gửi và lưu vào Database
  record.isEmailSent = true;
  await record.save();

  return res.status(200).json({
    success: true,
    message: `Đã gửi phiếu lương thành công đến email: ${record.employee.email}`,
  });
} else {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra từ máy chủ gửi mail (SendGrid).",
      });
    }

  } catch (error) {
    console.error("Lỗi khi gửi mail phiếu lương: ", error);
    next(error);
  }
};


