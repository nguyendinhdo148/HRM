import { Employee } from "../models/Employee.js";
import { AttendanceReport } from "../models/AttendanceReport.js";

const toISODate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateKeys = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(toISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value === "object") return Object.fromEntries(Object.entries(value));
  return {};
};

const normalizeKpi = (value) => {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].map(([key, item]) => [
        key,
        { minishow: Number(item?.minishow || 0), bigshow: Number(item?.bigshow || 0) },
      ])
    );
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        { minishow: Number(item?.minishow || 0), bigshow: Number(item?.bigshow || 0) },
      ])
    );
  }
  return {};
};

const rowToResponse = (row) => {
  const plain = typeof row.toObject === "function" ? row.toObject() : { ...row };
  const employee = plain.employeeSnapshot || {};

  return {
    ...plain,
    _id: plain._id,
    summary: {
      ...(plain.summary || {}),
      totalPaidDays: Number(plain.summary?.totalPaidDays ?? 0),
    },
    employee: {
      _id: plain.employee || employee._id,
      employeeCode: employee.employeeCode || "",
      fullName: employee.fullName || "",
      workInfo: { department: employee.department || "" },
      status: employee.status || "",
    },
    records: mapToObject(plain.records),
    overtimeRecords: mapToObject(plain.overtimeRecords),
    shortfallRecords: mapToObject(plain.shortfallRecords),
    kpiRecords: normalizeKpi(plain.kpiRecords),
  };
};

const buildReportRows = async (fromDate, toDate, scope = { mode: "ALL", department: "", employeeIds: [] }) => {
  const query = { status: { $in: ["active", "probation", "on_leave"] } };

  if (scope?.mode === "DEPT") {
    if (!scope.department) throw new Error("Vui lòng chọn phòng ban");
    query["workInfo.department"] = scope.department;
  }

  if (scope?.mode === "EMPLOYEE") {
    const ids = Array.isArray(scope.employeeIds) ? scope.employeeIds.filter(Boolean) : [];
    if (ids.length === 0) throw new Error("Vui lòng chọn ít nhất 1 nhân sự");
    query._id = { $in: ids };
  }

  const employees = await Employee.find(query).sort({ employeeCode: 1 });
  const dateKeys = buildDateKeys(fromDate, toDate);

  return employees.map((employee) => {
    const baseRecords = Object.fromEntries(dateKeys.map((key) => [key, ""]));
    const baseOT = Object.fromEntries(dateKeys.map((key) => [key, ""]));
    const baseShortfall = Object.fromEntries(dateKeys.map((key) => [key, 0]));
    const baseKpi = Object.fromEntries(dateKeys.map((key) => [key, { minishow: 0, bigshow: 0 }]));

    return {
      employee: employee._id,
      employeeSnapshot: {
        employeeCode: employee.employeeCode || "",
        fullName: employee.fullName || "",
        status: employee.status || "",
        department: employee.workInfo?.department || "",
      },
      advancePayment: 0,
      summary: { totalPaidDays: 0 },
      records: baseRecords,
      overtimeRecords: baseOT,
      shortfallRecords: baseShortfall,
      kpiRecords: baseKpi,
    };
  });
};

// ==========================================
// 1. DANH SÁCH REPORT
// ==========================================
export const listAttendanceReports = async (req, res) => {
  try {
    const reports = await AttendanceReport.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách báo cáo" });
  }
};

// ==========================================
// 2. TẠO REPORT (✅ nhận payrollMonth, payrollYear)
// ==========================================
export const createAttendanceReport = async (req, res) => {
  try {
    const { name, fromDate, toDate, scope, payrollMonth, payrollYear } = req.body || {};

    if (!name || !fromDate || !toDate) {
      return res.status(400).json({ message: "Thiếu tên báo cáo hoặc khoảng ngày" });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: "Khoảng ngày không hợp lệ" });
    }

    const normalizedScope = {
      mode: scope?.mode === "DEPT" || scope?.mode === "EMPLOYEE" ? scope.mode : "ALL",
      department: String(scope?.department || "").trim(),
      employeeIds: Array.isArray(scope?.employeeIds) ? scope.employeeIds.filter(Boolean) : [],
    };

    if (normalizedScope.mode === "DEPT" && !normalizedScope.department) {
      return res.status(400).json({ message: "Vui lòng chọn phòng ban cho báo cáo" });
    }

    if (normalizedScope.mode === "EMPLOYEE" && normalizedScope.employeeIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 nhân sự cho báo cáo" });
    }

    const rows = await buildReportRows(start, end, normalizedScope);
    const report = await AttendanceReport.create({
      name: String(name).trim(),
      fromDate: start,
      toDate: end,
      status: "open",
      // ✅ Lưu 2 field mới
      payrollMonth: payrollMonth ? Number(payrollMonth) : null,
      payrollYear: payrollYear ? Number(payrollYear) : null,
      scope: normalizedScope,
      rows,
    });

    return res.status(201).json({
      message: "Đã tạo báo cáo thành công!",
      data: report,
    });
  } catch (error) {
    console.error(error);
    const message = error?.message || "Lỗi khi tạo báo cáo chấm công";
    return res.status(400).json({ message });
  }
};

