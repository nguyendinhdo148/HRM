// src/AttendanceReport/index.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  CalendarDays, RefreshCcw, CalendarClock, Search, TrendingUp, Users, Filter,
  X, Trash2, Lock, Unlock, Clock, TimerOff, Save,
  ChevronLeft, ChevronRight, Upload, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";

import { Sidebar } from "./AttendanceBoard/Sidebar";
import { StatsView } from "./AttendanceBoard/StatsView";
import { ReportBoardTable, ReportOvertimeTable, ReportShortfallTable } from "./AttendanceBoard/Tables";
import {
  REPORT_API, getAuthHeaders, buildDaysArray, fmtVN, formatNumberWithDot,
} from "./AttendanceBoard/utils";

export default function AttendanceReport() {
  // ===== STATE =====
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingRecords, setEditingRecords] = useState<{ [id: string]: any }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form tạo report
  const [newName, setNewName] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const currentDate = new Date();
  const [newPayrollMonth, setNewPayrollMonth] = useState(currentDate.getMonth() + 1);
  const [newPayrollYear, setNewPayrollYear] = useState(currentDate.getFullYear());

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const [reportScopeMode, setReportScopeMode] = useState<"ALL" | "DEPT" | "EMPLOYEE">("ALL");
  const [reportDept, setReportDept] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== FETCH: danh sách report =====
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${REPORT_API}/list`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
        if (data.length > 0 && !selectedReport) setSelectedReport(data[0]);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/hrm/departments`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const names = Array.isArray(data) ? data.map((d: any) => d.name).filter(Boolean) : [];
        setDepartments(names);
        if (!reportDept && names.length > 0) setReportDept(names[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/hrm/employees`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
  };

  // ===== FETCH: dữ liệu report =====
  const fetchReportData = async (reportId: string) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${REPORT_API}/${reportId}/data`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setEditingRecords({});
      }
    } catch (e) { console.error(e); }
    finally { setIsDataLoading(false); }
  };

  useEffect(() => { fetchReports(); fetchDepartments(); fetchEmployees(); }, []);
  useEffect(() => {
    if (selectedReport) {
      if (selectedReport.payrollMonth) setNewPayrollMonth(Number(selectedReport.payrollMonth));
      if (selectedReport.payrollYear) setNewPayrollYear(Number(selectedReport.payrollYear));
      fetchReportData(selectedReport._id);
      setSearchQuery("");
      setSelectedDept("ALL");
    }
  }, [selectedReport]);

  useEffect(() => {
    if (reportScopeMode !== "EMPLOYEE") return;
    if (selectedEmployeeIds.length === 0 && employees.length > 0) {
      setSelectedEmployeeIds(employees.slice(0, 5).map((emp) => emp._id));
    }
  }, [reportScopeMode, employees, selectedEmployeeIds]);

  // ===== DAYS ARRAY =====
  const daysArray = useMemo(() => {
    if (!selectedReport) return [];
    return buildDaysArray(selectedReport.fromDate, selectedReport.toDate);
  }, [selectedReport]);

  // ===== DANH SÁCH PHÒNG BAN =====
  const uniqueDepartments = useMemo(() => {
    const depts = rows.map((r) => r.employee?.workInfo?.department).filter(Boolean);
    return ["ALL", ...Array.from(new Set(depts))].sort();
  }, [rows]);

  // ===== FILTER =====
  const filteredRows = useMemo(() => {
    return rows.filter((att) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q ||
        att.employee?.fullName?.toLowerCase().includes(q) ||
        att.employee?.employeeCode?.toLowerCase().includes(q);
      const deptMatch = selectedDept === "ALL" ||
        att.employee?.workInfo?.department === selectedDept;
      return nameMatch && deptMatch;
    });
  }, [rows, searchQuery, selectedDept]);

  // ===== STATS =====
  const stats = useMemo(() => {
    let totalPaidDays = 0, totalOT = 0, totalShortfall = 0;
    filteredRows.forEach((att) => {
      const d = editingRecords[att._id] || att;
      let computedFullDays = 0;
      let computedHalfDays = 0;
      daysArray.forEach((day) => {
        const v = d.records?.[day.key];
        if (v === "X") computedFullDays += 1;
        else if (v === "0.5") computedHalfDays += 1;

        const ot = d.overtimeRecords?.[day.key];
        if (ot === "X" || ot === "N" || ot === "T") totalOT += 1;

        totalShortfall += Number(d.shortfallRecords?.[day.key]) || 0;
      });
      const totalFromSummary = Number(d.summary?.totalPaidDays);
      const effectiveTotal = Number.isFinite(totalFromSummary) ? totalFromSummary : computedFullDays + computedHalfDays * 0.5;
      totalPaidDays += effectiveTotal;
    });
    const avgDays = filteredRows.length > 0 ? (totalPaidDays / filteredRows.length).toFixed(1) : "0";
    return { count: filteredRows.length, totalPaidDays, totalOT, totalShortfall, avgDays };
  }, [filteredRows, editingRecords, daysArray]);

  const departmentStats = useMemo(() => {
    const map: { [k: string]: any } = {};
    filteredRows.forEach((att) => {
      const dept = att.employee?.workInfo?.department || "Chưa xếp phòng";
      if (!map[dept]) map[dept] = { name: dept, employees: 0, totalDays: 0 };
      map[dept].employees++;
      const d = editingRecords[att._id] || att;
      let computedFullDays = 0;
      let computedHalfDays = 0;
      daysArray.forEach((day) => {
        const v = d.records?.[day.key];
        if (v === "X") computedFullDays += 1;
        else if (v === "0.5") computedHalfDays += 1;
      });
      const totalFromSummary = Number(d.summary?.totalPaidDays);
      const effectiveTotal = Number.isFinite(totalFromSummary) ? totalFromSummary : computedFullDays + computedHalfDays * 0.5;
      map[dept].totalDays += effectiveTotal;
    });
    return Object.values(map).sort((a: any, b: any) => b.totalDays - a.totalDays);
  }, [filteredRows, editingRecords, daysArray]);

  const chartData = useMemo(() => {
    return filteredRows
      .map((att) => {
        const d = editingRecords[att._id] || att;
        let computedFullDays = 0;
        let computedHalfDays = 0;
        daysArray.forEach((day) => {
          const v = d.records?.[day.key];
          if (v === "X") computedFullDays += 1;
          else if (v === "0.5") computedHalfDays += 1;
        });
        const totalFromSummary = Number(d.summary?.totalPaidDays);
        const total = Number.isFinite(totalFromSummary) ? totalFromSummary : computedFullDays + computedHalfDays * 0.5;
        return { name: att.employee?.fullName?.split(" ").pop() || "N/A", total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredRows, editingRecords, daysArray]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const deriveAttendanceFromKpi = (kpi?: { minishow?: number; bigshow?: number }) => {
    const mini = kpi?.minishow || 0;
    const big = kpi?.bigshow || 0;
    if (mini > 0 || big > 0) return "X";
    return "OFF";
  };

  const getComputedPaidDays = (row: any) => {
    const records = row?.records || {};
    let full = 0;
    let half = 0;

    Object.entries(records).forEach(([_, value]) => {
      const normalized = String(value ?? "").trim().toUpperCase().replace(",", ".");
      if (normalized === "X" || normalized === "CHẠM" || normalized === "CHAM") full += 1;
      else if (normalized === "0.5") half += 1;
    });

    return full + (half * 0.5);
  };

  const handleCreateReport = async () => {
    if (!newName.trim()) return alert("Vui lòng nhập tên báo cáo!");
    if (!newFrom || !newTo) return alert("Vui lòng chọn khoảng ngày!");
    if (new Date(newFrom) > new Date(newTo)) return alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!");
    if (reportScopeMode === "DEPT" && !reportDept) return alert("Vui lòng chọn phòng ban để tạo báo cáo!");
    if (reportScopeMode === "EMPLOYEE" && selectedEmployeeIds.length === 0) return alert("Vui lòng chọn ít nhất 1 nhân sự để tạo báo cáo!");

    setIsCreating(true);
    try {
      const scope = {
        mode: reportScopeMode,
        department: reportScopeMode === "DEPT" ? reportDept : "",
        employeeIds: reportScopeMode === "EMPLOYEE" ? selectedEmployeeIds : [],
      };

      const res = await fetch(`${REPORT_API}/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          fromDate: newFrom,
          toDate: newTo,
          scope,
          payrollMonth: newPayrollMonth,
          payrollYear: newPayrollYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Tạo báo cáo thất bại"); return; }
      alert(data.message || "Đã tạo báo cáo thành công!");
      setNewName(""); setNewFrom(""); setNewTo("");
      setNewPayrollMonth(currentDate.getMonth() + 1);
      setNewPayrollYear(currentDate.getFullYear());
      setReportScopeMode("ALL");
      setReportDept(departments[0] || "");
      setSelectedEmployeeIds([]);
      await fetchReports();
    } catch (e) { alert("Có lỗi khi tạo báo cáo"); }
    finally { setIsCreating(false); }
  };

  const handleDeleteReport = async (report: any) => {
    if (!window.confirm(`Bạn có chắc muốn xóa báo cáo "${report.name}"?\nToàn bộ dữ liệu chấm công trong báo cáo này sẽ bị xóa.`)) return;
    try {
      const res = await fetch(`${REPORT_API}/${report._id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) return alert("Xóa thất bại");
      if (selectedReport?._id === report._id) { setSelectedReport(null); setRows([]); }
      await fetchReports();
      alert("Đã xóa báo cáo!");
    } catch (e) { alert("Có lỗi khi xóa"); }
  };

  const handleToggleStatus = async () => {
    if (!selectedReport) return;
    const next = selectedReport.status === "closed" ? "open" : "closed";
    if (!window.confirm(next === "closed" ? "Chốt báo cáo sẽ không thể chỉnh sửa?" : "Mở khóa báo cáo này?")) return;
    try {
      const res = await fetch(`${REPORT_API}/${selectedReport._id}/status`, {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ status: next }),
      });
      if (!res.ok) return alert("Thất bại");
      alert("Thành công");
      await fetchReports();
      setSelectedReport((p: any) => ({ ...p, status: next }));
    } catch (e) { alert("Có lỗi"); }
  };

  // ===== EDIT HANDLERS =====
  const handleKpiChange = useCallback((recordId: string, dayKey: string, type: "minishow" | "bigshow", value: string) => {
    if (selectedReport?.status === "closed") return;
    const num = value === "" ? 0 : parseInt(value.replace(/\D/g, ""), 10) || 0;
    setEditingRecords((prev) => {
      const cur = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(rows.find((r) => r._id === recordId)));
      if (!cur.kpiRecords) cur.kpiRecords = {};
      if (!cur.kpiRecords[dayKey]) cur.kpiRecords[dayKey] = { minishow: 0, bigshow: 0 };
      cur.kpiRecords[dayKey][type] = num;
      if (!cur.records) cur.records = {};
      cur.records[dayKey] = deriveAttendanceFromKpi(cur.kpiRecords[dayKey]);

      // ✅ CHỈ tự tính lại summary nếu user CHƯA đè tay
      if (!cur.__isTotalPaidDaysManual) {
        cur.summary = {
          ...(cur.summary || {}),
          totalPaidDays: getComputedPaidDays(cur),
        };
      }
      return { ...prev, [recordId]: cur };
    });
  }, [selectedReport, rows]);

  const toggleOvertime = useCallback((recordId: string, dayKey: string, currentVal: string) => {
    if (selectedReport?.status === "closed") return;
    const val = currentVal?.toString().toUpperCase() || "";
    let next = "";
    if (val === "X") next = "N";
    else if (val === "N") next = "T";
    else if (val === "T") next = "";
    else next = "X";
    setEditingRecords((prev) => {
      const cur = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(rows.find((r) => r._id === recordId)));
      if (!cur.overtimeRecords) cur.overtimeRecords = {};
      cur.overtimeRecords[dayKey] = next;
      return { ...prev, [recordId]: cur };
    });
  }, [selectedReport, rows]);

  const handleShortfallDailyChange = useCallback((recordId: string, dayKey: string, value: string) => {
    let v = value.replace(/[^0-9.\-]/g, "");
    if (v.indexOf("-") > 0) v = v.replace(/-/g, "");
    setEditingRecords((prev) => {
      const cur = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(rows.find((r) => r._id === recordId)));
      if (!cur.shortfallRecords) cur.shortfallRecords = {};
      cur.shortfallRecords[dayKey] = v;
      return { ...prev, [recordId]: cur };
    });
  }, [rows]);

  const handleAdvanceChange = useCallback((recordId: string, value: string) => {
    const num = value.replace(/\D/g, "");
    setEditingRecords((prev) => {
      const cur = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(rows.find((r) => r._id === recordId)));
      cur.advancePayment = Number(num);
      return { ...prev, [recordId]: cur };
    });
  }, [rows]);

  // ✅ ĐÃ SỬA: set flag __isTotalPaidDaysManual = true
  const handleTotalPaidDaysChange = useCallback((recordId: string, value: string) => {
    const rawValue = value.trim();
    const numericValue = rawValue === "" ? 0 : Number(rawValue);
    setEditingRecords((prev) => {
      const cur = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(rows.find((r) => r._id === recordId)));
      cur.summary = { ...(cur.summary || {}), totalPaidDays: Number.isFinite(numericValue) ? numericValue : 0 };
      cur.__isTotalPaidDaysManual = true;   // ✅ THÊM DÒNG NÀY
      return { ...prev, [recordId]: cur };
    });
  }, [rows]);

  const handleSaveRow = async (recordId: string) => {
    const edit = editingRecords[recordId];
    if (!edit || !selectedReport) return;
    const nextTotalPaidDays = Number(edit.summary?.totalPaidDays) || getComputedPaidDays(edit);
    const payload = {
      advancePayment: edit.advancePayment,
      summary: { ...(edit.summary || {}), totalPaidDays: nextTotalPaidDays },
      records: edit.records,
      overtimeRecords: edit.overtimeRecords,
      shortfallRecords: edit.shortfallRecords,
      kpiRecords: edit.kpiRecords,
      totalPaidDays: nextTotalPaidDays,
    };

    try {
      const res = await fetch(`${REPORT_API}/${selectedReport._id}/row/${recordId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) await fetchReportData(selectedReport._id);
    } catch (e) { console.error(e); }
  };

  const handleSaveAll = async () => {
    const ids = Object.keys(editingRecords);
    if (ids.length === 0 || !selectedReport) return;
    setIsSavingAll(true);
    try {
      await Promise.all(ids.map((id) => {
        const e = editingRecords[id];
        const nextTotalPaidDays = Number(e.summary?.totalPaidDays) || getComputedPaidDays(e);
        return fetch(`${REPORT_API}/${selectedReport._id}/row/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            advancePayment: e.advancePayment,
            summary: { ...(e.summary || {}), totalPaidDays: nextTotalPaidDays },
            records: e.records,
            overtimeRecords: e.overtimeRecords,
            shortfallRecords: e.shortfallRecords,
            kpiRecords: e.kpiRecords,
            totalPaidDays: nextTotalPaidDays,
          }),
        });
      }));
      await fetchReportData(selectedReport._id);
      alert("Đã lưu tất cả thay đổi!");
    } catch (e) {
      console.error(e);
      alert("Có lỗi khi lưu hàng loạt!");
    } finally { setIsSavingAll(false); }
  };

  // ==========================================
  // EXCEL EXPORT / IMPORT
  // ==========================================
  const handleDownloadTemplate = () => {
    if (!selectedReport) return alert("Chưa chọn báo cáo!");
    if (filteredRows.length === 0) return alert("Không có nhân sự nào!");

    const wb = XLSX.utils.book_new();
    const periodLabel = `${selectedReport.name} (${fmtVN(selectedReport.fromDate)} → ${fmtVN(selectedReport.toDate)})`;

    const titleRow = [`BẢNG CHẤM CÔNG & SHOW — ${periodLabel}`];
    const blankRow: any[] = [];

    const dateHeader: any[] = ["STT", "Mã NV", "Họ và tên", "Phòng ban"];
    daysArray.forEach((d) => {
      dateHeader.push(`${d.label}\nM`);
      dateHeader.push(`${d.label}\nB`);
    });
    dateHeader.push("Tạm ứng");

    const dowHeader: any[] = ["", "", "", ""];
    daysArray.forEach((d) => {
      dowHeader.push(d.dow);
      dowHeader.push("");
    });
    dowHeader.push("");

    const dataRows: any[][] = [];
    const sorted = [...filteredRows].sort((a, b) =>
      String(a.employee?.employeeCode || "").localeCompare(
        String(b.employee?.employeeCode || ""), undefined, { numeric: true, sensitivity: "base" }
      )
    );

    sorted.forEach((att, idx) => {
      const rowData = editingRecords[att._id] || att;
      const row: any[] = [
        idx + 1,
        att.employee?.employeeCode || "",
        att.employee?.fullName || "",
        att.employee?.workInfo?.department || "",
      ];
      daysArray.forEach((d) => {
        row.push(rowData.kpiRecords?.[d.key]?.minishow || 0);
        row.push(rowData.kpiRecords?.[d.key]?.bigshow || 0);
      });
      row.push(rowData.advancePayment || 0);
      dataRows.push(row);
    });

    const wsData = [titleRow, blankRow, dateHeader, dowHeader, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const totalCols = 4 + daysArray.length * 2 + 1;
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
    daysArray.forEach((_d, dayIdx) => {
      const colM = 4 + dayIdx * 2;
      ws["!merges"]!.push({ s: { r: 2, c: colM }, e: { r: 2, c: colM + 1 } });
    });

    const cols: any[] = [{ wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 15 }];
    daysArray.forEach(() => { cols.push({ wch: 5 }); cols.push({ wch: 5 }); });
    cols.push({ wch: 12 });
    ws["!cols"] = cols;

    const guideData = [
      ["HƯỚNG DẪN SỬ DỤNG FILE MẪU"],
      [],
      [`Báo cáo: ${selectedReport.name}`],
      [`Khoảng ngày: ${fmtVN(selectedReport.fromDate)} → ${fmtVN(selectedReport.toDate)} (${daysArray.length} ngày)`],
      [],
      ["1. Mỗi ngày chiếm 2 cột: M = Mini Show, B = Big Show"],
      ["2. Chỉ nhập số vào ô M và B. Không sửa các cột khác."],
      ["3. Quy tắc: M > 0 hoặc B > 0 → tính CÔNG (X), ngược lại → OFF"],
      ["4. Sau khi điền xong: Import Excel → Kiểm tra → Lưu tất cả"],
    ];
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide["!cols"] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, ws, "ChamCong");
    XLSX.utils.book_append_sheet(wb, wsGuide, "HuongDan");

    const safeName = selectedReport.name.replace(/[^\w\-]+/g, "_");
    XLSX.writeFile(wb, `Mau_${safeName}_${selectedReport.fromDate}_${selectedReport.toDate}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedReport?.status === "closed") {
      alert("Báo cáo đã bị khóa, không thể import!");
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames.includes("ChamCong") ? "ChamCong" : wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
        if (raw.length === 0) { alert("File Excel rỗng!"); return; }

        let startRowIdx = 0;
        for (let i = 0; i < raw.length; i++) {
          const c0 = String(raw[i][0] || "").trim();
          const c1 = String(raw[i][1] || "").trim();
          if (c0 && !isNaN(Number(c0)) && Number(c0) > 0 && c1) { startRowIdx = i; break; }
        }

        const empMap = new Map<string, any>();
        rows.forEach((att) => {
          const code = String(att.employee?.employeeCode || "").trim().toUpperCase();
          if (code) empMap.set(code, att);
        });

        const newEdits = { ...editingRecords };
        let totalRows = 0, totalCells = 0, skipped = 0;
        const skippedCodes: string[] = [];

        for (let i = startRowIdx; i < raw.length; i++) {
          const row = raw[i];
          const stt = String(row[0] || "").trim();
          const empCode = String(row[1] || "").trim().toUpperCase();
          if (!stt || isNaN(Number(stt)) || Number(stt) <= 0) continue;
          if (!empCode) { skipped++; continue; }

          const att = empMap.get(empCode);
          if (!att) { skipped++; if (skippedCodes.length < 5) skippedCodes.push(empCode); continue; }

          const empId = att._id;
          if (!newEdits[empId]) newEdits[empId] = JSON.parse(JSON.stringify(att));
          const edit = newEdits[empId];
          if (!edit.kpiRecords) edit.kpiRecords = {};
          if (!edit.records) edit.records = {};

          daysArray.forEach((d, dayIdx) => {
            const mini = row[4 + dayIdx * 2];
            const big = row[4 + dayIdx * 2 + 1];
            const hasMini = mini !== undefined && mini !== "" && !isNaN(Number(mini));
            const hasBig = big !== undefined && big !== "" && !isNaN(Number(big));
            if (!hasMini && !hasBig) return;
            const mv = hasMini ? Number(mini) : 0;
            const bv = hasBig ? Number(big) : 0;
            edit.kpiRecords[d.key] = { minishow: mv, bigshow: bv };
            edit.records[d.key] = (mv > 0 || bv > 0) ? "X" : "OFF";
            totalCells++;
          });

          // ✅ Import xong: reset flag đè tay + tính lại summary từ records
          edit.__isTotalPaidDaysManual = false;
          edit.summary = { ...(edit.summary || {}), totalPaidDays: getComputedPaidDays(edit) };
          totalRows++;
        }

        setEditingRecords(newEdits);
        let msg = `Đã import ${totalRows} nhân sự (${totalCells} ngày).\nBấm "Lưu tất cả" để hoàn tất.`;
        if (skipped > 0) {
          msg += `\n\nBỏ qua ${skipped} dòng (mã NV không khớp).`;
          if (skippedCodes.length > 0) msg += `\nVD: ${skippedCodes.join(", ")}`;
        }
        alert(msg);
      } catch (err) {
        console.error(err);
        alert("Có lỗi khi đọc file Excel!");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      alert("Không đọc được file!");
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  if (isLoading && reports.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 overflow-hidden font-sans">
      <aside className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm ${isSidebarOpen ? "w-[320px]" : "w-0"}`}>
        <div className={`w-[320px] h-full p-5 overflow-y-auto no-scrollbar ${isSidebarOpen ? "block" : "hidden"}`}>
          <Sidebar
            reports={reports}
            selectedReport={selectedReport}
            setSelectedReport={setSelectedReport}
            newName={newName} setNewName={setNewName}
            newFrom={newFrom} setNewFrom={setNewFrom}
            newTo={newTo} setNewTo={setNewTo}
            newPayrollMonth={newPayrollMonth}
            setNewPayrollMonth={setNewPayrollMonth}
            newPayrollYear={newPayrollYear}
            setNewPayrollYear={setNewPayrollYear}
            reportScopeMode={reportScopeMode}
            setReportScopeMode={setReportScopeMode}
            reportDept={reportDept}
            setReportDept={setReportDept}
            selectedEmployeeIds={selectedEmployeeIds}
            setSelectedEmployeeIds={setSelectedEmployeeIds}
            departments={departments}
            employees={employees}
            handleCreateReport={handleCreateReport}
            isCreating={isCreating}
            handleDeleteReport={handleDeleteReport}
          />
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-6 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-sm cursor-pointer"
          title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 sm:p-6 min-w-0">
        {selectedReport ? (
          <Tabs defaultValue="board">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-200">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-800">{selectedReport.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={selectedReport.status === "closed" ? "secondary" : "default"}
                      className={`text-xs font-semibold ${selectedReport.status === "closed" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-800"}`}>
                      {selectedReport.status === "closed" ? "Đã khóa" : "Đang mở"}
                    </Badge>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500">
                      {fmtVN(selectedReport.fromDate)} → {fmtVN(selectedReport.toDate)} ({daysArray.length} ngày)
                    </span>
                  </div>
                </div>
              </div>
              <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <TabsTrigger value="board" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2">
                  <CalendarDays className="w-4 h-4 mr-2" /> Hành Chính & Show
                </TabsTrigger>
                <TabsTrigger value="overtime" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" /> Làm Thêm
                </TabsTrigger>
                <TabsTrigger value="shortfall" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2">
                  <TimerOff className="w-4 h-4 mr-2" /> Đi Muộn
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2">
                  <TrendingUp className="w-4 h-4 mr-2" /> Thống Kê
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center mb-4">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <Filter className="w-4 h-4 text-slate-400" />
                <select className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[180px]"
                  value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>{d === "ALL" ? "🏢 Tất cả phòng ban" : d}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-medium px-3 py-2">
                <Users className="w-3.5 h-3.5 mr-1.5" /> {filteredRows.length} nhân sự
              </Badge>

              <div className="flex gap-2 ml-auto flex-wrap">
                {Object.keys(editingRecords).length > 0 && selectedReport.status !== "closed" && (
                  <Button size="sm" onClick={handleSaveAll} disabled={isSavingAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold">
                    {isSavingAll ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu tất cả ({Object.keys(editingRecords).length})
                  </Button>
                )}

                <Button size="sm" onClick={handleDownloadTemplate}
                  disabled={selectedReport.status === "closed"}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold disabled:opacity-50">
                  <Download className="w-4 h-4 mr-2" /> Tải file mẫu
                </Button>

                <label className={`cursor-pointer ${selectedReport.status === "closed" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    disabled={selectedReport.status === "closed" || isImporting}
                    className="hidden" />
                  <Button size="sm" asChild disabled={selectedReport.status === "closed" || isImporting}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold disabled:opacity-50">
                    <span>
                      {isImporting
                        ? <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Đang nhập...</>
                        : <><Upload className="w-4 h-4 mr-2" /> Import Excel</>}
                    </span>
                  </Button>
                </label>

                <Button variant="outline" size="sm"
                  onClick={() => fetchReportData(selectedReport._id)}
                  className="border-slate-200 hover:bg-slate-50 font-medium rounded-xl">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Làm mới
                </Button>

                <Button size="sm" onClick={handleToggleStatus}
                  className={`rounded-xl font-bold ${selectedReport.status === "closed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                  {selectedReport.status === "closed"
                    ? <><Unlock className="w-4 h-4 mr-2" /> Mở khóa</>
                    : <><Lock className="w-4 h-4 mr-2" /> Chốt báo cáo</>}
                </Button>
              </div>
            </div>

            <ReportBoardTable
              isDataLoading={isDataLoading}
              filteredAttendances={filteredRows}
              editingRecords={editingRecords}
              report={selectedReport}
              daysArray={daysArray}
              setSearchQuery={setSearchQuery}
              setSelectedDept={setSelectedDept}
              handleSaveRow={handleSaveRow}
              handleAdvanceChange={handleAdvanceChange}
              handleKpiChange={handleKpiChange}
              handleTotalPaidDaysChange={handleTotalPaidDaysChange}
            />
            <ReportOvertimeTable
              isDataLoading={isDataLoading}
              filteredAttendances={filteredRows}
              editingRecords={editingRecords}
              report={selectedReport}
              daysArray={daysArray}
              setSearchQuery={setSearchQuery}
              setSelectedDept={setSelectedDept}
              handleSaveRow={handleSaveRow}
              toggleOvertime={toggleOvertime}
            />
            <ReportShortfallTable
              isDataLoading={isDataLoading}
              filteredAttendances={filteredRows}
              editingRecords={editingRecords}
              report={selectedReport}
              daysArray={daysArray}
              setSearchQuery={setSearchQuery}
              setSelectedDept={setSelectedDept}
              handleSaveRow={handleSaveRow}
              handleShortfallDailyChange={handleShortfallDailyChange}
            />

            <TabsContent value="stats">
              <StatsView
                stats={stats}
                departmentStats={departmentStats}
                chartData={chartData}
                selectedDept={selectedDept}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-[700px] flex flex-col items-center justify-center text-slate-300 bg-white/80 rounded-3xl border-2 border-dashed border-slate-200">
            <CalendarClock className="w-16 h-16 text-purple-300 mb-6" />
            <p className="font-bold text-xl text-slate-400 mb-2">Chưa chọn báo cáo</p>
            <p className="text-sm text-slate-400">Tạo báo cáo mới ở cột bên trái để bắt đầu</p>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}