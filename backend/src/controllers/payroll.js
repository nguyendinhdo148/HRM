import { PayrollRecord } from "../models/PayrollRecord.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";
import { OvertimePayRecord } from "../models/OvertimePayRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";
import { TaxRecord } from "../models/TaxRecord.js";
import { sendEmail, buildPayslipTemplate } from "../libs/send-email.js";

// Tái tính toán khấu trừ và thực lĩnh dựa trên chính sách phúc lợi công ty
const calculateNetWithCompanySupport = (record, taxTNCN, advancePayment, insuranceTotal) => {
  const companyInsuranceSupport = 88000;
  
  // Nhân viên chỉ chịu phần bảo hiểm sau khi trừ đi 88k hỗ trợ từ công ty
  const employeeInsuranceDeduction = Math.max(0, insuranceTotal - companyInsuranceSupport);
  
  // Thuế TNCN do công ty chi trả 100% nên cấu phần trừ vào lương nhân viên bằng 0
  const employeeTaxDeduction = 0; 

  record.deductions.advance = advancePayment;
  record.deductions.taxTNCN = taxTNCN; // Lưu vết để kế toán theo dõi
  record.deductions.totalDeductions = advancePayment + employeeInsuranceDeduction + employeeTaxDeduction;
  
  const totalGross = record.incomes.totalGross || 0;
  record.netSalary = Math.max(0, totalGross - record.deductions.totalDeductions);
};

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
      .populate({ path: "employee", select: "email status" })
      .sort({ "employeeSnapshot.employeeCode": 1 });

    const [taxes, attendances, insurances] = await Promise.all([
      TaxRecord.find({ month: Number(month), year: Number(year) }),
      Attendance.find({ month: Number(month), year: Number(year) }),
      InsuranceRecord.find({ month: Number(month), year: Number(year) })
    ]);

    for (let record of records) {
      if (!record.employee) continue;
      
      const empIdStr = record.employee._id.toString();
      let isChanged = false;

      const latestTax = taxes.find(t => t.employee?.toString() === empIdStr);
      const newTaxValue = latestTax ? latestTax.taxAmount : 0;

      const latestAtt = attendances.find(a => a.employee?.toString() === empIdStr);
      const newAdvanceValue = latestAtt ? (latestAtt.advancePayment || 0) : 0;

      const latestIns = insurances.find(i => i.employee?.toString() === empIdStr);
      const newBhxh = latestIns?.employeePays?.bhxh || 0;
      const newBhyt = latestIns?.employeePays?.bhyt || 0;
      const newBhtn = latestIns?.employeePays?.bhtn || 0;
      const newInsTotal = latestIns?.employeePays?.total || 0;
      const newExcluded = latestIns?.excludedFromInsurance || false;

      const currentIns = record.deductions.insurance;
      if (
        record.deductions.taxTNCN !== newTaxValue ||
        record.deductions.advance !== newAdvanceValue ||
        currentIns.bhxh !== newBhxh || currentIns.bhyt !== newBhyt || 
        currentIns.bhtn !== newBhtn || currentIns.total !== newInsTotal ||
        record.deductions.excludedFromInsurance !== newExcluded
      ) {
        currentIns.bhxh = newBhxh;
        currentIns.bhyt = newBhyt;
        currentIns.bhtn = newBhtn;
        currentIns.total = newInsTotal;
        record.deductions.excludedFromInsurance = newExcluded;
        
        // Áp dụng luật khấu trừ phúc lợi khi đồng bộ lại dữ liệu liên quan
        calculateNetWithCompanySupport(record, newTaxValue, newAdvanceValue, newInsTotal);
        isChanged = true;
      }

      if (isChanged) {
        await record.save(); 
      }
    }

    res.status(200).json({ success: true, records });
  } catch (error) { 
    console.error("Lỗi getPayrollByMonth:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu bảng lương" }); 
  }
};

