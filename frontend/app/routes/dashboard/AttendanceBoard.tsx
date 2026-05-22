import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { 
  CalendarDays, RefreshCcw, CalendarClock, Search, TrendingUp, Users, Filter, 
  X, Trash2, Lock, Unlock, FileSpreadsheet, Clock, TimerOff, Save,
  ChevronLeft, ChevronRight
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
  const [isExporting, setIsExporting] = useState(false);
  const [isInitializingMonth, setIsInitializingMonth] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  // ACTIONS TỪ BẢNG ĐÃ SỬA LẠI LOGIC
  // ==========================================
  const toggleAttendance = useCallback((recordId: string, day: string, currentVal: string) => {
    if (selectedMonthDoc?.status === "closed") return;
    const val = currentVal?.toString().toUpperCase() || "";
    let nextVal = "";
    
    // Đã đổi thành 4 trạng thái: Rỗng -> X -> 0.5 -> OFF -> Rỗng
    if (val === "" || val === undefined) nextVal = "X";
    else if (val === "X") nextVal = "0.5";
    else if (val === "0.5" || val === "0,5") nextVal = "OFF";
    else if (val === "OFF") nextVal = "";
    else nextVal = "X"; 
    
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] ? JSON.parse(JSON.stringify(prev[recordId])) : JSON.parse(JSON.stringify(attendances.find((a) => a._id === recordId)));
      if (!currentEdit.records) currentEdit.records = {};
      currentEdit.records[day] = nextVal;

      if (nextVal !== "X" && nextVal !== "0.5") {
        if (currentEdit.kpiRecords && currentEdit.kpiRecords[day]) {
          currentEdit.kpiRecords[day] = { minishow: 0, bigshow: 0 };
        }
      }

      return { ...prev, [recordId]: currentEdit };
    });
  }, [selectedMonthDoc, attendances]);

  const handleKpiChange = useCallback((recordId: string, day: string, type: 'minishow' | 'bigshow', value: string) => {
    if (selectedMonthDoc?.status === "closed") return;
    const numValue = value === "" ? 0 : parseInt(value.replace(/\D/g, ""), 10);
    
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] ? JSON.parse(JSON.stringify(prev[recordId])) : JSON.parse(JSON.stringify(attendances.find((a) => a._id === recordId)));
      if (!currentEdit.kpiRecords) currentEdit.kpiRecords = {};
      if (!currentEdit.kpiRecords[day]) currentEdit.kpiRecords[day] = { minishow: 0, bigshow: 0 };
      
      currentEdit.kpiRecords[day][type] = numValue;

      // Logic mới: Điền KPI tự nhảy X
      if (numValue > 0) {
        if (!currentEdit.records) currentEdit.records = {};
        const currentRecordVal = currentEdit.records[day]?.toString().toUpperCase() || "";
        
        if (currentRecordVal === "" || currentRecordVal === "OFF") {
          currentEdit.records[day] = "X";
        }
      }

      return { ...prev, [recordId]: currentEdit };
    });
  }, [selectedMonthDoc, attendances]);

  const toggleOvertime = useCallback((recordId: string, day: string, currentVal: string) => {
    if (selectedMonthDoc?.status === "closed") return;
    const val = currentVal?.toString().toUpperCase() || "";
    let nextVal = "";
    if (val === "X") nextVal = "N"; else if (val === "N") nextVal = "T"; else if (val === "T") nextVal = ""; else nextVal = "X";
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || { ...attendances.find((a) => a._id === recordId) };
      if (!currentEdit.overtimeRecords) currentEdit.overtimeRecords = {};
      currentEdit.overtimeRecords[day] = nextVal;
      return { ...prev, [recordId]: currentEdit };
    });
  }, [selectedMonthDoc, attendances]);

  const handleShortfallDailyChange = useCallback((recordId: string, day: string, value: string) => {
    let numValue = value.replace(/[^0-9.\-]/g, "");
    if (numValue.indexOf("-") > 0) numValue = numValue.replace(/-/g, "");
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || { ...attendances.find((a) => a._id === recordId) };
      if (!currentEdit.shortfallRecords) currentEdit.shortfallRecords = {};
      currentEdit.shortfallRecords[day] = numValue;
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

  const daysArray = useMemo(() => Array.from({ length: selectedMonthDoc ? new Date(selectedMonthDoc.year, selectedMonthDoc.month, 0).getDate() : 31 }, (_, i) => i + 1), [selectedMonthDoc]);

  const handleExportExcel = async () => {
    if (!selectedMonthDoc || filteredAttendances.length === 0) return alert("Không có dữ liệu để xuất!");
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const wb = XLSX.utils.book_new();

      const attendanceData = [[`BẢNG CHẤM CÔNG & SHOW THÁNG ${selectedMonthDoc.month}/${selectedMonthDoc.year}`], [], [`Phòng ban: ${selectedDept === "ALL" ? "Tất cả" : selectedDept}`, ``, ``, ``, ``, `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`], []];
      const header1 = ["STT", "Mã NV", "Họ và tên", "Phòng ban", "Tạm ứng"]; 
      daysArray.forEach(d => header1.push(`${d}`)); 
      header1.push("Công [X]", "Công [0.5]", "Tổng công", "Tổng Mini Show", "Tổng Big Show"); 
      attendanceData.push(header1);
      
      const header2 = ["", "", "", "", ""]; 
      daysArray.forEach(d => header2.push(getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d).name)); 
      header2.push("", "", "", "", ""); 
      attendanceData.push(header2);
      
      filteredAttendances.forEach((att, idx) => {
        const rowData = editingRecords[att._id] || att;
        const row = [idx + 1, att.employee?.employeeCode || "", att.employee?.fullName || "", att.employee?.workInfo?.department || "", rowData.advancePayment || 0];
        
        daysArray.forEach(d => {
          let cellText = rowData.records?.[d] || "";
          const mini = rowData.kpiRecords?.[d]?.minishow;
          const big = rowData.kpiRecords?.[d]?.bigshow;
          if (mini || big) {
            cellText += ` (M:${mini||0}, B:${big||0})`;
          }
          row.push(cellText);
        });

        row.push(
          att.summary?.totalFullDays || 0, 
          att.summary?.totalHalfDays || 0, 
          att.summary?.totalPaidDays || 0,
          att.summary?.totalMinishow || 0,
          att.summary?.totalBigshow || 0
        );
        attendanceData.push(row);
      });

      const otData = [[`BẢNG LÀM THÊM GIỜ & ĐI MUỘN THÁNG ${selectedMonthDoc.month}/${selectedMonthDoc.year}`], [], [`Phòng ban: ${selectedDept === "ALL" ? "Tất cả" : selectedDept}`, ``, ``, `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`], []];
      const otHeader1 = ["STT", "Mã NV", "Họ và tên", "Phòng ban"]; daysArray.forEach(d => otHeader1.push(`${d}`)); otHeader1.push("Thường [X]", "Nghỉ [N]", "Lễ [T]", "Tổng OT", "Tổng Giờ Thiếu"); otData.push(otHeader1);
      const otHeader2 = ["", "", "", ""]; daysArray.forEach(d => otHeader2.push(getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d).name)); otHeader2.push("", "", "", "", ""); otData.push(otHeader2);
      
      filteredAttendances.forEach((att, idx) => {
        const rowData = editingRecords[att._id] || att;
        const row = [idx + 1, att.employee?.employeeCode || "", att.employee?.fullName || "", att.employee?.workInfo?.department || ""];
        daysArray.forEach(d => {
          let cellVal = "";
          if (rowData.overtimeRecords?.[d]) cellVal += rowData.overtimeRecords[d];
          if (rowData.shortfallRecords?.[d]) cellVal += (cellVal ? " / " : "") + "-" + rowData.shortfallRecords[d] + "h";
          row.push(cellVal);
        });
        row.push(att.summary?.totalOTNormal || 0, att.summary?.totalOTWeekend || 0, att.summary?.totalOTHoliday || 0, att.summary?.totalOT || 0, att.summary?.totalShortfallHours || 0);
        otData.push(row);
      });

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attendanceData), "Hành chính & Show");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(otData), "Làm thêm & Đi muộn");
      XLSX.writeFile(wb, `ChamCong_T${selectedMonthDoc.month}_${selectedMonthDoc.year}${selectedDept !== "ALL" ? "_" + selectedDept.replace(/\s/g, "_") : ""}.xlsx`);
    } catch (error) { alert("Có lỗi khi xuất Excel."); } finally { setIsExporting(false); }
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
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

        {/* Nút Toggle thu/phóng nhỏ gọn, không viền đổ bóng rườm rà */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-6 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-sm cursor-pointer"
          title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </aside>

      {/* MAIN CONTENT */}
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
                    <span className="text-sm text-slate-500">{daysArray.length} ngày làm việc</span>
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
                <Button variant="outline" size="sm" onClick={() => fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year)} className="border-slate-200 hover:bg-slate-50 font-medium rounded-xl"><RefreshCcw className="w-4 h-4 mr-2" /> Làm mới</Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteMonth} disabled={selectedMonthDoc?.status === "closed"} className="rounded-xl"><Trash2 className="w-4 h-4 mr-2" /> Xóa</Button>
                <Button size="sm" onClick={handleToggleMonthStatus} className={`rounded-xl font-bold ${selectedMonthDoc.status === "closed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                  {selectedMonthDoc.status === "closed" ? <><Unlock className="w-4 h-4 mr-2" /> Mở khóa</> : <><Lock className="w-4 h-4 mr-2" /> Chốt công</>}
                </Button>
                <Button size="sm" onClick={handleExportExcel} disabled={isExporting} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-70">
                  {isExporting ? <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Đang xuất...</> : <><FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel</>}
                </Button>
              </div>
            </div>

            <BoardTable isDataLoading={isDataLoading} filteredAttendances={filteredAttendances} editingRecords={editingRecords} selectedMonthDoc={selectedMonthDoc} daysArray={daysArray} setSearchQuery={setSearchQuery} setSelectedDept={setSelectedDept} handleSaveRow={handleSaveRow} toggleAttendance={toggleAttendance} handleAdvanceChange={handleAdvanceChange} handleKpiChange={handleKpiChange} />
            <OvertimeTable isDataLoading={isDataLoading} filteredAttendances={filteredAttendances} editingRecords={editingRecords} selectedMonthDoc={selectedMonthDoc} daysArray={daysArray} setSearchQuery={setSearchQuery} setSelectedDept={setSelectedDept} handleSaveRow={handleSaveRow} toggleOvertime={toggleOvertime} />
            <ShortfallTable isDataLoading={isDataLoading} filteredAttendances={filteredAttendances} editingRecords={editingRecords} selectedMonthDoc={selectedMonthDoc} daysArray={daysArray} setSearchQuery={setSearchQuery} setSelectedDept={setSelectedDept} handleSaveRow={handleSaveRow} handleShortfallDailyChange={handleShortfallDailyChange} />

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

      {/* STYLE BỔ SUNG: Ẩn thanh cuộn của sidebar nhưng vẫn cho scroll */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}