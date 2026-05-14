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
    const record = await PayrollRecord.findById(id).populate({
      path: "employee",
      select: "email status"
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiếu lương này." });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Lỗi lấy chi tiết phiếu lương:", error);
    next(error);
  }
};

export const initializePayroll = async (req, res) => {
  try {
    const { month, year, standardDays, rates } = req.body;
    const stdDays = Number(standardDays) || 26;

    // Config mặc định nếu không có truyền từ client
    const configRates = rates || {
      minishow: 40800, bigshow:  130.500 , meal: 35000, transport: 30000, housingUnder15: 425000, housingOver15: 850000
    };

    const activeEmployees = await Employee.find({ status: "active" });
    const [attendances, overtimes, insurances, taxes] = await Promise.all([
      Attendance.find({ month, year }),
      OvertimePayRecord.find({ month, year }),
      InsuranceRecord.find({ month, year }),
      TaxRecord.find({ month, year })
    ]);

    const payrollDocs = activeEmployees.map((emp) => {
      const empIdStr = emp._id.toString();
      const att = attendances.find(a => a.employee?.toString() === empIdStr);
      const ot = overtimes.find(o => o.employee?.toString() === empIdStr);
      const ins = insurances.find(i => i.employee?.toString() === empIdStr);
      const tax = taxes.find(t => t.employee?.toString() === empIdStr);

      const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;
      const actualDays = att?.summary?.totalPaidDays || 0;

      // =====================================
      // SIẾT LOGIC LƯƠNG THỜI GIAN
      // =====================================
      let timeSalary = 0;
      if (actualDays >= stdDays) {
        timeSalary = baseSalary; // Đi làm >= ngày công chuẩn thì hưởng đúng lương deal
      } else {
        timeSalary = Math.round((baseSalary / stdDays) * actualDays); // Ít hơn thì mới chia theo tỉ lệ
      }

      // =====================================
      // TÁCH TIỀN SHOW & TÍNH KPI
      // =====================================
      const minishowCount = att?.summary?.totalMinishow || 0;
      const bigshowCount = att?.summary?.totalBigshow || 0;
      
      const miniShowMoney = minishowCount * configRates.minishow;
      const bigShowMoney = bigshowCount * configRates.bigshow;
      
      const responsibilityBonus = emp.salaryAndBenefits?.bonuses?.responsibility || 0;
      const kpiBonus = Math.round((responsibilityBonus / 26) * (((minishowCount / 5) + bigshowCount) / 2));

      // =====================================
      // PHỤ CẤP ĐỘNG
      // =====================================
      let housing = 0;
      if (actualDays > 0) {
        housing = actualDays <= 15 ? configRates.housingUnder15 : configRates.housingOver15;
      }
      const meal = actualDays * configRates.meal;
      const transport = actualDays * configRates.transport;

      const totalAllw = meal + transport + housing + (emp.salaryAndBenefits?.allowances?.phone || 0) + (emp.salaryAndBenefits?.allowances?.clothing || 0);
      const overtimePay = ot?.amounts?.totalMoney || 0;
      
      const totalGross = timeSalary + totalAllw + overtimePay + miniShowMoney + bigShowMoney + kpiBonus;
      
      const bhxh = ins?.employeePays?.bhxh || 0;
      const taxTNCN = tax?.taxAmount || 0;
      const totalDeductions = (att?.advancePayment || 0) + (ins?.employeePays?.total || 0) + taxTNCN;

      return {
        month, year, employee: emp._id,
        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position: emp.workInfo?.position,
          department: emp.workInfo?.department
        },
        baseSalary, standardDays: stdDays, actualDays,
        incomes: {
          timeSalary,
          overtime: overtimePay,
          miniShowMoney, // Đã tách
          bigShowMoney,  // Đã tách
          kpiBonus,
          allowances: { 
            meal, transport, housing, 
            phone: emp.salaryAndBenefits?.allowances?.phone || 0,
            clothing: emp.salaryAndBenefits?.allowances?.clothing || 0 
          },
          bonus: 0,
          totalGross
        },
        deductions: {
          advance: att?.advancePayment || 0,
          insurance: { total: ins?.employeePays?.total || 0 },
          taxTNCN,
          totalDeductions
        },
        netSalary: totalGross - totalDeductions < 0 ? 0 : totalGross - totalDeductions
      };
    });

    await PayrollRecord.deleteMany({ month, year });
    await PayrollRecord.insertMany(payrollDocs);

    res.status(201).json({ success: true, message: "Đã đồng bộ và siết lương thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    const record = await PayrollRecord.findById(payrollRecordId).populate({
      path: "employee",
      select: "email status",
    });

    if (!record) return res.status(404).json({ success: false, message: "Không tìm thấy bảng lương này." });
    if (!record.employee || !record.employee.email) return res.status(400).json({ success: false, message: "Nhân viên chưa có Email." });

    const companyName = "FUGU Dining Lounge";
    const htmlContent = buildPayslipTemplate(record, companyName);
    const subject = `[${companyName}] - Phiếu lương tháng ${record.month}/${record.year} - ${record.employeeSnapshot.fullName}`;

    const isSent = await sendEmail(record.employee.email, subject, htmlContent);

    if (isSent) {
      record.isEmailSent = true;
      await record.save();
      return res.status(200).json({ success: true, message: `Đã gửi phiếu lương đến email: ${record.employee.email}` });
    } else {
      return res.status(500).json({ success: false, message: "Có lỗi xảy ra từ máy chủ gửi mail." });
    }
  } catch (error) {
    console.error("Lỗi gửi mail: ", error);
    next(error);
  }
};

