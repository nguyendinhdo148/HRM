/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Search, FileDown, Wallet, Filter, CheckCircle2, Lock, Landmark, ChevronLeft, ChevronRight, HandCoins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import XLSX from "xlsx-js-style";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/payroll`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatCurrency = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
const formatNumberWithDot = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "0";
  return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function PayrollNetBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonthDoc, setSelectedMonthDoc] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Lấy danh sách các tháng đã tính lương
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

  // Lấy dữ liệu lương của 1 tháng
  const fetchPayrollData = async (month: number, year: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${month}&year=${year}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.records || []);
        const depts: string[] = Array.from(new Set((data.records || []).map((a: any) => a.employeeSnapshot?.department).filter(Boolean)));
        setDepartments(depts);
      }
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { if (selectedMonthDoc) fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year); }, [selectedMonthDoc]);

  // Bộ lọc
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const snap = p.employeeSnapshot;
      if (!snap) return false;
      const nameMatch = snap.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || snap.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = deptFilter === "ALL" || snap.department === deptFilter;
      return nameMatch && deptMatch;
    });
  }, [payrolls, searchQuery, deptFilter]);

  // Xuất Excel Net
  const handleExportExcelNet = () => {
    if (filteredPayrolls.length === 0) return alert("Không có dữ liệu để xuất");
    const m = selectedMonthDoc?.month;
    const y = selectedMonthDoc?.year;
    
    const FONT = { name: "Times New Roman", sz: 11 };
    const BORDER = { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } }, left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } } };
    const titleStyle = { font: { name: "Times New Roman", sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
    const headerStyle = { font: { ...FONT, bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: BORDER, fill: { fgColor: { rgb: "E2EFDA" } } };
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRight = { font: FONT, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };
    const cellRightBold = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };

    const wsData: any[][] = [];
    wsData.push([{ v: `BẢNG THANH TOÁN THỰC LĨNH THÁNG ${m}/${y}`, s: titleStyle }, ...Array(8).fill({ v: "", s: titleStyle }) ]);
    wsData.push([]); 
    wsData.push([
      { v: "STT", s: headerStyle }, { v: "Họ và tên", s: headerStyle }, { v: "Mã NV", s: headerStyle }, { v: "Bộ phận", s: headerStyle }, 
      { v: "Tổng Thu Nhập (Gross)", s: headerStyle }, { v: "Tạm Ứng", s: headerStyle }, { v: "Bảo Hiểm", s: headerStyle }, { v: "Thuế TNCN", s: headerStyle }, 
      { v: "THỰC LĨNH", s: headerStyle }
    ]);

    filteredPayrolls.forEach((p, index) => {
      const snap = p.employeeSnapshot || {};
      const ded = p.deductions || {};
      const ins = ded.insurance || {};

      wsData.push([
        { v: index + 1, s: cellCenter }, { v: snap.fullName || "", s: cellLeft }, { v: snap.employeeCode || "", s: cellCenter }, { v: snap.department || "", s: cellCenter }, 
        { v: formatNumberWithDot(p.incomes?.totalGross), s: cellRightBold }, 
        { v: formatNumberWithDot(ded.advance), s: cellRight }, { v: formatNumberWithDot(ins.total), s: cellRight }, { v: formatNumberWithDot(ded.taxTNCN), s: cellRight }, 
        { v: formatNumberWithDot(p.netSalary), s: { ...cellRightBold, font: { ...FONT, bold: true, color: { rgb: "C00000" } } } }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
    ws["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Net_T${m}_${y}`);
    XLSX.writeFile(wb, `BangLuong_ThucLinh_T${m}_${y}.xlsx`);
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR - CHỈ HIỂN THỊ DANH SÁCH THÁNG ĐỂ CHỌN */}
      <aside className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px]' : 'w-0'}`}>
        <div className={`w-[280px] h-full flex flex-col overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
          <div className="p-5 border-b bg-slate-50 font-black text-sm text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-5 h-5" /> Quản Lý Thực Lĩnh
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Lịch sử kỳ lương</h3>
            {monthsList.map((m) => (
              <button 
                key={`${m.month}-${m.year}`} 
                onClick={() => setSelectedMonthDoc(m)} 
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${selectedMonthDoc?.month === m.month && selectedMonthDoc?.year === m.year ? "bg-amber-600 text-white shadow-md" : "bg-white border hover:bg-amber-50 text-slate-700"}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Tháng {m.month}/{m.year}</span>
                  <span className="text-[10px] opacity-80 font-medium">Quy mô: {formatCurrency(m.totalNet)}</span>
                </div>
                <div>
                  {m.status === "paid" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : m.status === "approved" ? <Lock className="w-4 h-4 text-amber-200" /> : <span className="w-3 h-3 rounded-full bg-slate-300" />}
                </div>
              </button>
            ))}
            {monthsList.length === 0 && <div className="text-center text-sm text-slate-400 mt-10">Chưa có dữ liệu lương</div>}
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-4 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm cursor-pointer">
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 sm:p-6 min-w-0 bg-slate-50">
        {selectedMonthDoc ? (
          <div className="flex flex-col h-full animate-in fade-in-50">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-[#0f172a] flex items-center gap-3">
                  <HandCoins className="w-6 h-6 text-amber-600" /> Bảng Lương Net - Tháng {selectedMonthDoc.month}/{selectedMonthDoc.year}
                  {selectedMonthDoc.status === "draft" && <Badge variant="secondary" className="bg-slate-200 text-slate-700">Bản Nháp</Badge>}
                  {selectedMonthDoc.status === "approved" && <Badge variant="secondary" className="bg-blue-100 text-blue-700">Đã Khóa Sổ</Badge>}
                  {selectedMonthDoc.status === "paid" && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Đã Thanh Toán</Badge>}
                </h1>
                <p className="text-sm text-slate-500 mt-1">Chi tiết thu nhập thực tế sau khi trừ Tạm ứng, BHXH và Thuế TNCN.</p>
              </div>
            </div>

            {/* BỘ LỌC & TOOLBAR */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-4 shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select className="bg-transparent text-sm font-medium outline-none cursor-pointer" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="flex gap-2 ml-auto items-center">
                <Button size="sm" onClick={handleExportExcelNet} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">
                  <FileDown className="w-4 h-4 mr-1" /> Xuất Excel
                </Button>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <Card className="flex-1 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              {isDataLoading ? (
                <div className="h-full min-h-[400px] flex items-center justify-center"><Loader /></div>
              ) : (
                <div className="overflow-auto h-full pb-4 custom-scrollbar relative">
                  <table className="w-full text-[12px] border-collapse min-w-[1200px] bg-white">
                    <thead className="bg-[#0f172a] text-white">
                      <tr className="h-[48px]">
                        <th className="p-2 sticky left-0 top-0 bg-[#0f172a] z-[60] w-[50px] border-r border-b border-slate-700 text-center">STT</th>
                        <th className="p-2 sticky left-[50px] top-0 bg-[#0f172a] z-[60] w-[200px] border-r border-b border-slate-700 text-left shadow-[4px_0_10px_rgba(0,0,0,0.3)]">Họ và tên</th>
                        
                        <th className="p-2 border-r border-b border-slate-700 text-center sticky top-0 z-[50]">Bộ phận</th>
                        <th className="p-2 border-r border-b border-slate-700 bg-[#064e3b] text-emerald-300 font-black text-right sticky top-0 z-[50]">TỔNG GROSS</th>
                        
                        <th className="p-2 border-r border-b border-slate-700 bg-[#831843] text-rose-200 text-right sticky top-0 z-[50]">Tạm Ứng</th>
                        <th className="p-2 border-r border-b border-slate-700 bg-[#9f1239] text-rose-200 text-right sticky top-0 z-[50]">Bảo Hiểm (NLĐ)</th>
                        <th className="p-2 border-r border-b border-slate-700 bg-[#9f1239] text-rose-200 text-right sticky top-0 z-[50]">Thuế TNCN</th>
                        <th className="p-2 border-r border-b border-slate-700 bg-[#be123c] text-white font-bold text-right sticky top-0 z-[50]">TỔNG KHẤU TRỪ</th>
                        
                        <th className="p-2 bg-[#b45309] text-white font-black text-right w-[150px] sticky right-0 top-0 z-[60] shadow-[-4px_0_10px_rgba(0,0,0,0.3)] border-l border-b border-[#8b3d04]">THỰC LĨNH (NET)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPayrolls.map((p: any, idx: number) => {
                        const snap = p.employeeSnapshot;
                        const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]";
                        
                        return (
                          <tr key={p._id} className={`${rowBg} hover:bg-amber-50 transition-colors`}>
                            <td className={`p-3 border-r border-b border-slate-200 sticky left-0 z-[40] ${rowBg} font-medium text-center`}>{idx + 1}</td>
                            <td className={`p-3 border-r border-b border-slate-200 sticky left-[50px] z-[40] ${rowBg} font-bold text-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.06)]`}>
                              <div className="truncate w-[180px]" title={snap?.fullName}>{snap?.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate w-[180px]">{snap?.employeeCode}</div>
                            </td>
                            
                            <td className="p-3 border-r border-b border-slate-200 text-center text-slate-600 font-medium">{snap?.department}</td>
                            
                            {/* TỔNG GROSS */}
                            <td className="p-3 border-r border-b border-slate-200 text-right font-black text-emerald-700 bg-emerald-50/50">
                              {formatNumberWithDot(p.incomes?.totalGross)}
                            </td>
                            
                            {/* CÁC KHOẢN TRỪ */}
                            <td className="p-3 border-r border-b border-slate-200 text-right font-bold text-rose-500">{formatNumberWithDot(p.deductions?.advance)}</td>
                            <td className="p-3 border-r border-b border-slate-200 text-right font-bold text-rose-600">{formatNumberWithDot(p.deductions?.insurance?.total)}</td>
                            <td className="p-3 border-r border-b border-slate-200 text-right font-bold text-rose-600">{formatNumberWithDot(p.deductions?.taxTNCN)}</td>
                            <td className="p-3 border-r border-b border-slate-200 text-right font-black text-rose-700 bg-rose-50/50">
                              {formatNumberWithDot(p.deductions?.totalDeductions)}
                            </td>
                            
                            {/* THỰC LĨNH CUỐI CÙNG */}
                            <td className="p-3 text-right font-black text-amber-900 bg-[#fef3c7] text-[15px] sticky right-0 z-[40] shadow-[-4px_0_8px_rgba(0,0,0,0.06)] border-l border-b border-amber-200">
                              {formatNumberWithDot(p.netSalary)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <Wallet className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-lg uppercase tracking-widest opacity-60">Vui lòng chọn một tháng để xem</p>
          </div>
        )}
      </main>

      {/* CÁC CLASS ẨN THANH CUỘN */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}