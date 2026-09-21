import { PayrollRecord } from "../models/PayrollRecord.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";
import { OvertimePayRecord } from "../models/OvertimePayRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";
import { TaxRecord } from "../models/TaxRecord.js";
import { sendEmail, buildPayslipTemplate } from "../libs/send-email.js";

// ===== HẰNG SỐ =====
const MAX_MEAL_ALLOWANCE = 1800000;
const STANDARD_MEAL_DAYS = 26;
const MEAL_RATE = Math.round(MAX_MEAL_ALLOWANCE / STANDARD_MEAL_DAYS);
const DEFAULT_INSURANCE_ADVANCE = 500000;

const calculateNetWithCompanySupport = (record, taxTNCN, advancePayment, insuranceTotal) => {
  // ✅ KHÔNG trừ BHXH nữa — vì đã trừ 500k vào totalGross rồi
  record.deductions.advance = advancePayment;
  record.deductions.taxTNCN = taxTNCN;
  record.deductions.totalDeductions = advancePayment + taxTNCN;

  const totalGross = record.incomes.totalGross || 0;
  record.netSalary = Math.max(0, totalGross - record.deductions.totalDeductions);
};

const getHousingAllowance = (emp) => {
  const cost = emp.salaryAndBenefits?.housingCost || 0;
  const deduction = emp.salaryAndBenefits?.dormitoryDeduction || 0;
  const stored = emp.salaryAndBenefits?.housingAllowance;
  return (stored !== undefined && stored !== null) ? stored : Math.max(0, cost - deduction);
};

const getEmployeeRates = (emp) => {
  const sb = emp.salaryAndBenefits || {};
  return {
    minishow: sb.minishowRate || 65000,
    bigshow: sb.bigshowRate || 213462,
  };
};

const calcMealAllowance = (actualDays) => {
  const days = Number(actualDays) || 0;
  if (days <= 0) return 0;
  if (days >= STANDARD_MEAL_DAYS) return MAX_MEAL_ALLOWANCE;
  return Math.round(days * MEAL_RATE);
};

// ===== PHỤ CẤP CA TẬP = ĐƠN GIÁ × TỔNG BIG SHOW =====
const calcTrainingAllowance = (emp, bigshowCount) => {
  const rate = Number(emp.salaryAndBenefits?.trainingAllowanceRate) || 0;
  const bigCount = Number(bigshowCount) || 0;
  return rate * bigCount;
};

