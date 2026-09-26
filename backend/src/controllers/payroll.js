import { PayrollRecord } from "../models/PayrollRecord.js";
import { Employee } from "../models/Employee.js";
import { AttendanceReport } from "../models/AttendanceReport.js";
import { OvertimePayRecord } from "../models/OvertimePayRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";
import { TaxRecord } from "../models/TaxRecord.js";
import { sendEmail, buildPayslipTemplate } from "../libs/send-email.js";

// ===== HẰNG SỐ =====
const DEFAULT_MEAL_ALLOWANCE = 1800000;
const STANDARD_MEAL_DAYS = 26;
const DEFAULT_INSURANCE_ADVANCE = 500000;

// ===== HELPERS =====
const getMealAllowanceCap = (emp) => {
  const userValue = Number(emp?.salaryAndBenefits?.mealRate);
  if (Number.isFinite(userValue) && userValue > 0) return userValue;
  return DEFAULT_MEAL_ALLOWANCE;
};

const calculateNetWithCompanySupport = (record, taxTNCN, advancePayment, insuranceTotal) => {
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
  return stored !== undefined && stored !== null ? stored : Math.max(0, cost - deduction);
};

const getEmployeeRates = (emp) => {
  const sb = emp.salaryAndBenefits || {};
  return {
    minishow: sb.minishowRate || 65000,
    bigshow: sb.bigshowRate || 213462,
  };
};

const calcMealAllowance = (emp, actualDays) => {
  const days = Number(actualDays) || 0;
  if (days <= 0) return 0;
  const mealCap = getMealAllowanceCap(emp);
  const mealRate = Math.round(mealCap / STANDARD_MEAL_DAYS);
  if (days >= STANDARD_MEAL_DAYS) return mealCap;
  return Math.round(days * mealRate);
};

const calcTrainingAllowance = (emp, bigshowCount) => {
  const sb = emp?.salaryAndBenefits || {};
  const type = sb.trainingAllowanceType || "NONE";

  if (type === "FIXED") {
    return Number(sb.trainingAllowanceFixed) || 0;
  }

  if (type === "PER_SESSION") {
    const rate = Number(sb.trainingAllowanceRate) || 0;
    const bigCount = Number(bigshowCount) || 0;
    return rate * bigCount;
  }

  return 0;
};

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

// ==========================================
// ✅ HELPERS MỚI — ĐỌC TỪ ATTENDANCEREPORT
// ==========================================

/**
 * Gom tất cả rows từ nhiều report thành Map<employeeId, row>
 * Nếu 1 nhân sự xuất hiện ở nhiều report → lấy report sau (ghi đè)
 */
const buildAttendanceMap = (reports) => {
  const map = new Map();
  for (const report of reports) {
    if (!report.rows) continue;
    for (const row of report.rows) {
      const empId = row.employee?.toString();
      if (empId) map.set(empId, row);
    }
  }
  return map;
};

/**
 * Tính số công thực tế từ row:
 * - Nếu summary.totalPaidDays > 0 VÀ khác với computed → user đã sửa tay → dùng manual
 * - Ngược lại đếm từ records: X = 1, 0.5 = 0.5
 */
const calcActualDaysFromRow = (row) => {
  if (!row) return 0;

  const records = row.records instanceof Map
    ? Object.fromEntries(row.records)
    : (row.records || {});

  let fullDays = 0, halfDays = 0;
  Object.values(records).forEach((v) => {
    const val = String(v || "").trim().toUpperCase();
    if (val === "X" || val === "CHẠM") fullDays++;
    else if (val === "0.5") halfDays++;
  });

  const computed = fullDays + halfDays * 0.5;
  const manual = Number(row.summary?.totalPaidDays);

  // Nếu manual > 0 và khác computed → dùng manual (user đã override)
  if (Number.isFinite(manual) && manual > 0 && Math.abs(manual - computed) > 0.01) {
    return manual;
  }
  return computed;
};

/**
 * Tính các chỉ số khác từ row: mini, big, OT, shortfall
 */
