import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Save,
  PlayCircle,
  RefreshCcw,
  CalendarClock,
  CheckCircle2,
  Search,
  FileDown,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Briefcase,
  Filter,
  X,
  PlusCircle,
  ChevronDown,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Hash,
  Wallet,
  Trash2,
  Lock,
  Unlock,
  Clock,
  TimerOff
} from "lucide-react";
import * as XLSX from "xlsx";

// UI Components (Shadcn UI)
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

// ==========================================
// CONFIG & HELPERS
// ==========================================
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/attendance`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

const formatNumberWithDot = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const num = val.toString().replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getDayOfWeek = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  const daysName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return {
    name: daysName[dayIndex],
    isWeekend: dayIndex === 0 || dayIndex === 6,
    isSunday: dayIndex === 0,
  };
};

// Màu sắc cho biểu đồ
const CHART_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

export default function AttendanceBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonthDoc, setSelectedMonthDoc] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingRecords, setEditingRecords] = useState<{
    [recordId: string]: any;
  }>({});
  const [isExporting, setIsExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());

  // ==========================================
  // API CALLS
  // ==========================================
  const fetchMonthsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/months`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMonthsList(data);
        if (data.length > 0 && !selectedMonthDoc) setSelectedMonthDoc(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceData = async (month: number, year: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${month}&year=${year}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
        setEditingRecords({});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleInitializeMonth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          month: newMonth,
          year: newYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Khởi tạo thất bại");
        return;
      }

      alert(data.message || "Đã khởi tạo thành công");

      // Refresh the months list
      await fetchMonthsList();
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi khởi tạo kỳ công");
    }
  };

  useEffect(() => {
    fetchMonthsList();
  }, []);
  useEffect(() => {
    if (selectedMonthDoc)
      fetchAttendanceData(selectedMonthDoc.month, selectedMonthDoc.year);
  }, [selectedMonthDoc]);

  // ==========================================
  // DATA PROCESSING
  // ==========================================
  const uniqueDepartments = useMemo(() => {
    const depts = attendances
      .map((a) => a.employee?.workInfo?.department)
      .filter(Boolean);
    return ["ALL", ...Array.from(new Set(depts))].sort();
  }, [attendances]);

  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const nameMatch =
        att.employee?.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        att.employee?.employeeCode
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const deptMatch =
        selectedDept === "ALL" ||
        att.employee?.workInfo?.department === selectedDept;
      return nameMatch && deptMatch;
    });
  }, [attendances, searchQuery, selectedDept]);

  const stats = useMemo(() => {
    const totalPaidDays = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.summary?.totalPaidDays || 0),
      0,
    );
    const totalAdvance = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.advancePayment || 0),
      0,
    );
    const totalFullDays = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.summary?.totalFullDays || 0),
      0,
    );
    const totalHalfDays = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.summary?.totalHalfDays || 0),
      0,
    );
    const totalOT = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.summary?.totalOT || 0),
      0,
    );
    const totalShortfall = filteredAttendances.reduce(
      (acc, curr) => acc + (curr.summary?.totalShortfallHours || 0),
      0,
    );
    const avgDays =
      filteredAttendances.length > 0
        ? (totalPaidDays / filteredAttendances.length).toFixed(1)
        : "0";
    return {
      count: filteredAttendances.length,
      totalPaidDays,
      totalAdvance,
      totalFullDays,
      totalHalfDays,
      totalOT,
      totalShortfall,
      avgDays,
    };
  }, [filteredAttendances]);

  // Thống kê theo phòng ban
  const departmentStats = useMemo(() => {
    const deptMap: { [key: string]: any } = {};
    filteredAttendances.forEach((att) => {
      const dept = att.employee?.workInfo?.department || "Chưa xếp phòng";
      if (!deptMap[dept]) {
        deptMap[dept] = {
          name: dept,
          employees: 0,
          totalDays: 0,
          totalAdvance: 0,
          totalOT: 0,
          totalShortfall: 0,
        };
      }
      deptMap[dept].employees++;
      deptMap[dept].totalDays += att.summary?.totalPaidDays || 0;
      deptMap[dept].totalAdvance += att.advancePayment || 0;
      deptMap[dept].totalOT += att.summary?.totalOT || 0;
      deptMap[dept].totalShortfall += att.summary?.totalShortfallHours || 0;
    });
    return Object.values(deptMap).sort(
      (a: any, b: any) => b.totalDays - a.totalDays,
    );
  }, [filteredAttendances]);

  const chartData = useMemo(() => {
    return filteredAttendances
      .map((att) => ({
        name: att.employee?.fullName?.split(" ").pop() || "N/A",
        fullName: att.employee?.fullName,
        department: att.employee?.workInfo?.department,
        total: att.summary?.totalPaidDays || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredAttendances]);

  // ==========================================
  // ACTIONS
  // ==========================================

  // Toggle công hành chính (X -> 0.5 -> OFF -> rỗng)
  const toggleAttendance = useCallback(
    (recordId: string, day: string, currentVal: string) => {
      if (selectedMonthDoc?.status === "closed") return;
      const val = currentVal?.toString().toUpperCase() || "";
      let nextVal = "";
      if (val === "X") nextVal = "0.5";
      else if (val === "0.5" || val === "0,5") nextVal = "OFF";
      else if (val === "OFF") nextVal = "";
      else nextVal = "X";

      setEditingRecords((prev) => {
        const currentEdit = prev[recordId] || {
          ...attendances.find((a) => a._id === recordId),
        };
        if (!currentEdit.records) currentEdit.records = {};
        currentEdit.records[day] = nextVal;
        return { ...prev, [recordId]: currentEdit };
      });
    },
    [selectedMonthDoc, attendances],
  );

  // Toggle làm thêm giờ (X -> N -> T -> rỗng)
  const toggleOvertime = useCallback(
    (recordId: string, day: string, currentVal: string) => {
      if (selectedMonthDoc?.status === "closed") return;
      const val = currentVal?.toString().toUpperCase() || "";
      let nextVal = "";
      if (val === "X") nextVal = "N";
      else if (val === "N") nextVal = "T";
      else if (val === "T") nextVal = "";
      else nextVal = "X";

      setEditingRecords((prev) => {
        const currentEdit = prev[recordId] || {
          ...attendances.find((a) => a._id === recordId),
        };
        if (!currentEdit.overtimeRecords) currentEdit.overtimeRecords = {};
        currentEdit.overtimeRecords[day] = nextVal;
        return { ...prev, [recordId]: currentEdit };
      });
    },
    [selectedMonthDoc, attendances],
  );

  // Nhập giờ đi muộn (số dương) / về sớm (số âm)
const handleShortfallDailyChange = useCallback(
  (recordId: string, day: string, value: string) => {
    // Cho phép nhập số âm, số dương và số thập phân (VD: -2, -1.5, 2, 3.5)
    let numValue = value.replace(/[^0-9.\-]/g, "");
    
    // Đảm bảo chỉ có một dấu trừ ở đầu
    if (numValue.indexOf("-") > 0) {
      numValue = numValue.replace(/-/g, "");
    }
    
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] || {
        ...attendances.find((a) => a._id === recordId),
      };
      if (!currentEdit.shortfallRecords) currentEdit.shortfallRecords = {};
      currentEdit.shortfallRecords[day] = numValue;
      return { ...prev, [recordId]: currentEdit };
    });
  },
  [attendances],
);

  // Thay đổi tạm ứng
  const handleAdvanceChange = useCallback(
    (recordId: string, value: string) => {
      const numValue = value.replace(/\D/g, "");
      setEditingRecords((prev) => {
        const currentEdit = prev[recordId] || {
          ...attendances.find((a) => a._id === recordId),
        };
        currentEdit.advancePayment = Number(numValue);
        return { ...prev, [recordId]: currentEdit };
      });
    },
    [attendances],
  );

  // Lưu toàn bộ thay đổi của 1 nhân viên
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
        }),
      });
      if (res.ok) {
        await fetchAttendanceData(
          selectedMonthDoc.month,
          selectedMonthDoc.year,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonthDoc) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xoá toàn bộ dữ liệu chấm công tháng ${selectedMonthDoc.month}/${selectedMonthDoc.year}?`,
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}?month=${selectedMonthDoc.month}&year=${selectedMonthDoc.year}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Xóa thất bại");
        return;
      }

      alert(data.message || "Đã xoá thành công");

      setSelectedMonthDoc(null);

      await fetchMonthsList();
      setAttendances([]);
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi xoá kỳ công");
    }
  };

  const handleToggleMonthStatus = async () => {
    if (!selectedMonthDoc) return;

    const nextStatus = selectedMonthDoc.status === "closed" ? "open" : "closed";

    const confirmAction = window.confirm(
      nextStatus === "closed"
        ? `Bạn có chắc muốn CHỐT công tháng ${selectedMonthDoc.month}/${selectedMonthDoc.year}? Sau khi chốt sẽ không thể chỉnh sửa.`
        : `Bạn có muốn MỞ KHÓA tháng ${selectedMonthDoc.month}/${selectedMonthDoc.year}?`,
    );

    if (!confirmAction) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/months/${selectedMonthDoc._id}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Cập nhật trạng thái thất bại");
        return;
      }

      alert(data.message);

      await fetchMonthsList();

      setSelectedMonthDoc((prev: any) => ({
        ...prev,
        status: nextStatus,
      }));
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi cập nhật trạng thái");
    }
  };

  // ==========================================
  // EXCEL EXPORT (ĐÃ BAO GỒM OVERTIME & SHORTFALL)
  // ==========================================
  const handleExportExcel = async () => {
    if (!selectedMonthDoc || filteredAttendances.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const daysInMonth = new Date(
        selectedMonthDoc.year,
        selectedMonthDoc.month,
        0,
      ).getDate();
      const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      const wb = XLSX.utils.book_new();

      // ============ SHEET 1: BẢNG CHẤM CÔNG HÀNH CHÍNH ============
      const attendanceData = [];

      attendanceData.push([
        `BẢNG CHẤM CÔNG THÁNG ${selectedMonthDoc.month}/${selectedMonthDoc.year}`,
      ]);
      attendanceData.push([]);
      attendanceData.push([
        `Phòng ban: ${selectedDept === "ALL" ? "Tất cả" : selectedDept}`,
        ``,
        ``,
        ``,
        ``,
        `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
      ]);
      attendanceData.push([]);

      const header1 = [
        "STT",
        "Mã NV",
        "Họ và tên",
        "Phòng ban",
        "Tạm ứng",
      ];
      daysArray.forEach((d) => header1.push(`${d}`));
      header1.push("Công [X]", "Công [0.5]", "Tổng công");
      attendanceData.push(header1);

      const header2 = ["", "", "", "", ""];
      daysArray.forEach((d) => {
        const dayInfo = getDayOfWeek(
          selectedMonthDoc.year,
          selectedMonthDoc.month,
          d,
        );
        header2.push(dayInfo.name);
      });
      header2.push("", "", "");
      attendanceData.push(header2);

      filteredAttendances.forEach((att, idx) => {
        const rowData = editingRecords[att._id] || att;
        const row = [
          idx + 1,
          att.employee?.employeeCode || "",
          att.employee?.fullName || "",
          att.employee?.workInfo?.department || "",
          rowData.advancePayment || 0,
        ];

        daysArray.forEach((d) => {
          row.push(rowData.records?.[d] || "");
        });

        row.push(
          att.summary?.totalFullDays || 0,
          att.summary?.totalHalfDays || 0,
          att.summary?.totalPaidDays || 0,
        );

        attendanceData.push(row);
      });

      const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceData);

      // ============ SHEET 2: OVERTIME & SHORTFALL ============
      const otData = [];
      otData.push([
        `BẢNG LÀM THÊM GIỜ & ĐI MUỘN THÁNG ${selectedMonthDoc.month}/${selectedMonthDoc.year}`,
      ]);
      otData.push([]);
      otData.push([
        `Phòng ban: ${selectedDept === "ALL" ? "Tất cả" : selectedDept}`,
        ``,
        ``,
        `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
      ]);
      otData.push([]);

      const otHeader1 = ["STT", "Mã NV", "Họ và tên", "Phòng ban"];
      daysArray.forEach((d) => otHeader1.push(`${d}`));
      otHeader1.push("Thường [X]", "Nghỉ [N]", "Lễ [T]", "Tổng OT", "Tổng Giờ Thiếu");
      otData.push(otHeader1);

      const otHeader2 = ["", "", "", ""];
      daysArray.forEach((d) => {
        const dayInfo = getDayOfWeek(
          selectedMonthDoc.year,
          selectedMonthDoc.month,
          d,
        );
        otHeader2.push(dayInfo.name);
      });
      otHeader2.push("", "", "", "", "");
      otData.push(otHeader2);

      filteredAttendances.forEach((att, idx) => {
        const rowData = editingRecords[att._id] || att;
        const row = [
          idx + 1,
          att.employee?.employeeCode || "",
          att.employee?.fullName || "",
          att.employee?.workInfo?.department || "",
        ];

        daysArray.forEach((d) => {
          let cellVal = "";
          if (rowData.overtimeRecords?.[d])
            cellVal += rowData.overtimeRecords[d];
          if (rowData.shortfallRecords?.[d])
            cellVal +=
              (cellVal ? " / " : "") + "-" + rowData.shortfallRecords[d] + "h";
          row.push(cellVal);
        });

        row.push(
          att.summary?.totalOTNormal || 0,
          att.summary?.totalOTWeekend || 0,
          att.summary?.totalOTHoliday || 0,
          att.summary?.totalOT || 0,
          att.summary?.totalShortfallHours || 0,
        );
        otData.push(row);
      });

      const wsOvertime = XLSX.utils.aoa_to_sheet(otData);

      // Add sheets
      XLSX.utils.book_append_sheet(wb, wsAttendance, "Hành chính");
      XLSX.utils.book_append_sheet(wb, wsOvertime, "Làm thêm & Đi muộn");

      const fileName = `ChamCong_T${selectedMonthDoc.month}_${selectedMonthDoc.year}${selectedDept !== "ALL" ? "_" + selectedDept.replace(/\s/g, "_") : ""}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi khi xuất Excel. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  const daysArray = useMemo(
    () =>
      Array.from(
        {
          length: selectedMonthDoc
            ? new Date(
                selectedMonthDoc.year,
                selectedMonthDoc.month,
                0,
              ).getDate()
            : 31,
        },
        (_, i) => i + 1,
      ),
    [selectedMonthDoc],
  );

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* ========== SIDEBAR TRÁI ========== */}
      <div className="w-full xl:w-80 shrink-0 space-y-4">
        {/* Card khởi tạo tháng mới */}
        <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <PlusCircle className="w-4 h-4 text-blue-600" />
              </div>
              Khởi tạo kỳ công mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tháng
                </label>
                <select
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={newMonth}
                  onChange={(e) => setNewMonth(Number(e.target.value))}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Năm
                </label>
                <select
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={handleInitializeMonth}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PlayCircle className="w-4 h-4 mr-2" /> Khởi tạo bảng công
            </Button>
          </CardContent>
        </Card>

        {/* Danh sách kỳ công */}
        <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 flex flex-col h-[550px] overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              Danh sách kỳ công
            </h3>
            <Badge variant="outline" className="text-xs">
              {monthsList.length} kỳ
            </Badge>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
            {monthsList.map((m) => (
              <button
                key={m._id}
                onClick={() => setSelectedMonthDoc(m)}
                className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between transition-all duration-200 group ${
                  selectedMonthDoc?._id === m._id
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                    : "hover:bg-slate-100 text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                      selectedMonthDoc?._id === m._id
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {m.month}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {selectedMonthDoc?._id === m._id ? (
                        `Tháng ${m.month}/${m.year}`
                      ) : (
                        <>
                          Tháng {m.month}
                          <span className="text-slate-400 font-normal">
                            /{m.year}
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${selectedMonthDoc?._id === m._id ? "text-blue-100" : "text-slate-400"}`}
                    >
                      <Users className="inline w-3 h-3 mr-1" />{" "}
                      {m.totalEmployees || 0} nhân sự
                    </div>
                  </div>
                </div>
                {m.status === "closed" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CheckCircle2
                          className={`w-5 h-5 ${selectedMonthDoc?._id === m._id ? "text-white" : "text-emerald-500"}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>Đã chốt công</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${selectedMonthDoc?._id === m._id ? "bg-white animate-pulse" : "bg-amber-400 shadow-sm shadow-amber-200"}`}
                  />
                )}
              </button>
            ))}
            {monthsList.length === 0 && (
              <div className="text-center p-8 text-slate-400">
                <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 min-w-0 space-y-4">
        {selectedMonthDoc ? (
          <Tabs defaultValue="board">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-800">
                    Kỳ Chấm Công {selectedMonthDoc.month}/
                    {selectedMonthDoc.year}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        selectedMonthDoc.status === "closed"
                          ? "secondary"
                          : "default"
                      }
                      className={`text-xs font-semibold ${selectedMonthDoc.status === "closed" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-800 animate-pulse"}`}
                    >
                      {selectedMonthDoc.status === "closed"
                        ? "Đã khóa"
                        : "Đang mở"}
                    </Badge>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500">
                      {daysArray.length} ngày làm việc
                    </span>
                  </div>
                </div>
              </div>
              <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <TabsTrigger
                  value="board"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2 transition-all"
                >
                  <CalendarDays className="w-4 h-4 mr-2" /> Hành Chính
                </TabsTrigger>
                <TabsTrigger
                  value="overtime"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2 transition-all"
                >
                  <Clock className="w-4 h-4 mr-2" /> Làm Thêm Ngày
                </TabsTrigger>
                <TabsTrigger
                  value="shortfall"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2 transition-all"
                >
                  <TimerOff className="w-4 h-4 mr-2" /> Đi Muộn/Về Sớm
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold text-sm px-4 py-2 transition-all"
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Thống Kê
                </TabsTrigger>
              </TabsList>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[180px]"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d === "ALL" ? "🏢 Tất cả phòng ban" : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm tên hoặc mã NV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 font-medium px-3 py-2"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />{" "}
                {filteredAttendances.length} nhân sự
              </Badge>

              <div className="flex gap-2 ml-auto">
                <Button                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchAttendanceData(
                      selectedMonthDoc.month,
                      selectedMonthDoc.year,
                    )
                  }
                  className="border-slate-200 hover:bg-slate-50 font-medium rounded-xl"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" /> Làm mới
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteMonth}
                  disabled={selectedMonthDoc?.status === "closed"}
                  className="rounded-xl shadow-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa kỳ công
                </Button>
                <Button
                  size="sm"
                  onClick={handleToggleMonthStatus}
                  className={`rounded-xl shadow-sm font-bold ${
                    selectedMonthDoc.status === "closed"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {selectedMonthDoc.status === "closed" ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Mở khóa
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Chốt công
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                >
                  {isExporting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Đang
                      xuất...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* TAB: BẢNG CÔNG HÀNH CHÍNH */}
            <TabsContent value="board" className="mt-4 animate-in fade-in-50">
              {isDataLoading ? (
                <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center">
                  <Loader />
                </div>
              ) : filteredAttendances.length === 0 ? (
                <NoDataFound
                  title="Không tìm thấy nhân sự"
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  buttonText="Xóa bộ lọc"
                  buttonAction={() => {
                    setSearchQuery("");
                    setSelectedDept("ALL");
                  }}
                />
              ) : (
                <Card className="border-slate-200/80 shadow-md overflow-hidden rounded-2xl">
                  <div
                    className="overflow-x-auto custom-scrollbar"
                    style={{ maxHeight: "calc(100vh - 280px)" }}
                  >
                    <div className="overflow-y-auto">
                      <table className="w-full text-xs border-collapse min-w-[1500px]">
                        <thead className="sticky top-0 z-30">
                          <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                            <th
                              rowSpan={2}
                              className="p-3 sticky left-0 bg-slate-900 z-40 min-w-[190px] border-r border-slate-700 text-left font-bold text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                Nhân sự
                              </div>
                            </th>
                            <th
                              rowSpan={2}
                              className="p-3 border-r border-slate-700 min-w-[130px] text-left font-bold text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-amber-400" />
                                Phòng ban
                              </div>
                            </th>
                            <th
                              rowSpan={2}
                              className="p-3 border-r border-slate-700 min-w-[120px] text-right font-bold text-sm text-emerald-300"
                            >
                              <div className="flex items-center justify-end gap-2">
                                <Wallet className="w-4 h-4" />
                                Tạm ứng
                              </div>
                            </th>
                            {daysArray.map((d) => {
                              const dayInfo = getDayOfWeek(
                                selectedMonthDoc.year,
                                selectedMonthDoc.month,
                                d,
                              );
                              return (
                                <th
                                  key={d}
                                  className={`p-1.5 text-center min-w-[38px] border-r border-slate-700 font-bold text-[11px] ${
                                    dayInfo.isSunday
                                      ? "bg-red-800/80 text-red-200"
                                      : dayInfo.isWeekend
                                        ? "bg-slate-700/80 text-slate-300"
                                        : ""
                                  }`}
                                >
                                  {d}
                                </th>
                              );
                            })}
                            <th
                              colSpan={3}
                              className="p-2 bg-slate-800 text-center border-b border-slate-600 font-bold text-[10px] uppercase tracking-wider text-slate-300"
                            >
                              Tổng hợp
                            </th>
                            <th
                              rowSpan={2}
                              className="p-2 bg-blue-800/80 sticky right-0 z-40 min-w-[80px] font-bold text-sm text-center"
                            >
                              Thao tác
                            </th>
                          </tr>
                          <tr className="bg-slate-800/90">
                            {daysArray.map((d) => {
                              const dayInfo = getDayOfWeek(
                                selectedMonthDoc.year,
                                selectedMonthDoc.month,
                                d,
                              );
                              return (
                                <th
                                  key={`sub-${d}`}
                                  className={`p-1 text-center text-[9px] border-r border-slate-700 font-medium ${
                                    dayInfo.isSunday
                                      ? "text-red-300 bg-red-900/30"
                                      : dayInfo.isWeekend
                                        ? "text-slate-400 bg-slate-700/30"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {dayInfo.name}
                                </th>
                              );
                            })}
                            <th className="p-1.5 border-r border-slate-600 text-center text-[10px] font-bold text-blue-300 bg-slate-800">
                              [X]
                            </th>
                            <th className="p-1.5 border-r border-slate-600 text-center text-[10px] font-bold text-amber-300 bg-slate-800">
                              [0.5]
                            </th>
                            <th className="p-1.5 text-center text-[10px] font-black text-white bg-amber-600/80">
                              CÔNG
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {filteredAttendances.map((att, idx) => {
                            const rowData = editingRecords[att._id] || att;
                            const isEditing = !!editingRecords[att._id];
                            const isClosed =
                              selectedMonthDoc.status === "closed";

                            return (
                              <tr
                                key={att._id}
                                className={`group transition-all duration-200 ${
                                  idx % 2 === 0
                                    ? "bg-white hover:bg-blue-50/50"
                                    : "bg-slate-50/80 hover:bg-blue-50/50"
                                }`}
                              >
                                <td className="p-2.5 px-3 border-r border-slate-100 sticky left-0 bg-inherit z-20">
                                  <div className="font-bold text-slate-800 text-sm">
                                    {att.employee?.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    <Hash className="inline w-3 h-3 mr-0.5" />
                                    {att.employee?.employeeCode}
                                  </div>
                                </td>
                                <td className="p-2.5 px-3 border-r border-slate-100">
                                  <Badge
                                    variant="outline"
                                    className="font-normal text-[11px] bg-slate-50 border-slate-200"
                                  >
                                    {att.employee?.workInfo?.department ||
                                      "N/A"}
                                  </Badge>
                                </td>
                                <td className="p-1.5 border-r border-slate-100">
                                  <div
                                    className={`relative rounded-lg overflow-hidden ${isClosed ? "bg-slate-50" : "bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"}`}
                                  >
                                    <input
                                      type="text"
                                      disabled={isClosed}
                                      className="w-full text-right font-bold text-emerald-700 bg-transparent outline-none p-2 text-sm placeholder-slate-300"
                                      value={formatNumberWithDot(
                                        rowData.advancePayment,
                                      )}
                                      onChange={(e) =>
                                        handleAdvanceChange(
                                          att._id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0"
                                    />
                                  </div>
                                </td>
                                {daysArray.map((d) => {
                                  const val = rowData.records?.[d] || "";
                                  const dayInfo = getDayOfWeek(
                                    selectedMonthDoc.year,
                                    selectedMonthDoc.month,
                                    d,
                                  );

                                  let cellStyle = "";
                                  let bgStyle = "";
                                  if (val === "X") {
                                    cellStyle = "text-blue-700 font-black";
                                    bgStyle = "bg-blue-50 hover:bg-blue-100";
                                  } else if (val === "0.5") {
                                    cellStyle = "text-amber-600 font-black";
                                    bgStyle = "bg-amber-50 hover:bg-amber-100";
                                  } else if (val === "OFF") {
                                    cellStyle = "text-red-500 font-bold";
                                    bgStyle = "bg-red-50 hover:bg-red-100";
                                  } else {
                                    bgStyle = "hover:bg-slate-50";
                                  }

                                  if (dayInfo.isSunday)
                                    bgStyle += " bg-red-50/20";

                                  return (
                                    <td
                                      key={d}
                                      className={`p-0 border-r border-slate-100 text-center transition-colors ${dayInfo.isSunday ? "bg-red-50/10" : ""}`}
                                    >
                                      <button
                                        disabled={isClosed}
                                        onClick={() =>
                                          toggleAttendance(
                                            att._id,
                                            d.toString(),
                                            val,
                                          )
                                        }
                                        title={`Click để đổi: X → 0.5 → OFF → Trống`}
                                        className={`w-full h-10 flex items-center justify-center text-[12px] uppercase transition-all duration-150 rounded-sm ${cellStyle} ${bgStyle} ${
                                          isClosed
                                            ? "cursor-not-allowed opacity-60"
                                            : "cursor-pointer hover:scale-110 hover:shadow-sm"
                                        }`}
                                      >
                                        {val || (
                                          <span className="text-slate-200 text-[10px]">
                                            ·
                                          </span>
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                                <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-700 bg-blue-50/30 text-sm">
                                  {att.summary?.totalFullDays || 0}
                                </td>
                                <td className="p-2 border-r border-slate-100 text-center font-bold text-amber-600 bg-amber-50/30 text-sm">
                                  {att.summary?.totalHalfDays || 0}
                                </td>
                                <td className="p-2 border-r border-slate-100 text-center font-black text-amber-700 bg-amber-50/50 text-sm">
                                  {att.summary?.totalPaidDays || 0}
                                </td>
                                <td className="p-1.5 sticky right-0 bg-inherit z-20">
                                  {isEditing && !isClosed ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveRow(att._id)}
                                      className="w-full h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 animate-pulse rounded-lg font-bold shadow-sm"
                                    >
                                      <Save className="w-3.5 h-3.5 mr-1" /> LƯU
                                    </Button>
                                  ) : (
                                    <div className="text-center text-[10px] text-slate-300 font-medium">
                                      {isClosed ? (
                                        <CheckCircle2 className="w-4 h-4 mx-auto text-slate-300" />
                                      ) : (
                                        "Sync"
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* TAB: LÀM THÊM GIỜ */}
            <TabsContent value="overtime" className="mt-4 animate-in fade-in-50">
              {isDataLoading ? (
                <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center">
                  <Loader />
                </div>
              ) : filteredAttendances.length === 0 ? (
                <NoDataFound
                  title="Không tìm thấy nhân sự"
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  buttonText="Xóa bộ lọc"
                  buttonAction={() => {
                    setSearchQuery("");
                    setSelectedDept("ALL");
                  }}
                />
              ) : (
                <Card className="border-slate-200/80 shadow-md overflow-hidden rounded-2xl">
                  <div
                    className="overflow-x-auto custom-scrollbar"
                    style={{ maxHeight: "calc(100vh - 280px)" }}
                  >
                    <table className="w-full text-xs border-collapse min-w-[1500px]">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-to-r from-teal-800 to-teal-900 text-white">
                          <th
                            rowSpan={2}
                            className="p-3 sticky left-0 bg-teal-900 z-40 min-w-[190px] border-r border-teal-700 text-left font-bold text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-teal-300" />
                              Nhân sự
                            </div>
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 border-r border-teal-700 min-w-[130px] text-left font-bold text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-teal-300" />
                              Phòng ban
                            </div>
                          </th>
                          {daysArray.map((d) => {
                            const dayInfo = getDayOfWeek(
                              selectedMonthDoc.year,
                              selectedMonthDoc.month,
                              d,
                            );
                            return (
                              <th
                                key={d}
                                className={`p-1.5 text-center min-w-[38px] border-r border-teal-700 font-bold text-[11px] ${
                                  dayInfo.isSunday
                                    ? "bg-red-800/80 text-red-200"
                                    : dayInfo.isWeekend
                                      ? "bg-teal-700/80 text-teal-200"
                                      : ""
                                }`}
                              >
                                {d}
                              </th>
                            );
                          })}
                          <th
                            colSpan={4}
                            className="p-2 bg-teal-800 text-center border-b border-teal-600 font-bold text-[10px] uppercase tracking-wider text-teal-200"
                          >
                            Tổng OT
                          </th>
                          <th
                            rowSpan={2}
                            className="p-2 bg-teal-800 sticky right-0 z-40 min-w-[80px] font-bold text-sm text-center"
                          >
                            Thao tác
                          </th>
                        </tr>
                        <tr className="bg-teal-800/90">
                          {daysArray.map((d) => {
                            const dayInfo = getDayOfWeek(
                              selectedMonthDoc.year,
                              selectedMonthDoc.month,
                              d,
                            );
                            return (
                              <th
                                key={`sub-ot-${d}`}
                                className={`p-1 text-center text-[9px] border-r border-teal-700 font-medium ${
                                  dayInfo.isSunday
                                    ? "text-red-300 bg-red-900/30"
                                    : dayInfo.isWeekend
                                      ? "text-teal-300 bg-teal-800/50"
                                      : "text-teal-300"
                                }`}
                              >
                                {dayInfo.name}
                              </th>
                            );
                          })}
                          <th className="p-1.5 border-r border-teal-600 text-center text-[10px] font-bold text-blue-300 bg-teal-800">
                            [X]
                          </th>
                          <th className="p-1.5 border-r border-teal-600 text-center text-[10px] font-bold text-amber-300 bg-teal-800">
                            [N]
                          </th>
                          <th className="p-1.5 border-r border-teal-600 text-center text-[10px] font-bold text-purple-300 bg-teal-800">
                            [T]
                          </th>
                          <th className="p-1.5 text-center text-[10px] font-black text-white bg-emerald-600/80">
                            TỔNG
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredAttendances.map((att, idx) => {
                          const rowData = editingRecords[att._id] || att;
                          const isEditing = !!editingRecords[att._id];
                          const isClosed = selectedMonthDoc.status === "closed";

                          return (
                            <tr
                              key={`ot-${att._id}`}
                              className={`group transition-all duration-200 ${
                                idx % 2 === 0
                                  ? "bg-white hover:bg-teal-50/30"
                                  : "bg-slate-50/80 hover:bg-teal-50/30"
                              }`}
                            >
                              <td className="p-2.5 px-3 border-r border-slate-100 sticky left-0 bg-inherit z-20">
                                <div className="font-bold text-slate-800 text-sm">
                                  {att.employee?.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  <Hash className="inline w-3 h-3 mr-0.5" />
                                  {att.employee?.employeeCode}
                                </div>
                              </td>
                              <td className="p-2.5 px-3 border-r border-slate-100">
                                <Badge
                                  variant="outline"
                                  className="font-normal text-[11px] bg-slate-50 border-slate-200"
                                >
                                  {att.employee?.workInfo?.department || "N/A"}
                                </Badge>
                              </td>
                              {daysArray.map((d) => {
                                const val =
                                  rowData.overtimeRecords?.[d] || "";
                                const dayInfo = getDayOfWeek(
                                  selectedMonthDoc.year,
                                  selectedMonthDoc.month,
                                  d,
                                );

                                let cellStyle = "";
                                let bgStyle = "";
                                if (val === "X") {
                                  cellStyle = "text-blue-700 font-black";
                                  bgStyle = "bg-blue-50 hover:bg-blue-100";
                                } else if (val === "N") {
                                  cellStyle = "text-amber-600 font-black";
                                  bgStyle =
                                    "bg-amber-50 hover:bg-amber-100";
                                } else if (val === "T") {
                                  cellStyle = "text-purple-600 font-black";
                                  bgStyle =
                                    "bg-purple-50 hover:bg-purple-100";
                                } else {
                                  bgStyle = "hover:bg-slate-50";
                                }

                                if (dayInfo.isSunday)
                                  bgStyle += " bg-red-50/20";

                                return (
                                  <td
                                    key={d}
                                    className={`p-0 border-r border-slate-100 text-center transition-colors ${dayInfo.isSunday ? "bg-red-50/10" : ""}`}
                                  >
                                    <button
                                      disabled={isClosed}
                                      onClick={() =>
                                        toggleOvertime(
                                          att._id,
                                          d.toString(),
                                          val,
                                        )
                                      }
                                      title={`Click để đổi: X → N → T → Trống`}
                                      className={`w-full h-10 flex items-center justify-center text-[12px] uppercase transition-all duration-150 rounded-sm ${cellStyle} ${bgStyle} ${
                                        isClosed
                                          ? "cursor-not-allowed opacity-60"
                                          : "cursor-pointer hover:scale-110 hover:shadow-sm"
                                      }`}
                                    >
                                      {val || (
                                        <span className="text-slate-200 text-[10px]">
                                          ·
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-700 text-sm">
                                {att.summary?.totalOTNormal || 0}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-center font-bold text-amber-600 text-sm">
                                {att.summary?.totalOTWeekend || 0}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-center font-bold text-purple-700 text-sm">
                                {att.summary?.totalOTHoliday || 0}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-center font-black text-emerald-700 bg-emerald-50/50 text-sm">
                                {att.summary?.totalOT || 0}
                              </td>
                              <td className="p-1.5 sticky right-0 bg-inherit z-20">
                                {isEditing && !isClosed ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveRow(att._id)}
                                    className="w-full h-8 text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 animate-pulse rounded-lg font-bold shadow-sm"
                                  >
                                    <Save className="w-3.5 h-3.5 mr-1" /> LƯU
                                  </Button>
                                ) : (
                                  <div className="text-center text-[10px] text-slate-300 font-medium">
                                    {isClosed ? (
                                      <CheckCircle2 className="w-4 h-4 mx-auto text-slate-300" />
                                    ) : (
                                      "Sync"
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* TAB: ĐI MUỘN VỀ SỚM (NHẬP SỐ GIỜ) */}
            <TabsContent value="shortfall" className="mt-4 animate-in fade-in-50">
              {isDataLoading ? (
                <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center">
                  <Loader />
                </div>
              ) : filteredAttendances.length === 0 ? (
                <NoDataFound
                  title="Không tìm thấy nhân sự"
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  buttonText="Xóa bộ lọc"
                  buttonAction={() => {
                    setSearchQuery("");
                    setSelectedDept("ALL");
                  }}
                />
              ) : (
                <Card className="border-slate-200/80 shadow-md overflow-hidden rounded-2xl">
                  <div
                    className="overflow-x-auto custom-scrollbar"
                    style={{ maxHeight: "calc(100vh - 280px)" }}
                  >
                    <table className="w-full text-xs border-collapse min-w-[1500px]">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-to-r from-rose-900 to-rose-950 text-white">
                          <th
                            rowSpan={2}
                            className="p-3 sticky left-0 bg-rose-950 z-40 min-w-[190px] border-r border-rose-800 text-left font-bold text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-rose-300" />
                              Nhân sự
                            </div>
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 border-r border-rose-800 min-w-[130px] text-left font-bold text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-rose-300" />
                              Phòng ban
                            </div>
                          </th>
                          {daysArray.map((d) => {
                            const dayInfo = getDayOfWeek(
                              selectedMonthDoc.year,
                              selectedMonthDoc.month,
                              d,
                            );
                            return (
                              <th
                                key={d}
                                className={`p-1.5 text-center min-w-[40px] border-r border-rose-800 font-bold text-[11px] ${
                                  dayInfo.isSunday
                                    ? "bg-red-800/80 text-red-200"
                                    : dayInfo.isWeekend
                                      ? "bg-rose-800/80 text-rose-200"
                                      : ""
                                }`}
                              >
                                {d}
                              </th>
                            );
                          })}
                          <th
                            rowSpan={2}
                            className="p-2 bg-rose-800 border-l border-rose-700 text-center font-bold text-sm"
                          >
                            Tổng Giờ Làm Thêm
                          </th>
                          <th
                            rowSpan={2}
                            className="p-2 bg-rose-800 sticky right-0 z-40 min-w-[80px] font-bold text-sm text-center"
                          >
                            Thao tác
                          </th>
                        </tr>
                        <tr className="bg-rose-900/90">
                          {daysArray.map((d) => {
                            const dayInfo = getDayOfWeek(
                              selectedMonthDoc.year,
                              selectedMonthDoc.month,
                              d,
                            );
                            return (
                              <th
                                key={`sub-sf-${d}`}
                                className={`p-1 text-center text-[9px] border-r border-rose-800 font-medium ${
                                  dayInfo.isSunday
                                    ? "text-red-300 bg-red-900/30"
                                    : dayInfo.isWeekend
                                      ? "text-rose-300 bg-rose-800/50"
                                      : "text-rose-300"
                                }`}
                              >
                                {dayInfo.name}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredAttendances.map((att, idx) => {
                          const rowData = editingRecords[att._id] || att;
                          const isEditing = !!editingRecords[att._id];
                          const isClosed = selectedMonthDoc.status === "closed";

                          return (
                            <tr
                              key={`sf-${att._id}`}
                              className={`group transition-all duration-200 ${
                                idx % 2 === 0
                                  ? "bg-white hover:bg-rose-50/30"
                                  : "bg-slate-50/80 hover:bg-rose-50/30"
                              }`}
                            >
                              <td className="p-2.5 px-3 border-r border-slate-100 sticky left-0 bg-inherit z-20">
                                <div className="font-bold text-slate-800 text-sm">
                                  {att.employee?.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  <Hash className="inline w-3 h-3 mr-0.5" />
                                  {att.employee?.employeeCode}
                                </div>
                              </td>
                              <td className="p-2.5 px-3 border-r border-slate-100">
                                <Badge
                                  variant="outline"
                                  className="font-normal text-[11px] bg-slate-50 border-slate-200"
                                >
                                  {att.employee?.workInfo?.department || "N/A"}
                                </Badge>
                              </td>
                              {daysArray.map((d) => {
                                const dayInfo = getDayOfWeek(
                                  selectedMonthDoc.year,
                                  selectedMonthDoc.month,
                                  d,
                                );
                                return (
                                  <td
                                    key={d}
                                    className={`p-0 border-r border-slate-100 text-center ${dayInfo.isSunday ? "bg-red-50/10" : "bg-white"}`}
                                  >
                                    <input
                                      type="text"
                                      disabled={isClosed}
                                      className="w-full h-10 text-center font-bold text-rose-600 bg-transparent outline-none p-1 placeholder-slate-200 focus:bg-rose-50 transition-colors"
                                      value={
                                        rowData.shortfallRecords?.[d] || ""
                                      }
                                      onChange={(e) =>
                                        handleShortfallDailyChange(
                                          att._id,
                                          d.toString(),
                                          e.target.value,
                                        )
                                      }
                                      placeholder="-"
                                    />
                                  </td>
                                );
                              })}
                              <td className="p-2 border-l border-r border-slate-100 text-center font-black text-rose-700 bg-rose-50/50 text-sm">
                                {att.summary?.totalShortfallHours || 0}
                              </td>
                              <td className="p-1.5 sticky right-0 bg-inherit z-20">
                                {isEditing && !isClosed ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveRow(att._id)}
                                    className="w-full h-8 text-xs bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 animate-pulse rounded-lg font-bold shadow-sm"
                                  >
                                    <Save className="w-3.5 h-3.5 mr-1" /> LƯU
                                  </Button>
                                ) : (
                                  <div className="text-center text-[10px] text-slate-300 font-medium">
                                    {isClosed ? (
                                      <CheckCircle2 className="w-4 h-4 mx-auto text-slate-300" />
                                    ) : (
                                      "Sync"
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* TAB: THỐNG KÊ */}
            <TabsContent
              value="stats"
              className="space-y-5 mt-4 animate-in slide-in-from-bottom-2"
            >
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Nhân sự
                      </p>
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800">
                      {stats.count}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Nhân sự đã lọc
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Tổng công
                      </p>
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-amber-600">
                      {stats.totalPaidDays}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      TB: {stats.avgDays} công/người
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Làm thêm giờ (OT)
                      </p>
                      <div className="p-2 bg-teal-100 rounded-xl">
                        <Clock className="w-4 h-4 text-teal-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-teal-600">
                      {stats.totalOT}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Tổng số công OT</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Đi Muộn / Về sớm
                      </p>
                      <div className="p-2 bg-rose-100 rounded-xl">
                        <TimerOff className="w-4 h-4 text-rose-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-rose-600">
                      {stats.totalShortfall}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Tổng số giờ thiếu</p>
                  </CardContent>
                </Card>
              </div>

              {/* Biểu đồ */}
              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-md rounded-xl overflow-hidden border-slate-200/80">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Top 15 nhân sự theo ngày công
                        </CardTitle>
                        <CardDescription>
                          Đã lọc theo phòng ban:{" "}
                          {selectedDept === "ALL" ? "Tất cả" : selectedDept}
                        </CardDescription>
                      </div>
                      {selectedDept !== "ALL" && (
                        <Badge className="bg-blue-100 text-blue-700 shadow-none font-medium">
                          {selectedDept}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#64748b",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: "#f8fafc" }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                              fontWeight: 600,
                            }}
                            formatter={(value: any) => [
                              `${value} ngày`,
                              "Tổng công",
                            ]}
                            labelFormatter={(label: any) => `Nhân sự: ${label}`}
                          />
                          <Bar
                            dataKey="total"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={50}
                            animationDuration={1200}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                fillOpacity={0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Thống kê phòng ban */}
                <Card className="shadow-md rounded-xl overflow-hidden border-slate-200/80">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-emerald-50/50 px-5 py-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Theo phòng ban
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-3 text-left">Phòng ban</th>
                            <th className="p-3 text-center">NV</th>
                            <th className="p-3 text-center">Công</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {departmentStats.map((dept: any, idx: number) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3 font-medium text-slate-700">
                                {dept.name}
                              </td>
                              <td className="p-3 text-center">
                                <Badge
                                  variant="secondary"
                                  className="font-bold"
                                >
                                  {dept.employees}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-bold text-blue-600">
                                  {dept.totalDays}
                                </span>
                                <span className="text-slate-400 ml-1 text-[10px]">
                                  ngày
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-[700px] flex flex-col items-center justify-center text-slate-300 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center mb-6">
              <CalendarClock className="w-16 h-16 text-blue-300" />
            </div>
            <p className="font-bold text-xl text-slate-400 mb-2">
              Chưa chọn kỳ công
            </p>
            <p className="text-slate-300 text-sm">
              Vui lòng chọn hoặc tạo mới một kỳ chấm công ở sidebar
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}