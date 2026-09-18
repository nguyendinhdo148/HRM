/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator, Save, PlayCircle, RefreshCcw, CheckCircle2, Search, FileDown, 
  Wallet, Filter, Trash2, Lock, Unlock, Loader2, Settings,
  ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import * as XLSX from "xlsx";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/payroll`;

const MAX_MEAL_ALLOWANCE = 1800000;
const DEFAULT_INSURANCE_ADVANCE = 500000;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatCurrency = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
const formatNumberWithDot = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "0";
  return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const clampMeal = (val: number) => Math.min(Number(val) || 0, MAX_MEAL_ALLOWANCE);

// ===== INPUT TIỆN DỤNG: clear "0" khi focus =====
const NumberInput = ({ value, onChange, disabled, className }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const displayValue = isFocused && (value === 0 || value === "0") 
    ? "" 
    : formatNumberWithDot(value);
  
  return (
    <Input 
      className={className}
      value={displayValue}
      onChange={onChange}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

// ==========================================
// BẢNG LƯƠNG GROSS
// ==========================================
const TabGrossPayrollTable = ({ filteredPayrolls, editingRecords, isClosed, handleInputChange, handleSaveRow, savingIds }: any) => {
  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden animate-in fade-in-50">
      <div className="overflow-auto max-h-[calc(100vh-190px)] pb-4 custom-scrollbar relative">
        <table className="w-full text-[11px] border-collapse min-w-[1900px] bg-white">
          <thead className="bg-[#003366] text-white">
            <tr className="h-[48px]">
              <th rowSpan={2} className="p-2 sticky left-0 top-0 bg-[#003366] z-[60] w-[45px] min-w-[45px] max-w-[45px] border-r border-b border-slate-600 text-center">STT</th>
              <th rowSpan={2} className="p-2 sticky left-[45px] top-0 bg-[#003366] z-[60] w-[160px] min-w-[160px] max-w-[160px] border-r border-b border-slate-600 text-left shadow-[4px_0_10px_rgba(0,0,0,0.3)]">Họ và tên</th>
              
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Chức vụ</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Bộ phận</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Lương CV</th>
              <th colSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1e40af] text-center sticky top-0 z-[50]">Lương Thời Gian</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1d4ed8] text-center max-w-[100px] sticky top-0 z-[50]">Làm Thêm Giờ</th>
              <th colSpan={3} className="p-2 border-r border-b border-slate-600 bg-[#6b21a8] text-center sticky top-0 z-[50]">Hiệu Suất (Show &amp; Công)</th>
              <th colSpan={4} className="p-2 border-r border-b border-slate-600 bg-[#0f766e] text-center sticky top-0 z-[50]">Các Khoản Phụ Cấp</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#831843] text-center min-w-[100px] sticky top-0 z-[50]">Thưởng Mới</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#7c2d12] text-center min-w-[110px] sticky top-0 z-[50]">Tạm ứng BHXH</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#991b1b] text-center min-w-[100px] sticky top-0 z-[50]">Phạt</th>
              
              <th rowSpan={2} className="p-2 bg-[#064e3b] text-emerald-300 font-black text-xs w-[120px] min-w-[120px] max-w-[120px] text-center sticky right-[55px] top-0 z-[60] shadow-[-4px_0_10px_rgba(0,0,0,0.3)] border-l border-b border-slate-600">TỔNG GROSS</th>
              <th rowSpan={2} className="p-2 bg-[#003366] text-center w-[55px] min-w-[55px] max-w-[55px] sticky right-0 top-0 z-[60] border-l border-b border-slate-600">Lưu</th>
            </tr>
            <tr className="h-[36px] bg-[#1e293b] text-[10px] text-center text-slate-300">
              <th className="p-1 border-r border-b border-slate-600 text-white sticky top-[48px] bg-[#1e293b] z-[50]">Ngày công</th>
              <th className="p-1 border-r border-b border-slate-600 text-blue-300 sticky top-[48px] bg-[#1e293b] z-[50]">Số tiền</th>
              <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[48px] bg-[#1e293b] z-[50]">Mini Show</th>
              <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[48px] bg-[#1e293b] z-[50]">Big Show</th>
              <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[48px] bg-[#1e293b] z-[50]">Thưởng N.Công</th>
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Tiền ăn ca</th>
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Nhà ở</th>
              <th className="p-1 border-r border-b border-slate-600 text-indigo-300 sticky top-[48px] bg-[#1e293b] z-[50]">Ca tập</th>
              <th className="p-1 border-r border-b border-slate-600 text-emerald-200 font-bold bg-[#047857] sticky top-[48px] z-[50]">Tổng PC</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredPayrolls.map((p: any, idx: number) => {
              const edit = editingRecords[p._id] || p;
              const snap = p.employeeSnapshot;
              const allowances = p.incomes?.allowances || {};
              const mealDisplay = clampMeal(allowances.meal);
              const housingDisplay = allowances.housingAllowance || 0;
              const trainingDisplay = allowances.trainingAllowance || 0;
              const totalAllw = mealDisplay + housingDisplay + trainingDisplay;
              const insuranceAdvance = edit?.incomes?.insuranceAdvance ?? DEFAULT_INSURANCE_ADVANCE;
              const penalty = edit?.incomes?.penalty ?? 0;
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]";
              const isSaving = savingIds?.[p._id];
              
              return (
                <tr key={p._id} className={`${rowBg} hover:bg-blue-50 transition-colors`}>
                  <td className={`p-2 border-r border-b border-slate-200 sticky left-0 z-[40] ${rowBg} font-medium text-center`}>{idx + 1}</td>
                  <td className={`p-2 px-3 border-r border-b border-slate-200 sticky left-[45px] z-[40] ${rowBg} font-bold text-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.06)]`}>
                    <div className="truncate w-[140px]" title={snap?.fullName}>{snap?.fullName}</div>
                    <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate w-[140px]">{snap?.employeeCode}</div>
                  </td>
                  
                  <td className="p-2 border-r border-b border-slate-200 text-slate-600">{snap?.position}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-slate-600">{snap?.department}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-medium text-slate-700">{formatNumberWithDot(p.baseSalary)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-center font-bold text-blue-700 bg-blue-50/30">{p.actualDays}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-blue-800 bg-blue-50/30">{formatNumberWithDot(p.incomes?.timeSalary)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-indigo-700 bg-indigo-50/30">{formatNumberWithDot(p.incomes?.overtime)}</td>
                  
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-purple-700 bg-purple-50/20">{formatNumberWithDot(p.incomes?.miniShowMoney)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-purple-700 bg-purple-50/20">{formatNumberWithDot(p.incomes?.bigShowMoney)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-purple-800 bg-purple-100/30">{formatNumberWithDot(p.incomes?.kpiBonus)}</td>

                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(mealDisplay)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(housingDisplay)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-indigo-600 bg-indigo-50/30">{formatNumberWithDot(trainingDisplay)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/50">{formatNumberWithDot(totalAllw)}</td>

                  <td className="p-1 border-r border-b border-slate-200 text-center bg-rose-50/30">
                    <NumberInput 
                      className="h-7 w-full text-right text-[11px] font-bold text-rose-700 px-2"
                      value={edit?.incomes?.bonus ?? 0}
                      onChange={(e: any) => handleInputChange(p._id, "bonus", e.target.value)}
                      disabled={isClosed || isSaving}
                    />
                  </td>

                  {/* TẠM ỨNG BHXH */}
                  <td className="p-1 border-r border-b border-slate-200 text-center bg-orange-50/40">
                    <NumberInput 
                      className="h-7 w-full text-right text-[11px] font-bold text-orange-700 px-2"
                      value={insuranceAdvance}
                      onChange={(e: any) => handleInputChange(p._id, "insuranceAdvance", e.target.value)}
                      disabled={isClosed || isSaving}
                    />
                  </td>

                  {/* CỘT PHẠT */}
                  <td className="p-1 border-r border-b border-slate-200 text-center bg-red-50/50">
                    <NumberInput 
                      className="h-7 w-full text-right text-[11px] font-bold text-red-700 px-2"
                      value={penalty}
                      onChange={(e: any) => handleInputChange(p._id, "penalty", e.target.value)}
                      disabled={isClosed || isSaving}
                    />
                  </td>
                  
                  <td className="p-2 text-right font-black text-emerald-700 bg-emerald-50 text-[13px] sticky right-[55px] z-[40] shadow-[-4px_0_8px_rgba(0,0,0,0.06)] border-l border-b border-emerald-200">
                    {formatNumberWithDot(edit?.incomes?.totalGross)}
                  </td>
                  <td className={`p-1.5 sticky right-0 z-[40] ${rowBg} border-l border-b border-slate-200`}>
                    {editingRecords[p._id] && !isClosed ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveRow(p._id)} 
                        disabled={isSaving}
                        className="w-full h-7 text-[9px] bg-blue-600 px-1"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "LƯU"}
                      </Button>
                    ) : (<div className="text-center opacity-30 text-[10px] font-bold mt-1">---</div>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// =========================================================================
// MAIN
// =========================================================================
export default function PayrollBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonthDoc, setSelectedMonthDoc] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingRecords, setEditingRecords] = useState<{ [recordId: string]: any }>({});
  const [savingIds, setSavingIds] = useState<{ [recordId: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  // ===== STATE TOAST =====
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

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

  const fetchPayrollData = async (month: number, year: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${month}&year=${year}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.records || []);
        const depts: string[] = Array.from(new Set((data.records || []).map((a: any) => a.employeeSnapshot?.department).filter(Boolean)));
        setDepartments(depts);
        setEditingRecords({});
      }
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { if (selectedMonthDoc) fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year); }, [selectedMonthDoc]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const snap = p.employeeSnapshot;
      if (!snap) return false;
      const nameMatch = snap.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || snap.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = deptFilter === "ALL" || snap.department === deptFilter;
      return nameMatch && deptMatch;
    });
  }, [payrolls, searchQuery, deptFilter]);

  const handleInitMonth = async () => {
    const isCurrentlyViewing = selectedMonthDoc && selectedMonthDoc.month === newMonth && selectedMonthDoc.year === newYear;
    const existingMonth = monthsList.find(m => m.month === newMonth && m.year === newYear);
    const targetStatus = isCurrentlyViewing ? selectedMonthDoc.status : existingMonth?.status;

    if (targetStatus && targetStatus !== "draft") {
      alert(`Bảng lương Tháng ${newMonth}/${newYear} hiện đang bị khóa!\nVui lòng mở khóa sổ trước khi thực hiện gom lại số liệu.`);
      return;
    }

    if (!window.confirm("Bắt đầu Đồng Bộ Tự Động?\nHệ thống sẽ tính toán lại dựa trên đơn giá Show, tiền ăn ca và ca tập của từng nhân sự.")) return;
    setIsLoading(true);
    try {
      const payload = { month: newMonth, year: newYear, standardDays: 26 };
      const res = await fetch(`${API_BASE_URL}/init`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        await fetchMonthsList();
        setSelectedMonthDoc({ month: newMonth, year: newYear, status: "draft" });
      } else alert(result.message);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleToggleStatus = async (newStatus: "draft" | "approved" | "paid") => {
    const actionName = newStatus === "draft" ? "MỞ KHÓA SỔ" : newStatus === "approved" ? "KHÓA SỔ" : "ĐÁNH DẤU ĐÃ THANH TOÁN";
    if (!window.confirm(`Bạn có chắc muốn ${actionName}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/months/${selectedMonthDoc._id}/status`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        setSelectedMonthDoc((prev: any) => ({ ...prev, status: newStatus }));
        setMonthsList((prev) => prev.map(m => m._id === selectedMonthDoc._id ? { ...m, status: newStatus } : m));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonthDoc) return;
    if (!window.confirm(`Xóa TOÀN BỘ bảng lương tổng hợp tháng ${selectedMonthDoc.month}/${selectedMonthDoc.year}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}?month=${selectedMonthDoc.month}&year=${selectedMonthDoc.year}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedMonthDoc(null);
        setPayrolls([]);
        fetchMonthsList();
      } else alert(data.message);
    } catch (error) { console.error(error); }
  };

  // ===== XỬ LÝ THAY ĐỔI Ô INPUT =====
  const handleInputChange = (recordId: string, field: "bonus" | "insuranceAdvance" | "penalty", value: string) => {
    const numValue = value.replace(/\D/g, "");
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] ? { ...prev[recordId] } : JSON.parse(JSON.stringify(payrolls.find((p) => p._id === recordId)));
      if (!currentEdit.incomes) currentEdit.incomes = {};
      currentEdit.incomes[field] = Number(numValue);

      const allw = currentEdit.incomes.allowances || {};
      const totalAllw = clampMeal(allw.meal) + (allw.housingAllowance || 0) + (allw.trainingAllowance || 0);
      const insuranceAdvance = Number(currentEdit.incomes.insuranceAdvance) || 0;
      const penalty = Number(currentEdit.incomes.penalty) || 0;

      currentEdit.incomes.totalGross = Math.max(0,
        (currentEdit.incomes.timeSalary || 0) +
        totalAllw +
        (currentEdit.incomes.overtime || 0) +
        (currentEdit.incomes.bonus || 0) +
        (currentEdit.incomes.miniShowMoney || 0) +
        (currentEdit.incomes.bigShowMoney || 0) +
        (currentEdit.incomes.kpiBonus || 0) -
        insuranceAdvance -
        penalty
      );

      return { ...prev, [recordId]: currentEdit };
    });
  };

  // ===== LƯU ROW — KHÔNG FETCH LẠI =====
  const handleSaveRow = async (recordId: string) => {
    const updatedData = editingRecords[recordId];
    if (!updatedData) return;

    setSavingIds(prev => ({ ...prev, [recordId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/${recordId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          bonus: updatedData.incomes.bonus,
          insuranceAdvance: updatedData.incomes.insuranceAdvance,
          penalty: updatedData.incomes.penalty,
        }),
      });

      if (res.ok) {
        // ✅ Cập nhật local state — KHÔNG fetch lại
        setPayrolls(prev => prev.map(p => {
          if (p._id === recordId) {
            return {
              ...p,
              incomes: {
                ...p.incomes,
                ...updatedData.incomes
              }
            };
          }
          return p;
        }));
        
        // Xóa khỏi editingRecords (đã lưu thành công)
        setEditingRecords(prev => {
          const next = { ...prev };
          delete next[recordId];
          return next;
        });
        
        showToast("Đã lưu thành công!");
      } else {
        showToast("Lỗi lưu dữ liệu", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi kết nối", "error");
    } finally {
      setSavingIds(prev => {
        const next = { ...prev };
        delete next[recordId];
        return next;
      });
    }
  };

  const handleExportExcel = () => {
    if (!filteredPayrolls || filteredPayrolls.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const exportData = filteredPayrolls.map((p, index) => {
      const snap = p.employeeSnapshot || {};
      const allowances = p.incomes?.allowances || {};
      const mealDisplay = clampMeal(allowances.meal);
      const housingDisplay = allowances.housingAllowance || 0;
      const trainingDisplay = allowances.trainingAllowance || 0;
      const totalAllw = mealDisplay + housingDisplay + trainingDisplay;
      const insuranceAdvance = p.incomes?.insuranceAdvance ?? DEFAULT_INSURANCE_ADVANCE;
      const penalty = p.incomes?.penalty ?? 0;

      return {
        "STT": index + 1,
        "Họ và tên": snap.fullName || "",
        "Mã NV": snap.employeeCode || "",
        "Chức vụ": snap.position || "",
        "Bộ phận": snap.department || "",
        "Lương Cơ Bản": formatNumberWithDot(p.baseSalary || 0),
        "Ngày công": p.actualDays || 0,
        "Lương Thời Gian": formatNumberWithDot(p.incomes?.timeSalary || 0),
        "Làm Thêm Giờ": formatNumberWithDot(p.incomes?.overtime || 0),
        "Mini Show": formatNumberWithDot(p.incomes?.miniShowMoney || 0),
        "Big Show": formatNumberWithDot(p.incomes?.bigShowMoney || 0),
        "Thưởng N.Công": formatNumberWithDot(p.incomes?.kpiBonus || 0),
        "Tiền ăn ca": formatNumberWithDot(mealDisplay),
        "Nhà ở": formatNumberWithDot(housingDisplay),
        "Ca tập": formatNumberWithDot(trainingDisplay),
        "Tổng Phụ Cấp": formatNumberWithDot(totalAllw),
        "Thưởng Mới": formatNumberWithDot(p.incomes?.bonus || 0),
        "Tạm ứng BHXH": formatNumberWithDot(insuranceAdvance),
        "Phạt": formatNumberWithDot(penalty),
        "TỔNG GROSS": formatNumberWithDot(p.incomes?.totalGross || 0),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 },
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bang_Luong_Gross");
    
    const fileName = `Bang_Luong_Gross_T${selectedMonthDoc?.month}_${selectedMonthDoc?.year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
      
      <aside className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[320px]' : 'w-0'}`}>
        <div className={`w-[320px] h-full p-5 space-y-4 overflow-y-auto no-scrollbar ${isSidebarOpen ? 'block' : 'hidden'}`}>
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" /> Đồng Bộ &amp; Tính Lương</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-[10px] text-blue-700 leading-relaxed">
                <div className="font-bold mb-1 flex items-center gap-1"><Settings className="w-3 h-3"/> Ghi chú</div>
                Đơn giá <b>Mini Show</b>, <b>Big Show</b>, <b>Tiền ăn/công</b> và <b>Ca tập/công</b> được lấy từ hồ sơ từng nhân sự. Vui lòng cập nhật trong mục <b>Lương &amp; Bảo hiểm</b> của nhân viên trước khi đồng bộ.
              </div>
              <div className="flex gap-2">
                <select className="border rounded-md p-2 text-xs w-full bg-slate-50" value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))}>{[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1}>Tháng {i + 1}</option>))}</select>
                <select className="border rounded-md p-2 text-xs w-full bg-slate-50" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))}>{[2025, 2026, 2027].map((y) => (<option key={y} value={y}>Năm {y}</option>))}</select>
              </div>
              <Button onClick={handleInitMonth} disabled={isLoading} className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 font-bold">
                {isLoading ? <><RefreshCcw className="w-4 h-4 mr-1 animate-spin"/> Đang gom...</> : <><PlayCircle className="w-4 h-4 mr-1" /> Gom Số Liệu Tự Động</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white h-[400px] flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2"><Wallet className="w-4 h-4" /> Lịch sử kỳ lương</div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 no-scrollbar">
              {monthsList.map((m) => (
                <div key={`${m.month}-${m.year}`} className="relative group">
                  <button onClick={() => setSelectedMonthDoc(m)} className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${selectedMonthDoc?.month === m.month && selectedMonthDoc?.year === m.year ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-100 text-slate-700"}`}>
                    <div className="flex flex-col"><span className="font-bold text-sm">Tháng {m.month}/{m.year}</span><span className="text-[10px] opacity-80 font-medium">{formatCurrency(m.totalNet)}</span></div>
                    <div className="flex items-center pr-1">{m.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : m.status === "approved" ? <Lock className="w-3 h-3 text-blue-200" /> : <span className="w-2 h-2 rounded-full bg-amber-400" />}</div>
                  </button>
                  {m.status === "draft" && (<button onClick={async (e) => { e.stopPropagation(); handleDeleteMonth(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm"><Trash2 className="w-4 h-4" /></button>)}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-4 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm cursor-pointer">{isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 sm:p-6 min-w-0 bg-slate-50">
        {selectedMonthDoc ? (
          <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-[#0f172a] flex items-center gap-3">
                  Bảng Lương Gross Tháng {selectedMonthDoc.month}/{selectedMonthDoc.year}
                  {selectedMonthDoc.status === "draft" && <Badge variant="secondary" className="bg-amber-100 text-amber-700">Bản Nháp</Badge>}
                  {selectedMonthDoc.status === "approved" && <Badge variant="secondary" className="bg-blue-100 text-blue-700">Đã Khóa Sổ</Badge>}
                  {selectedMonthDoc.status === "paid" && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Hoàn Tất Chi Trả</Badge>}
                </h1>
              </div>
            </div>

            <div className="mt-0">
              <div className="bg-white p-3 rounded-2xl border-none shadow-sm flex flex-wrap gap-4 items-center mb-4">
                <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5"><Filter className="w-4 h-4 text-slate-400" /><select className="bg-transparent text-sm font-medium outline-none cursor-pointer" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option value="ALL">Tất cả phòng ban</option>{departments.map((d) => (<option key={d} value={d}>{d}</option>))}</select></div>
                <div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-xl bg-slate-50 border-slate-200" /></div>
                <div className="flex gap-2 ml-auto items-center">
                  <Button variant="ghost" size="sm" onClick={() => fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year)}><RefreshCcw className="w-4 h-4" /></Button>
                  
                  <Button size="sm" onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"><FileDown className="w-4 h-4 mr-1" /> Xuất Excel</Button>
                  
                  {selectedMonthDoc.status === "draft" ? (
                    <Button size="sm" onClick={() => handleToggleStatus("approved")} className="bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl">
                      <Lock className="w-4 h-4 mr-1" /> Khóa Sổ
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleToggleStatus("draft")} className="bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold">
                      <Unlock className="w-4 h-4 mr-1" /> Mở Khóa Sổ
                    </Button>
                  )}
                </div>
              </div>
              {isDataLoading ? (<div className="bg-white h-64 rounded-2xl flex items-center justify-center"><Loader /></div>) : (<TabGrossPayrollTable filteredPayrolls={filteredPayrolls} editingRecords={editingRecords} isClosed={selectedMonthDoc.status !== "draft"} handleInputChange={handleInputChange} handleSaveRow={handleSaveRow} savingIds={savingIds} />)}
            </div>
          </div>
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm"><Calculator className="w-20 h-20 mb-4 opacity-20" /><p className="font-bold text-lg uppercase tracking-widest opacity-60">Vui lòng khởi tạo một bảng lương</p></div>
        )}
      </main>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in-0 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}