const calcStatsFromRow = (row) => {
  if (!row) return { totalMinishow: 0, totalBigshow: 0, totalOT: 0, totalShortfall: 0 };

  const kpiRecords = row.kpiRecords instanceof Map
    ? Object.fromEntries(row.kpiRecords)
    : (row.kpiRecords || {});
  const overtimeRecords = row.overtimeRecords instanceof Map
    ? Object.fromEntries(row.overtimeRecords)
    : (row.overtimeRecords || {});
  const shortfallRecords = row.shortfallRecords instanceof Map
    ? Object.fromEntries(row.shortfallRecords)
    : (row.shortfallRecords || {});

  let mini = 0, big = 0, ot = 0, sf = 0;

  Object.values(kpiRecords).forEach((k) => {
    mini += Number(k?.minishow || 0);
    big += Number(k?.bigshow || 0);
  });

  Object.values(overtimeRecords).forEach((v) => {
    const val = String(v || "").trim().toUpperCase();
    if (val === "X" || val === "N" || val === "T") ot++;
  });

  Object.values(shortfallRecords).forEach((v) => {
    sf += Number(v) || 0;
  });

  return { totalMinishow: mini, totalBigshow: big, totalOT: ot, totalShortfall: sf };
};

/**
 * Tìm row của 1 nhân sự trong tất cả report có payrollMonth/Year tương ứng
 */
const findRowForEmployee = async (employeeId, month, year) => {
  const reports = await AttendanceReport.find({
    payrollMonth: Number(month),
    payrollYear: Number(year),
  });
  const map = buildAttendanceMap(reports);
  return map.get(employeeId.toString());
};

// ==========================================
// API: DANH SÁCH KỲ LƯƠNG
// ==========================================
export const getPayrollMonths = async (req, res) => {
  try {
    const months = await PayrollRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" }, status: { $first: "$status" }, totalNet: { $sum: "$netSalary" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year", status: 1, totalNet: 1 } }
    ]);
    res.status(200).json(months);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách kỳ lương" });
  }
};