// ===== TÍNH LẠI TOTALGROSS (ĐÃ TRỪ TẠM ỨNG BHXH + PHẠT) =====
const recomputeGross = (inc) => {
  const allw = inc.allowances || {};
  const totalAllw = 
    (allw.meal || 0) + 
    (allw.housingAllowance || 0) + 
    (allw.trainingAllowance || 0);
  const insuranceAdvance = Number(inc.insuranceAdvance) || 0;
  const penalty = Number(inc.penalty) || 0;
  
  inc.totalGross = Math.max(0,
    (inc.timeSalary || 0) +
    (inc.overtime || 0) +
    (inc.miniShowMoney || 0) +
    (inc.bigShowMoney || 0) +
    (inc.kpiBonus || 0) +
    (inc.bonus || 0) +
    totalAllw -
    insuranceAdvance -
    penalty
  );
  return totalAllw;
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
      .populate({ path: "employee", select: "email status salaryAndBenefits" })
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

      const correctMeal = calcMealAllowance(record.actualDays);
      const currentMeal = record.incomes?.allowances?.meal || 0;
      if (currentMeal !== correctMeal) {
        record.incomes.allowances.meal = correctMeal;
        isChanged = true;
      }

      const latestAttForTraining = attendances.find(a => a.employee?.toString() === empIdStr);
      const bigshowCount = latestAttForTraining?.summary?.totalBigshow || 0;
      const correctTraining = calcTrainingAllowance(record.employee, bigshowCount);
      const currentTraining = record.incomes?.allowances?.trainingAllowance || 0;
      if (currentTraining !== correctTraining) {
        record.incomes.allowances.trainingAllowance = correctTraining;
        isChanged = true;
      }

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
        isChanged = true;
      }

      if (isChanged) {
        recomputeGross(record.incomes);
        calculateNetWithCompanySupport(record, newTaxValue, newAdvanceValue, newInsTotal);
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
    const { month, year, standardDays } = req.body;
    const stdDays = Number(standardDays) || 26;

    const previousRecords = await PayrollRecord.find({ month, year }).select("employee incomes.adjustment");
    const previousAdjustmentsByEmployee = new Map(
      previousRecords
        .filter((r) => r.employee && r.incomes?.adjustment !== undefined)
        .map((r) => [r.employee.toString(), Number(r.incomes.adjustment) || 0])
    );

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

      const rates = getEmployeeRates(emp);

      const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;
      const actualDays = att?.summary?.totalPaidDays || 0;

      let timeSalary = actualDays >= stdDays ? baseSalary : Math.round((baseSalary / stdDays) * actualDays);

      const minishowCount = att?.summary?.totalMinishow || 0;
      const bigshowCount = att?.summary?.totalBigshow || 0;
      const miniShowMoney = minishowCount * rates.minishow;
      const bigShowMoney = bigshowCount * rates.bigshow;
      const responsibilityBonus = emp.salaryAndBenefits?.bonuses?.responsibility || 0;
      const kpiBonus = Math.round((responsibilityBonus / 26) * (((minishowCount / 5) + bigshowCount) / 2));

      const housingAllowance = actualDays > 0 ? getHousingAllowance(emp) : 0;
      const meal = calcMealAllowance(actualDays);
      const trainingAllowance = calcTrainingAllowance(emp, bigshowCount);

      const previousAdjustment = previousAdjustmentsByEmployee.get(emp._id.toString()) || 0;
      const taxTNCN = tax?.taxAmount || 0;
      const insTotal = ins?.employeePays?.total || 0;
      const advancePayment = att?.advancePayment || 0;

      const recordDoc = {
        month, year, employee: emp._id,
        employeeSnapshot: { employeeCode: emp.employeeCode, fullName: emp.fullName, position: emp.workInfo?.position, department: emp.workInfo?.department },
        baseSalary, standardDays: stdDays, actualDays,
        insuranceSalary: ins?.insuranceSalary || 0,
        incomes: {
          timeSalary, overtime: ot?.amounts?.totalMoney || 0, miniShowMoney, bigShowMoney, kpiBonus,
          insuranceAdvance: DEFAULT_INSURANCE_ADVANCE,
          penalty: 0,
          adjustment: previousAdjustment,
          allowances: { 
            meal, housingAllowance, trainingAllowance,
            transport: 0, housing: 0, phone: 0, clothing: 0,
          },
          bonus: 0, totalGross: 0
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

      recomputeGross(recordDoc.incomes);
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
    const { bonus, insuranceAdvance, penalty } = req.body;

    const record = await PayrollRecord.findById(recordId).populate({ path: "employee", select: "salaryAndBenefits" });
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (bonus !== undefined) {
      record.incomes.bonus = Number(bonus);
    }
    if (insuranceAdvance !== undefined) {
      record.incomes.insuranceAdvance = Number(insuranceAdvance);
    }
    if (penalty !== undefined) {
      record.incomes.penalty = Number(penalty);
    }

    record.incomes.allowances.meal = calcMealAllowance(record.actualDays);
    
    if (record.employee) {
      const attendance = await Attendance.findOne({ 
        employee: record.employee._id, 
        month: record.month, 
        year: record.year 
      });
      const bigshowCount = attendance?.summary?.totalBigshow || 0;
      record.incomes.allowances.trainingAllowance = calcTrainingAllowance(record.employee, bigshowCount);
    }
    
    recomputeGross(record.incomes);
    calculateNetWithCompanySupport(record, record.deductions.taxTNCN, record.deductions.advance, record.deductions.insurance.total);

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

    const companyName = "Tên công ty của bạn";
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

    const employee = await Employee.findOne({ idCardNumber: idCardNumber.trim() });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Nhân viên này chưa có thông tin, vui lòng kiểm tra lại số CCCD!" });
    }

    const latestPayroll = await PayrollRecord.findOne({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    if (!latestPayroll) {
      return res.status(404).json({ success: false, message: "Nhân viên này chưa có dữ liệu bảng lương." });
    }

    const mealClamped = Math.min(latestPayroll.incomes.allowances?.meal || 0, MAX_MEAL_ALLOWANCE);
    const allowancesTotal = 
      mealClamped + 
      (latestPayroll.incomes.allowances?.housingAllowance || 0) + 
      (latestPayroll.incomes.allowances?.trainingAllowance || 0);

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

// ==========================================
// CẬP NHẬT ĐIỀU CHỈNH CP KHÁC
// ==========================================
export const updatePayrollAdjustment = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { adjustment } = req.body;

    const record = await PayrollRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (!record.incomes) record.incomes = {};
    if (adjustment !== undefined) {
      record.incomes.adjustment = Number(adjustment) || 0;
    }

    await record.save();
    res.status(200).json({ message: "Cập nhật điều chỉnh thành công", data: record });
  } catch (error) { 
    console.error("Lỗi updatePayrollAdjustment:", error);
    res.status(500).json({ message: "Lỗi cập nhật điều chỉnh", error: error.message }); 
  }
};