export const getPayrollRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await PayrollRecord.findById(id).populate({ path: "employee", select: "email status" });
    if (!record) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu lương này." });
    return res.status(200).json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const initializePayroll = async (req, res) => {
  try {
    const { month, year, standardDays, rates } = req.body;
    const stdDays = Number(standardDays) || 26;
    const configRates = rates || { minishow: 40800, bigshow: 130500, meal: 35000, transport: 30000, housingUnder15: 425000, housingOver15: 850000 };

    // Bao gồm nhân viên đang hoạt động và nhân viên nghỉ việc nếu nghỉ trong tháng này
    const activeEmployees = await Employee.find({ status: "active" });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const resignedThisMonth = await Employee.find({ status: "resigned", "workInfo.resignationDate": { $gte: start, $lte: end } });
    const allEmployees = [...activeEmployees, ...resignedThisMonth];

    const [attendances, overtimes, insurances, taxes] = await Promise.all([
      Attendance.find({ month, year }),
      OvertimePayRecord.find({ month, year }),
      InsuranceRecord.find({ month, year }),
      TaxRecord.find({ month, year })
    ]);

    const payrollDocs = allEmployees.map((emp) => {
      const empIdStr = emp._id.toString();
      const att = attendances.find(a => a.employee?.toString() === empIdStr);
      const ot = overtimes.find(o => o.employee?.toString() === empIdStr);
      const ins = insurances.find(i => i.employee?.toString() === empIdStr);
      const tax = taxes.find(t => t.employee?.toString() === empIdStr);

      const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;
      const actualDays = att?.summary?.totalPaidDays || 0;

      let timeSalary = actualDays >= stdDays ? baseSalary : Math.round((baseSalary / stdDays) * actualDays);

      const minishowCount = att?.summary?.totalMinishow || 0;
      const bigshowCount = att?.summary?.totalBigshow || 0;
      const miniShowMoney = minishowCount * configRates.minishow;
      const bigShowMoney = bigshowCount * configRates.bigshow;
      const responsibilityBonus = emp.salaryAndBenefits?.bonuses?.responsibility || 0;
      const kpiBonus = Math.round((responsibilityBonus / 26) * (((minishowCount / 5) + bigshowCount) / 2));

      let housing = actualDays > 0 ? (actualDays <= 15 ? configRates.housingUnder15 : configRates.housingOver15) : 0;
      const meal = actualDays * configRates.meal;
      const transport = actualDays * configRates.transport;

      const totalAllw = meal + transport + housing + (emp.salaryAndBenefits?.allowances?.phone || 0) + (emp.salaryAndBenefits?.allowances?.clothing || 0);
      const overtimePay = ot?.amounts?.totalMoney || 0;
      const totalGross = timeSalary + totalAllw + overtimePay + miniShowMoney + bigShowMoney + kpiBonus;

      const taxTNCN = tax?.taxAmount || 0;
      const insTotal = ins?.employeePays?.total || 0;
      const advancePayment = att?.advancePayment || 0;

      const recordDoc = {
        month, year, employee: emp._id,
        employeeSnapshot: { employeeCode: emp.employeeCode, fullName: emp.fullName, position: emp.workInfo?.position, department: emp.workInfo?.department },
        baseSalary, standardDays: stdDays, actualDays,
        insuranceSalary: ins?.insuranceSalary || 0,
        incomes: {
          timeSalary, overtime: overtimePay, miniShowMoney, bigShowMoney, kpiBonus,
          allowances: { meal, transport, housing, phone: emp.salaryAndBenefits?.allowances?.phone || 0, clothing: emp.salaryAndBenefits?.allowances?.clothing || 0 },
          bonus: 0, totalGross
        },
        deductions: { 
          advance: advancePayment, 
          insurance: { 
            bhxh: ins?.employeePays?.bhxh || 0,
            bhyt: ins?.employeePays?.bhyt || 0,
            bhtn: ins?.employeePays?.bhtn || 0,
            total: insTotal 
          }, 
          excludedFromInsurance: ins?.excludedFromInsurance || false,
          taxTNCN: taxTNCN,
          totalDeductions: 0
        },
        netSalary: 0
      };

      // Áp dụng hàm tính toán khấu trừ đặc thù bảo hiểm và thuế TNCN đài thọ
      calculateNetWithCompanySupport(recordDoc, taxTNCN, advancePayment, insTotal);
      return recordDoc;
    });

    await PayrollRecord.deleteMany({ month, year });
    await PayrollRecord.insertMany(payrollDocs);
    res.status(201).json({ success: true, message: `Đã khởi tạo/đồng bộ bảng lương tháng ${month}/${year} cho ${allEmployees.length} nhân sự.` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updatePayrollRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { bonus } = req.body; 

    const record = await PayrollRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (bonus !== undefined) {
      record.incomes.bonus = Number(bonus);
      const inc = record.incomes;
      const allw = inc.allowances || {};
      const totalAllw = (allw.meal||0) + (allw.transport||0) + (allw.phone||0) + (allw.clothing||0) + (allw.housing||0);
      
      inc.totalGross = inc.timeSalary + totalAllw + inc.overtime + inc.bonus + inc.miniShowMoney + inc.bigShowMoney + inc.kpiBonus;
      
      // Tính lại nét dựa trên tổng gross mới cập nhật
      calculateNetWithCompanySupport(record, record.deductions.taxTNCN, record.deductions.advance, record.deductions.insurance.total);
    }

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
    const record = await PayrollRecord.findById(payrollRecordId).populate({ path: "employee", select: "email status" });

    if (!record) return res.status(404).json({ success: false, message: "Không tìm thấy bảng lương này." });
    if (!record.employee || !record.employee.email) return res.status(400).json({ success: false, message: "Nhân viên chưa có Email." });

    const companyName = "Tên công ty của bạn"; // Thay bằng tên công ty thực tế
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
  } catch (error) { next(error); }
};

export const viewPayrollByCCCD = async (req, res) => {
  try {
    const { idCardNumber } = req.body;
    
    if (!idCardNumber) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập số CCCD/CMND." });
    }

    // 1. Tìm nhân viên theo số CCCD (trim để xóa khoảng trắng)
    const employee = await Employee.findOne({ idCardNumber: idCardNumber.trim() });
    
    if (!employee) {
      // SỬA DÒNG NÀY: Đổi câu thông báo theo ý bạn
      return res.status(404).json({ success: false, message: "Nhân viên này chưa có thông tin, vui lòng kiểm tra lại số CCCD!" });
    }

    // 2. Tìm bảng lương mới nhất của nhân viên này
    const latestPayroll = await PayrollRecord.findOne({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    if (!latestPayroll) {
      // SỬA DÒNG NÀY (Tùy chọn): Nếu có nhân viên nhưng tháng đó chưa tính lương
      return res.status(404).json({ success: false, message: "Nhân viên này chưa có dữ liệu bảng lương." });
    }

    // 3. Tính toán tổng phụ cấp
    const allowancesTotal = 
      (latestPayroll.incomes.allowances?.meal || 0) +
      (latestPayroll.incomes.allowances?.transport || 0) +
      (latestPayroll.incomes.allowances?.housing || 0) +
      (latestPayroll.incomes.allowances?.phone || 0) +
      (latestPayroll.incomes.allowances?.clothing || 0);

    // 4. Format dữ liệu gửi về Frontend
    const formattedData = {
      month: latestPayroll.month,
      year: latestPayroll.year,
      fullName: latestPayroll.employeeSnapshot.fullName,
      employeeCode: latestPayroll.employeeSnapshot.employeeCode,
      department: latestPayroll.employeeSnapshot.department || "Chưa cập nhật",
      incomes: {
        baseSalary: latestPayroll.baseSalary,
        allowances: allowancesTotal,
        totalGross: latestPayroll.incomes.totalGross
      },
      deductions: {
        tax: latestPayroll.deductions.taxTNCN || 0,
        insurance: latestPayroll.deductions.insurance.total || 0,
        totalDeductions: latestPayroll.deductions.totalDeductions || 0
      },
      netSalary: latestPayroll.netSalary
    };

    return res.status(200).json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Lỗi viewPayrollByCCCD:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi tra cứu lương." });
  }
};