// ==========================================
// API: LẤY BẢNG LƯƠNG THEO THÁNG
// ==========================================
export const getPayrollByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    // ✅ Tìm tất cả report gắn với tháng lương này
    const reports = await AttendanceReport.find({
      payrollMonth: Number(month),
      payrollYear: Number(year),
    });
    const attendanceMap = buildAttendanceMap(reports);

    const records = await PayrollRecord.find({ month: Number(month), year: Number(year) })
      .populate({ path: "employee", select: "email status salaryAndBenefits" })
      .sort({ "employeeSnapshot.employeeCode": 1 });

    const [taxes, insurances] = await Promise.all([
      TaxRecord.find({ month: Number(month), year: Number(year) }),
      InsuranceRecord.find({ month: Number(month), year: Number(year) })
    ]);

    for (let record of records) {
      if (!record.employee) continue;

      const empIdStr = record.employee._id.toString();
      let isChanged = false;

      const row = attendanceMap.get(empIdStr);
      const actualDays = calcActualDaysFromRow(row);
      const stats = calcStatsFromRow(row);

      if (record.actualDays !== actualDays) {
        record.actualDays = actualDays;
        isChanged = true;
      }

      const correctMeal = calcMealAllowance(record.employee, actualDays);
      if ((record.incomes?.allowances?.meal || 0) !== correctMeal) {
        record.incomes.allowances.meal = correctMeal;
        isChanged = true;
      }

      const correctTraining = calcTrainingAllowance(record.employee, stats.totalBigshow);
      if ((record.incomes?.allowances?.trainingAllowance || 0) !== correctTraining) {
        record.incomes.allowances.trainingAllowance = correctTraining;
        isChanged = true;
      }

      const latestTax = taxes.find(t => t.employee?.toString() === empIdStr);
      const newTaxValue = latestTax ? latestTax.taxAmount : 0;

      const newAdvanceValue = row?.advancePayment || 0;

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

// ==========================================
// API: LẤY 1 BẢN GHI LƯƠNG
// ==========================================
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

    // ✅ Tìm TẤT CẢ report cho tháng lương này
    const reports = await AttendanceReport.find({
      payrollMonth: Number(month),
      payrollYear: Number(year),
    });

    if (reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Chưa có báo cáo chấm công nào cho lương tháng ${month}/${year}.\nVui lòng vào mục "Chấm công" → chọn báo cáo → gán tháng lương.`,
      });
    }

    console.log(`🔄 Gom ${reports.length} report cho lương ${month}/${year}:`, reports.map(r => r.name).join(", "));

    // ✅ Tập hợp tất cả rows từ reports
    const allRows = [];
    for (const report of reports) {
      if (!report.rows) continue;
      for (const row of report.rows) {
        allRows.push(row);
      }
    }

    console.log(`✅ Có ${allRows.length} rows từ reports`);

    // ✅ Map row theo employeeId
    const attendanceMap = new Map();
    allRows.forEach((row) => {
      const empId = row.employee?.toString();
      if (empId) attendanceMap.set(empId, row);
    });

    // ✅ CHỈ lấy employee có trong report (KHÔNG lấy all active)
    const employeeIds = [...attendanceMap.keys()];
    const employeesInReports = await Employee.find({
      _id: { $in: employeeIds },
    });

    console.log(`✅ Tìm thấy ${employeesInReports.length} employee documents`);

    // ✅ Lấy map employee theo id
    const employeeMap = new Map();
    employeesInReports.forEach((emp) => employeeMap.set(emp._id.toString(), emp));

    // ✅ Đảm bảo thứ tự: lặp theo attendanceMap (những người có row)
    const employeesOrdered = employeeIds
      .map((id) => employeeMap.get(id))
      .filter(Boolean); // bỏ những employee không tồn tại

    const previousRecords = await PayrollRecord.find({ month, year }).select("employee incomes.adjustment");
    const previousAdjustmentsByEmployee = new Map(
      previousRecords
        .filter((r) => r.employee && r.incomes?.adjustment !== undefined)
        .map((r) => [r.employee.toString(), Number(r.incomes.adjustment) || 0])
    );

    const [overtimes, insurances, taxes] = await Promise.all([
      OvertimePayRecord.find({ month, year }),
      InsuranceRecord.find({ month, year }),
      TaxRecord.find({ month, year }),
    ]);

    // ✅ Lặp qua employeesOrdered (chỉ người trong report)
    const payrollDocs = employeesOrdered.map((emp) => {
      const empIdStr = emp._id.toString();
      const row = attendanceMap.get(empIdStr);
      const ot = overtimes.find((o) => o.employee?.toString() === empIdStr);
      const ins = insurances.find((i) => i.employee?.toString() === empIdStr);
      const tax = taxes.find((t) => t.employee?.toString() === empIdStr);

      const rates = getEmployeeRates(emp);
      const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;

      const actualDays = calcActualDaysFromRow(row);
      const stats = calcStatsFromRow(row);

      let timeSalary = actualDays >= stdDays
        ? baseSalary
        : Math.round((baseSalary / stdDays) * actualDays);

      const miniShowMoney = stats.totalMinishow * rates.minishow;
      const bigShowMoney = stats.totalBigshow * rates.bigshow;
      const responsibilityBonus = emp.salaryAndBenefits?.bonuses?.responsibility || 0;
      const kpiBonus = Math.round((responsibilityBonus / 26) * (((stats.totalMinishow / 5) + stats.totalBigshow) / 2));

      const housingAllowance = actualDays > 0 ? getHousingAllowance(emp) : 0;
      const meal = calcMealAllowance(emp, actualDays);
      const trainingAllowance = calcTrainingAllowance(emp, stats.totalBigshow);

      const previousAdjustment = previousAdjustmentsByEmployee.get(emp._id.toString()) || 0;
      const taxTNCN = tax?.taxAmount || 0;
      const insTotal = ins?.employeePays?.total || 0;
      const advancePayment = row?.advancePayment || 0;

      const recordDoc = {
        month, year,
        employee: emp._id,
        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position: emp.workInfo?.position,
          department: emp.workInfo?.department,
        },
        baseSalary,
        standardDays: stdDays,
        actualDays,
        insuranceSalary: ins?.insuranceSalary || 0,
        incomes: {
          timeSalary,
          overtime: ot?.amounts?.totalMoney || 0,
          miniShowMoney,
          bigShowMoney,
          kpiBonus,
          insuranceAdvance: DEFAULT_INSURANCE_ADVANCE,
          penalty: 0,
          adjustment: previousAdjustment,
          allowances: {
            meal,
            housingAllowance,
            trainingAllowance,
            transport: 0,
            housing: 0,
            phone: 0,
            clothing: 0,
          },
          bonus: 0,
          totalGross: 0,
        },
        deductions: {
          advance: advancePayment,
          insurance: {
            bhxh: ins?.employeePays?.bhxh || 0,
            bhyt: ins?.employeePays?.bhyt || 0,
            bhtn: ins?.employeePays?.bhtn || 0,
            total: insTotal,
          },
          excludedFromInsurance: ins?.excludedFromInsurance || false,
          taxTNCN: taxTNCN,
          totalDeductions: 0,
        },
        netSalary: 0,
      };

      recomputeGross(recordDoc.incomes);
      calculateNetWithCompanySupport(recordDoc, taxTNCN, advancePayment, insTotal);
      return recordDoc;
    });

    await PayrollRecord.deleteMany({ month, year });
    await PayrollRecord.insertMany(payrollDocs);

    res.status(201).json({
      success: true,
      message: `Đã đồng bộ lương tháng ${month}/${year} cho ${employeesOrdered.length} nhân sự (từ ${reports.length} báo cáo: ${reports.map(r => r.name).join(", ")}).`,
    });
  } catch (error) {
    console.error("Lỗi initializePayroll:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// API: CẬP NHẬT 1 BẢN GHI LƯƠNG
// ==========================================
export const updatePayrollRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { bonus, insuranceAdvance, penalty } = req.body;

    const record = await PayrollRecord.findById(recordId).populate({ path: "employee", select: "salaryAndBenefits" });
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (bonus !== undefined) record.incomes.bonus = Number(bonus);
    if (insuranceAdvance !== undefined) record.incomes.insuranceAdvance = Number(insuranceAdvance);
    if (penalty !== undefined) record.incomes.penalty = Number(penalty);

    // ✅ Tìm row từ reports
    const row = await findRowForEmployee(record.employee._id, record.month, record.year);

    const actualDays = calcActualDaysFromRow(row);
    const stats = calcStatsFromRow(row);

    record.actualDays = actualDays;
    record.incomes.allowances.meal = calcMealAllowance(record.employee, actualDays);
    record.incomes.allowances.trainingAllowance = calcTrainingAllowance(record.employee, stats.totalBigshow);

    recomputeGross(record.incomes);
    calculateNetWithCompanySupport(
      record,
      record.deductions.taxTNCN,
      record.deductions.advance,
      record.deductions.insurance.total
    );

    await record.save();
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi updatePayrollRecord:", error);
    res.status(500).json({ message: "Lỗi cập nhật phiếu lương" });
  }
};

// ==========================================
// API: CẬP NHẬT TRẠNG THÁI
// ==========================================
export const updatePayrollStatus = async (req, res) => {
  try {
    const { month, year, status } = req.body;
    await PayrollRecord.updateMany({ month, year }, { $set: { status } });
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) { res.status(500).json({ message: "Lỗi cập nhật trạng thái" }); }
};

// ==========================================
// API: XOÁ BẢNG LƯƠNG THÁNG
// ==========================================
export const deletePayrollMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    await PayrollRecord.deleteMany({ month: Number(month), year: Number(year) });
    res.status(200).json({ message: `Đã xóa bảng lương tháng ${month}/${year}.` });
  } catch (error) { res.status(500).json({ message: "Lỗi xóa bảng lương" }); }
};

// ==========================================
// API: GỬI EMAIL PHIẾU LƯƠNG
// ==========================================
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

// ==========================================
// API: TRA CỨU LƯƠNG THEO CCCD
// ==========================================
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

    const mealAmount = latestPayroll.incomes.allowances?.meal || 0;
    const allowancesTotal =
      mealAmount +
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
// API: CẬP NHẬT ĐIỀU CHỈNH CP KHÁC
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
// ==========================================
// API: SYNC 1 BẢN GHI LƯƠNG — Cập nhật lại số liệu chấm công cho 1 nhân sự
// ==========================================
export const syncPayrollRow = async (req, res) => {
  try {
    const { recordId } = req.params;

    // 1. Tìm record
    const record = await PayrollRecord.findById(recordId)
      .populate({ path: "employee", select: "email status salaryAndBenefits workInfo fullName employeeCode" });

    if (!record) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi lương" });
    }
    if (!record.employee) {
      return res.status(400).json({ success: false, message: "Bản ghi không có nhân sự" });
    }

    const emp = record.employee;
    const empIdStr = emp._id.toString();

    // 2. Lấy row từ AttendanceReport
    const row = await findRowForEmployee(emp._id, record.month, record.year);

    // 3. Lấy tax / insurance / overtime (giống init)
    const [overtimes, insurances, taxes] = await Promise.all([
      OvertimePayRecord.find({ month: record.month, year: record.year }),
      InsuranceRecord.find({ month: record.month, year: record.year }),
      TaxRecord.find({ month: record.month, year: record.year }),
    ]);

    const ot = overtimes.find((o) => o.employee?.toString() === empIdStr);
    const ins = insurances.find((i) => i.employee?.toString() === empIdStr);
    const tax = taxes.find((t) => t.employee?.toString() === empIdStr);

    // 4. Tính lại các field TỰ ĐỘNG
    const rates = getEmployeeRates(emp);
    const baseSalary = emp.salaryAndBenefits?.baseSalary || 0;
    const stdDays = record.standardDays || 26;

    const actualDays = calcActualDaysFromRow(row);
    const stats = calcStatsFromRow(row);

    const timeSalary = actualDays >= stdDays
      ? baseSalary
      : Math.round((baseSalary / stdDays) * actualDays);

    const miniShowMoney = stats.totalMinishow * rates.minishow;
    const bigShowMoney = stats.totalBigshow * rates.bigshow;
    const responsibilityBonus = emp.salaryAndBenefits?.bonuses?.responsibility || 0;
    const kpiBonus = Math.round((responsibilityBonus / 26) * (((stats.totalMinishow / 5) + stats.totalBigshow) / 2));

    const housingAllowance = actualDays > 0 ? getHousingAllowance(emp) : 0;
    const meal = calcMealAllowance(emp, actualDays);
    const trainingAllowance = calcTrainingAllowance(emp, stats.totalBigshow);

    const taxTNCN = tax?.taxAmount || 0;
    const insTotal = ins?.employeePays?.total || 0;
    const advancePayment = row?.advancePayment || 0;

    // 5. ✅ CHỈ GHI ĐÈ CÁC FIELD TỰ ĐỘNG — GIỮ NGUYÊN FIELD NHẬP TAY
    record.baseSalary = baseSalary;
    record.standardDays = stdDays;
    record.actualDays = actualDays;
    record.insuranceSalary = ins?.insuranceSalary || record.insuranceSalary || 0;

    record.incomes.timeSalary = timeSalary;
    record.incomes.overtime = ot?.amounts?.totalMoney || 0;
    record.incomes.miniShowMoney = miniShowMoney;
    record.incomes.bigShowMoney = bigShowMoney;
    record.incomes.kpiBonus = kpiBonus;

    // ✅ Phụ cấp — CHỈ ghi đè meal, housingAllowance, trainingAllowance
    // Giữ nguyên: transport, housing, phone, clothing (nếu user đã nhập)
    if (!record.incomes.allowances) record.incomes.allowances = {};
    record.incomes.allowances.meal = meal;
    record.incomes.allowances.housingAllowance = housingAllowance;
    record.incomes.allowances.trainingAllowance = trainingAllowance;

    // ✅ Deductions từ hệ thống
    if (!record.deductions) record.deductions = {};
    if (!record.deductions.insurance) record.deductions.insurance = {};
    record.deductions.advance = advancePayment;
    record.deductions.insurance.bhxh = ins?.employeePays?.bhxh || 0;
    record.deductions.insurance.bhyt = ins?.employeePays?.bhyt || 0;
    record.deductions.insurance.bhtn = ins?.employeePays?.bhtn || 0;
    record.deductions.insurance.total = insTotal;
    record.deductions.excludedFromInsurance = ins?.excludedFromInsurance || false;
    record.deductions.taxTNCN = taxTNCN;

    // ❌ KHÔNG ĐỤNG: incomes.bonus, incomes.insuranceAdvance, incomes.penalty, incomes.adjustment

    // 6. Cập nhật snapshot (thêm salaryAndBenefits để FE fallback)
    record.employeeSnapshot = {
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      position: emp.workInfo?.position,
      department: emp.workInfo?.department,
      salaryAndBenefits: emp.salaryAndBenefits,
    };

    // 7. Tính lại totalGross + netSalary
    recomputeGross(record.incomes);
    calculateNetWithCompanySupport(record, taxTNCN, advancePayment, insTotal);

    await record.save();

    // Populate lại để trả về FE
    const freshRecord = await PayrollRecord.findById(record._id)
      .populate({ path: "employee", select: "email status salaryAndBenefits" });

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật số liệu",
      record: freshRecord,
    });
  } catch (error) {
    console.error("Lỗi syncPayrollRow:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật số liệu",
      error: error.message,
    });
  }
};