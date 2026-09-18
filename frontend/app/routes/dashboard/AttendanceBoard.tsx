import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { 
  CalendarDays, RefreshCcw, CalendarClock, Search, TrendingUp, Users, Filter, 
  X, Trash2, Lock, Unlock, FileSpreadsheet, Clock, TimerOff, Save,
  ChevronLeft, ChevronRight, Upload, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";

import { Sidebar } from "./AttendanceBoard/Sidebar";
import { StatsView } from "./AttendanceBoard/StatsView";
import { BoardTable, OvertimeTable, ShortfallTable } from "./AttendanceBoard/Tables";
import { API_BASE_URL, getAuthHeaders, getDayOfWeek } from "./AttendanceBoard/utils";

export default function AttendanceBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonthDoc, setSelectedMonthDoc] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingRecords, setEditingRecords] = useState<{ [recordId: string]: any }>({});
  const [isInitializingMonth, setIsInitializingMonth] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMonthsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/months`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMonthsList(data);
        if (data.length > 0 && !selectedMonthDoc) setSelectedMonthDoc(data[0]);
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchAttendanceData = async (month: number, year: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${month}&year=${year}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
        setEditingRecords({}); 
      }
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  const handleInitializeMonth = async () => {
    setIsInitializingMonth(true);
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ month: newMonth, year: newYear }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Khởi tạo thất bại"); return; }
      alert(data.message || "Đã khởi tạo thành công");
      await fetchMonthsList();
    } catch (error) { alert("Có lỗi khi khởi tạo kỳ công"); } finally { setIsInitializingMonth(false); }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => {
    if (selectedMonthDoc) fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year);
  }, [selectedMonthDoc]);

  const uniqueDepartments = useMemo(() => {
    const depts = attendances.map((a) => a.employee?.workInfo?.department).filter(Boolean);
    return ["ALL", ...Array.from(new Set(depts))].sort();
  }, [attendances]);

  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const nameMatch = att.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        att.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = selectedDept === "ALL" || att.employee?.workInfo?.department === selectedDept;
      return nameMatch && deptMatch;
    });
  }, [attendances, searchQuery, selectedDept]);

  const stats = useMemo(() => {
    const totalPaidDays = filteredAttendances.reduce((acc, curr) => acc + (curr.summary?.totalPaidDays || 0), 0);
    const totalAdvance = filteredAttendances.reduce((acc, curr) => acc + (curr.advancePayment || 0), 0);
    const totalOT = filteredAttendances.reduce((acc, curr) => acc + (curr.summary?.totalOT || 0), 0);
    const totalShortfall = filteredAttendances.reduce((acc, curr) => acc + (curr.summary?.totalShortfallHours || 0), 0);
    const avgDays = filteredAttendances.length > 0 ? (totalPaidDays / filteredAttendances.length).toFixed(1) : "0";
    return { count: filteredAttendances.length, totalPaidDays, totalAdvance, totalOT, totalShortfall, avgDays };
  }, [filteredAttendances]);

  const departmentStats = useMemo(() => {
    const deptMap: { [key: string]: any } = {};
    filteredAttendances.forEach((att) => {
      const dept = att.employee?.workInfo?.department || "Chưa xếp phòng";
      if (!deptMap[dept]) {
        deptMap[dept] = { name: dept, employees: 0, totalDays: 0, totalAdvance: 0, totalOT: 0, totalShortfall: 0 };
      }
      deptMap[dept].employees++;
      deptMap[dept].totalDays += att.summary?.totalPaidDays || 0;
    });
    return Object.values(deptMap).sort((a: any, b: any) => b.totalDays - a.totalDays);
  }, [filteredAttendances]);

  const chartData = useMemo(() => {
    return filteredAttendances
      .map((att) => ({ name: att.employee?.fullName?.split(" ").pop() || "N/A", total: att.summary?.totalPaidDays || 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredAttendances]);

  // ==========================================
  // ACTIONS
  // ==========================================

  const deriveAttendanceFromKpi = (kpi: { minishow?: number; bigshow?: number } | undefined) => {
    const mini = kpi?.minishow || 0;
    const big  = kpi?.bigshow || 0;
    if (mini > 0 || big > 0) return "X";
    return "OFF";
  };

  const toggleAttendance = useCallback(() => {
    return;
  }, []);

  const handleKpiChange = useCallback((recordId: string, dayKey: string, type: 'minishow' | 'bigshow', value: string) => {
    if (selectedMonthDoc?.status === "closed") return;
    const numValue = value === "" ? 0 : parseInt(value.replace(/\D/g, ""), 10);
    
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId]
        ? JSON.parse(JSON.stringify(prev[recordId]))
        : JSON.parse(JSON.stringify(attendances.find((a) => a._id === recordId)));
      if (!currentEdit.kpiRecords) currentEdit.kpiRecords = {};
      if (!currentEdit.kpiRecords[dayKey]) currentEdit.kpiRecords[dayKey] = { minishow: 0, bigshow: 0 };
      
      currentEdit.kpiRecords[dayKey][type] = numValue;

      if (!currentEdit.records) currentEdit.records = {};
      currentEdit.records[dayKey] = deriveAttendanceFromKpi(currentEdit.kpiRecords[dayKey]);

      return { ...prev, [recordId]: currentEdit };
    });
  }, [selectedMonthDoc, attendances]);

  const toggleOvertime = useCallback((recordId: string, dayKey: string, currentVal: string) => {
    if (selectedMonthDoc?.status === "closed") return;
    const val = currentVal?.toString().toUpperCase() || "";
    let nextVal = "";
    if (val === "X") nextVal = "N";
    else if (val === "N") nextVal = "T";
    else if (val === "T") nextVal = "";
    else nextVal = "X";

    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || { ...attendances.find((a) => a._id === recordId) };
      if (!currentEdit.overtimeRecords) currentEdit.overtimeRecords = {};
      currentEdit.overtimeRecords[dayKey] = nextVal;
      return { ...prev, [recordId]: currentEdit };
    });
  }, [selectedMonthDoc, attendances]);

  const handleShortfallDailyChange = useCallback((recordId: string, dayKey: string, value: string) => {
    let numValue = value.replace(/[^0-9.\-]/g, "");
    if (numValue.indexOf("-") > 0) numValue = numValue.replace(/-/g, "");
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || { ...attendances.find((a) => a._id === recordId) };
      if (!currentEdit.shortfallRecords) currentEdit.shortfallRecords = {};
      currentEdit.shortfallRecords[dayKey] = numValue;
      return { ...prev, [recordId]: currentEdit };
    });
  }, [attendances]);

  const handleAdvanceChange = useCallback((recordId: string, value: string) => {
    const numValue = value.replace(/\D/g, "");
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || { ...attendances.find((a) => a._id === recordId) };
      currentEdit.advancePayment = Number(numValue);
      return { ...prev, [recordId]: currentEdit };
    });
  }, [attendances]);

  const handleSaveRow = async (recordId: string) => {
    const updatedData = editingRecords[recordId];
    if (!updatedData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${recordId}/bulk-update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          advancePayment: updatedData.advancePayment, 
          records: updatedData.records, 
          overtimeRecords: updatedData.overtimeRecords, 
          shortfallRecords: updatedData.shortfallRecords,
          kpiRecords: updatedData.kpiRecords 
        }),
      });
      if (res.ok) await fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year);
    } catch (error) { console.error(error); }
  };

  const handleSaveAll = async () => {
    const recordIds = Object.keys(editingRecords);
    if (recordIds.length === 0) return;

    setIsSavingAll(true);
    try {
      const promises = recordIds.map((id) => {
        const updatedData = editingRecords[id];
        return fetch(`${API_BASE_URL}/${id}/bulk-update`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            advancePayment: updatedData.advancePayment,
            records: updatedData.records,
            overtimeRecords: updatedData.overtimeRecords,
            shortfallRecords: updatedData.shortfallRecords,
            kpiRecords: updatedData.kpiRecords 
          }),
        });
      });

      await Promise.all(promises);
      await fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year);
      alert("Đã lưu tất cả thay đổi thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu tất cả:", error);
      alert("Có lỗi xảy ra khi lưu dữ liệu hàng loạt!");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonthDoc) return;
    if (!window.confirm(`Bạn có chắc muốn xoá toàn bộ dữ liệu chấm công tháng ${selectedMonthDoc.month}/${selectedMonthDoc.year}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}?month=${selectedMonthDoc.month}&year=${selectedMonthDoc.year}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) return alert("Xóa thất bại");
      alert("Đã xoá thành công");
      setSelectedMonthDoc(null);
      await fetchMonthsList();
      setAttendances([]);
    } catch (error) { alert("Có lỗi khi xoá kỳ công"); }
  };

  const handleToggleMonthStatus = async () => {
    if (!selectedMonthDoc) return;
    const nextStatus = selectedMonthDoc.status === "closed" ? "open" : "closed";
    if (!window.confirm(nextStatus === "closed" ? "Chốt công sẽ không thể chỉnh sửa?" : "Mở khóa tháng này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/months/${selectedMonthDoc._id}/status`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ status: nextStatus }) });
      if (!res.ok) return alert("Thất bại");
      alert("Thành công");
      await fetchMonthsList();
      setSelectedMonthDoc((prev: any) => ({ ...prev, status: nextStatus }));
    } catch (error) { alert("Có lỗi"); }
  };

  // ==========================================
  // KỲ CÔNG
  // ==========================================
  const daysArray = useMemo(() => {
    if (!selectedMonthDoc) return [];

    const m = Number(selectedMonthDoc.month);
    const y = Number(selectedMonthDoc.year);

    const start = new Date(y, m - 2, 26);
    const end   = new Date(y, m - 1, 25);

    const days: {
      date: Date;
      day: number;
      month: number;
      year: number;
      key: string;
      label: string;
      dow: string;
    }[] = [];

    const current = new Date(start);
    while (current <= end) {
      const yy = current.getFullYear();
      const mm = current.getMonth() + 1;
      const dd = current.getDate();
      const iso = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

      days.push({
        date: new Date(current),
        day: dd,
        month: mm,
        year: yy,
        key: iso,
        label: `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}`,
        dow: getDayOfWeek(yy, mm, dd).name,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [selectedMonthDoc]);

  // ==========================================
  // TẢI FILE MẪU EXCEL
  // ==========================================
  const handleDownloadTemplate = () => {
    if (!selectedMonthDoc) return alert("Chưa chọn kỳ công!");
    if (filteredAttendances.length === 0) return alert("Không có nhân sự nào!");

    const wb = XLSX.utils.book_new();

    // ===== HEADER =====
    const periodLabel = `KỲ ${selectedMonthDoc.month}/${selectedMonthDoc.year} (26/${selectedMonthDoc.month - 1} → 25/${selectedMonthDoc.month})`;

    // Dòng 1: Tiêu đề
    const titleRow = [`BẢNG CHẤM CÔNG & SHOW ${periodLabel}`];

    // Dòng 2: Trống
    const blankRow: any[] = [];

    // Dòng 3: Ngày (mỗi ngày merge 2 cột M, B)
    const dateHeader: any[] = ["STT", "Mã NV", "Họ và tên", "Phòng ban"];
    daysArray.forEach((d) => {
      dateHeader.push(`${d.label}\nM`);  // Cột M
      dateHeader.push(`${d.label}\nB`);  // Cột B
    });
    dateHeader.push("Tạm ứng");

    // Dòng 4: Thứ
    const dowHeader: any[] = ["", "", "", ""];
    daysArray.forEach((d) => {
      dowHeader.push(d.dow);
      dowHeader.push("");
    });
    dowHeader.push("");

    // ===== DỮ LIỆU =====
    const dataRows: any[][] = [];
    const sortedForExport = [...filteredAttendances].sort((a, b) => {
      const ca = String(a.employee?.employeeCode || "");
      const cb = String(b.employee?.employeeCode || "");
      return ca.localeCompare(cb, undefined, { numeric: true, sensitivity: "base" });
    });

    sortedForExport.forEach((att, idx) => {
      const rowData = editingRecords[att._id] || att;
      const row: any[] = [
        idx + 1,
        att.employee?.employeeCode || "",
        att.employee?.fullName || "",
        att.employee?.workInfo?.department || "",
      ];

      // Mỗi ngày: M và B
      daysArray.forEach((d) => {
        const mini = rowData.kpiRecords?.[d.key]?.minishow || 0;
        const big = rowData.kpiRecords?.[d.key]?.bigshow || 0;
        row.push(mini);
        row.push(big);
      });

      row.push(rowData.advancePayment || 0);
      dataRows.push(row);
    });

    // ===== TẠO WORKSHEET =====
    const wsData: any[][] = [
      titleRow,
      blankRow,
      dateHeader,
      dowHeader,
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ===== MERGE CELLS CHO DÒNG TIÊU ĐỀ =====
    const totalCols = 4 + daysArray.length * 2 + 1; // STT + Mã + Tên + Phòng + (ngày × 2) + Tạm ứng
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title merge toàn bộ
    ];

    // ===== MERGE TỪNG CẶP NGÀY (M và B) Ở DÒNG HEADER =====
    daysArray.forEach((d, dayIdx) => {
      const colM = 4 + dayIdx * 2;
      const colB = colM + 1;
      ws["!merges"] ??= [];
      ws["!merges"]!.push({
        s: { r: 2, c: colM },
        e: { r: 2, c: colB },
      });
    });

    // ===== SET ĐỘ RỘNG CỘT =====
    const cols: any[] = [
      { wch: 5 },   // STT
      { wch: 10 },  // Mã NV
      { wch: 25 },  // Họ tên
      { wch: 15 },  // Phòng ban
    ];
    daysArray.forEach(() => {
      cols.push({ wch: 5 }); // M
      cols.push({ wch: 5 }); // B
    });
    cols.push({ wch: 12 }); // Tạm ứng
    ws["!cols"] = cols;

    // ===== HEADER STYLE (tùy chọn — chỉ có tác dụng nếu dùng xlsx-js-style) =====
    // Đoạn này bỏ trống vì đang dùng xlsx thường

    // ===== SHEET 2: HƯỚNG DẪN =====
    const guideData = [
      ["HƯỚNG DẪN SỬ DỤNG FILE MẪU"],
      [],
      ["1. Mỗi ngày chiếm 2 cột liên tiếp: cột trái = Mini Show (M), cột phải = Big Show (B)"],
      ["2. Chỉ nhập số vào ô M và B. Các cột khác (STT, Mã NV, Họ tên, Phòng ban) KHÔNG sửa."],
      ["3. Quy tắc tính công:"],
      ["   - Có M > 0 hoặc B > 0 → ngày đó được tính CÔNG (X)"],
      ["   - Không có gì (M = 0 và B = 0) → ngày đó OFF"],
      [],
      ["4. Sau khi điền xong:"],
      ["   - Vào giao diện Chấm công → chọn đúng kỳ"],
      ["   - Bấm 'Import Excel' → chọn file này"],
      ["   - Kiểm tra lại → Bấm 'Lưu tất cả'"],
      [],
      ["5. LƯU Ý:"],
      ["   - KHÔNG thay đổi thứ tự dòng nhân sự"],
      ["   - KHÔNG xóa/thêm cột"],
      ["   - KHÔNG sửa tên sheet"],
    ];
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide["!cols"] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, ws, "ChamCong");
    XLSX.utils.book_append_sheet(wb, wsGuide, "HuongDan");

    // ===== XUẤT FILE =====
    const fileName = `Mau_ChamCong_Ky${selectedMonthDoc.month}_${selectedMonthDoc.year}${selectedDept !== "ALL" ? "_" + selectedDept.replace(/\s/g, "_") : ""}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ==========================================
  // IMPORT TỪ FILE EXCEL
  // ==========================================
 // ==========================================
// IMPORT TỪ FILE EXCEL — Ghép theo MÃ NV (cột B)
// ==========================================
const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (selectedMonthDoc?.status === "closed") {
    alert("Kỳ công đã bị khóa, không thể import!");
    e.target.value = "";
    return;
  }

  setIsImporting(true);
  const reader = new FileReader();

  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames.includes("ChamCong")
        ? "ChamCong"
        : workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
      if (rows.length === 0) { alert("File Excel rỗng!"); setIsImporting(false); return; }

      // ===== TÌM DÒNG BẮT ĐẦU DỮ LIỆU =====
      // Dòng dữ liệu: cột A (STT) là số > 0 VÀ cột B (Mã NV) không trống
      let startRowIdx = 0;
      for (let i = 0; i < rows.length; i++) {
        const c0 = String(rows[i][0] || "").trim();
        const c1 = String(rows[i][1] || "").trim();
        if (c0 && !isNaN(Number(c0)) && Number(c0) > 0 && c1) {
          startRowIdx = i;
          break;
        }
      }

      // ===== XÂY MAP: Mã NV → Nhân sự trong bảng =====
      const empCodeMap = new Map<string, any>();
      attendances.forEach((att) => {
        const code = String(att.employee?.employeeCode || "").trim().toUpperCase();
        if (code) empCodeMap.set(code, att);
      });

      if (empCodeMap.size === 0) {
        alert("Không có nhân sự nào để áp dụng!");
        setIsImporting(false);
        return;
      }

      // ===== ÁP DỤNG =====
      const newEdits = { ...editingRecords };
      let totalRowsApplied = 0;
      let totalCellsApplied = 0;
      let skippedRows = 0;
      const skippedCodes: string[] = [];

      for (let i = startRowIdx; i < rows.length; i++) {
        const row = rows[i];
        const stt = String(row[0] || "").trim();
        const empCode = String(row[1] || "").trim().toUpperCase();

        // Bỏ qua dòng không có STT hoặc mã NV
        if (!stt || isNaN(Number(stt)) || Number(stt) <= 0) continue;
        if (!empCode) { skippedRows++; continue; }

        // Tìm nhân sự theo mã NV
        const att = empCodeMap.get(empCode);
        if (!att) {
          // Mã NV không có trong bảng hiện tại (VD: khác phòng ban đang filter)
          skippedRows++;
          if (skippedCodes.length < 5) skippedCodes.push(empCode);
          continue;
        }

        const empId = att._id;
        if (!newEdits[empId]) {
          newEdits[empId] = JSON.parse(JSON.stringify(att));
        }
        const edit = newEdits[empId];
        if (!edit.kpiRecords) edit.kpiRecords = {};
        if (!edit.records) edit.records = {};

        // Dữ liệu bắt đầu từ cột E (index 4)
        // Mỗi ngày 2 cột: (4 + 2*i) = Mini, (4 + 2*i+1) = Big
        daysArray.forEach((d, dayIdx) => {
          const miniColIdx = 4 + dayIdx * 2;
          const bigColIdx  = 4 + dayIdx * 2 + 1;

          const miniRaw = row[miniColIdx];
          const bigRaw  = row[bigColIdx];

          const hasMini = miniRaw !== undefined && miniRaw !== "" && !isNaN(Number(miniRaw));
          const hasBig  = bigRaw  !== undefined && bigRaw  !== "" && !isNaN(Number(bigRaw));
          if (!hasMini && !hasBig) return;

          const miniVal = hasMini ? Number(miniRaw) : 0;
          const bigVal  = hasBig  ? Number(bigRaw)  : 0;

          edit.kpiRecords[d.key] = { minishow: miniVal, bigshow: bigVal };
          edit.records[d.key] = (miniVal > 0 || bigVal > 0) ? "X" : "OFF";
          totalCellsApplied++;
        });

        totalRowsApplied++;
      }

      setEditingRecords(newEdits);

      let msg = `Đã import ${totalRowsApplied} nhân sự (${totalCellsApplied} ngày). Bấm "Lưu tất cả" để hoàn tất.`;
      if (skippedRows > 0) {
        msg += `\n\nBỏ qua ${skippedRows} dòng (mã NV không có trong bảng hiện tại)`;
        if (skippedCodes.length > 0) {
          msg += `.\nVD: ${skippedCodes.join(", ")}`;
        }
      }
      alert(msg);
    } catch (error) {
      console.error("Lỗi import Excel:", error);
      alert("Có lỗi khi đọc file Excel. Kiểm tra lại format file!");
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

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden font-sans">
      
      <aside 
        className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm
        ${isSidebarOpen ? 'w-[320px]' : 'w-0'}`}
      >
        <div 
          className={`w-[320px] h-full p-5 overflow-y-auto no-scrollbar
          ${isSidebarOpen ? 'block' : 'hidden'}`}
        >
          <Sidebar 
            monthsList={monthsList} selectedMonthDoc={selectedMonthDoc} setSelectedMonthDoc={setSelectedMonthDoc}
            newMonth={newMonth} setNewMonth={setNewMonth} newYear={newYear} setNewYear={setNewYear} handleInitializeMonth={handleInitializeMonth}
            isInitializing={isInitializingMonth}
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
        {selectedMonthDoc ? (
          <Tabs defaultValue="board">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-800">Kỳ Chấm Công {selectedMonthDoc.month}/{selectedMonthDoc.year}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedMonthDoc.status === "closed" ? "secondary" : "default"} className={`text-xs font-semibold ${selectedMonthDoc.status === "closed" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-800"}`}>
                      {selectedMonthDoc.status === "closed" ? "Đã khóa" : "Đang mở"}
                    </Badge>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500">
                      {daysArray.length} ngày (26/{selectedMonthDoc.month - 1} → 25/{selectedMonthDoc.month})
                    </span>
                  </div>
                </div>
              </div>
              <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <TabsTrigger value="board" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2"><CalendarDays className="w-4 h-4 mr-2" /> Hành Chính & Show</TabsTrigger>
                <TabsTrigger value="overtime" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2"><Clock className="w-4 h-4 mr-2" /> Làm Thêm</TabsTrigger>
                <TabsTrigger value="shortfall" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2"><TimerOff className="w-4 h-4 mr-2" /> Đi Muộn</TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2"><TrendingUp className="w-4 h-4 mr-2" /> Thống Kê</TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center mb-4">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <Filter className="w-4 h-4 text-slate-400" />
                <select className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[180px]" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  {uniqueDepartments.map((d) => <option key={d} value={d}>{d === "ALL" ? "🏢 Tất cả phòng ban" : d}</option>)}
                </select>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>

              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium px-3 py-2"><Users className="w-3.5 h-3.5 mr-1.5" /> {filteredAttendances.length} nhân sự</Badge>

              <div className="flex gap-2 ml-auto">
                {Object.keys(editingRecords).length > 0 && selectedMonthDoc.status !== "closed" && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveAll} 
                    disabled={isSavingAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                  >
                    {isSavingAll ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu tất cả ({Object.keys(editingRecords).length})
                  </Button>
                )}

                {/* ===== TẢI FILE MẪU ===== */}
                <Button 
                  size="sm" 
                  onClick={handleDownloadTemplate} 
                  disabled={selectedMonthDoc.status === "closed"}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Tải file mẫu
                </Button>

                {/* ===== IMPORT EXCEL ===== */}
                <label className={`cursor-pointer ${selectedMonthDoc.status === "closed" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleImportExcel} 
                    disabled={selectedMonthDoc.status === "closed" || isImporting}
                    className="hidden" 
                  />
                  <Button 
                    size="sm" 
                    asChild
                    disabled={selectedMonthDoc.status === "closed" || isImporting}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    <span>
                      {isImporting ? (
                        <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Đang nhập...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" /> Import Excel</>
                      )}
                    </span>
                  </Button>
                </label>

                <Button variant="outline" size="sm" onClick={() => fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year)} className="border-slate-200 hover:bg-slate-50 font-medium rounded-xl"><RefreshCcw className="w-4 h-4 mr-2" /> Làm mới</Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteMonth} disabled={selectedMonthDoc?.status === "closed"} className="rounded-xl"><Trash2 className="w-4 h-4 mr-2" /> Xóa</Button>
                <Button size="sm" onClick={handleToggleMonthStatus} className={`rounded-xl font-bold ${selectedMonthDoc.status === "closed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                  {selectedMonthDoc.status === "closed" ? <><Unlock className="w-4 h-4 mr-2" /> Mở khóa</> : <><Lock className="w-4 h-4 mr-2" /> Chốt công</>}
                </Button>
              </div>
            </div>

            <BoardTable 
              isDataLoading={isDataLoading} 
              filteredAttendances={filteredAttendances} 
              editingRecords={editingRecords} 
              selectedMonthDoc={selectedMonthDoc} 
              daysArray={daysArray} 
              setSearchQuery={setSearchQuery} 
              setSelectedDept={setSelectedDept} 
              handleSaveRow={handleSaveRow} 
              toggleAttendance={toggleAttendance} 
              handleAdvanceChange={handleAdvanceChange} 
              handleKpiChange={handleKpiChange} 
            />
            <OvertimeTable 
              isDataLoading={isDataLoading} 
              filteredAttendances={filteredAttendances} 
              editingRecords={editingRecords} 
              selectedMonthDoc={selectedMonthDoc} 
              daysArray={daysArray} 
              setSearchQuery={setSearchQuery} 
              setSelectedDept={setSelectedDept} 
              handleSaveRow={handleSaveRow} 
              toggleOvertime={toggleOvertime} 
            />
            <ShortfallTable 
              isDataLoading={isDataLoading} 
              filteredAttendances={filteredAttendances} 
              editingRecords={editingRecords} 
              selectedMonthDoc={selectedMonthDoc} 
              daysArray={daysArray} 
              setSearchQuery={setSearchQuery} 
              setSelectedDept={setSelectedDept} 
              handleSaveRow={handleSaveRow} 
              handleShortfallDailyChange={handleShortfallDailyChange} 
            />

            <TabsContent value="stats">
              <StatsView stats={stats} departmentStats={departmentStats} chartData={chartData} selectedDept={selectedDept} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-[700px] flex flex-col items-center justify-center text-slate-300 bg-white/80 rounded-3xl border-2 border-dashed border-slate-200">
            <CalendarClock className="w-16 h-16 text-blue-300 mb-6" />
            <p className="font-bold text-xl text-slate-400 mb-2">Chưa chọn kỳ công</p>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}