// ==========================================
// 3. LẤY DATA REPORT
// ==========================================
export const getAttendanceReportData = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await AttendanceReport.findById(reportId).lean();
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    const rows = Array.isArray(report.rows) ? report.rows.map(rowToResponse) : [];
    return res.status(200).json({ rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi lấy dữ liệu báo cáo" });
  }
};

// ==========================================
// 4. ĐỔI TRẠNG THÁI
// ==========================================
export const updateAttendanceReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body || {};

    const report = await AttendanceReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    if (status === "open" || status === "closed") {
      report.status = status;
      await report.save();
      return res.status(200).json({ message: "Đã cập nhật trạng thái báo cáo", data: report });
    }

    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi cập nhật trạng thái báo cáo" });
  }
};

// ==========================================
// 5. XOÁ REPORT
// ==========================================
export const deleteAttendanceReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await AttendanceReport.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }
    return res.status(200).json({ message: "Đã xóa báo cáo thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi xóa báo cáo" });
  }
};

// ==========================================
// 6. CẬP NHẬT 1 ROW
// ==========================================
export const updateAttendanceReportRow = async (req, res) => {
  try {
    const { reportId, rowId } = req.params;
    const report = await AttendanceReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    const row = report.rows.id(rowId);
    if (!row) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu nhân sự trong báo cáo" });
    }

    const { advancePayment, totalPaidDays, summary, records, overtimeRecords, shortfallRecords, kpiRecords } = req.body || {};

    if (advancePayment !== undefined) row.advancePayment = Number(advancePayment) || 0;
    const nextTotal = totalPaidDays !== undefined ? Number(totalPaidDays) : summary?.totalPaidDays;
    if (nextTotal !== undefined && !Number.isNaN(Number(nextTotal))) {
      row.summary = { ...(row.summary || {}), totalPaidDays: Number(nextTotal) >= 0 ? Number(nextTotal) : 0 };
    }
    if (records) row.records = new Map(Object.entries(records));
    if (overtimeRecords) row.overtimeRecords = new Map(Object.entries(overtimeRecords));
    if (shortfallRecords) {
      row.shortfallRecords = new Map(
        Object.entries(shortfallRecords).map(([key, value]) => [key, Number(value) || 0])
      );
    }
    if (kpiRecords) {
      row.kpiRecords = new Map(
        Object.entries(kpiRecords).map(([key, value]) => [
          key,
          { minishow: Number(value?.minishow || 0), bigshow: Number(value?.bigshow || 0) },
        ])
      );
    }

    await report.save();
    return res.status(200).json({ message: "Đã lưu thay đổi nhân sự" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi lưu dữ liệu báo cáo" });
  }
};

// ==========================================
// 7. ✅ SET PAYROLL SOURCE (đánh dấu report dùng cho tháng lương)
// ==========================================
export const setPayrollMonth = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { payrollMonth, payrollYear } = req.body || {};

    if (!payrollMonth || !payrollYear) {
      return res.status(400).json({ message: "Vui lòng chọn tháng và năm lương" });
    }

    const report = await AttendanceReport.findByIdAndUpdate(
      reportId,
      {
        payrollMonth: Number(payrollMonth),
        payrollYear: Number(payrollYear),
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    return res.status(200).json({
      message: `Đã gán "${report.name}" cho lương tháng ${payrollMonth}/${payrollYear}`,
      data: report,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi gán tháng lương" });
  }
};