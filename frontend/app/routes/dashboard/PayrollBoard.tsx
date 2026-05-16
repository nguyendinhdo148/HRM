/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator, Save, PlayCircle, RefreshCcw, CheckCircle2, Search, FileDown, 
  TrendingUp, Wallet, Filter, Banknote, Trash2, Lock, Unlock, Landmark, FileSpreadsheet, Loader2, Settings,
  ChevronLeft, ChevronRight, Building2, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

// ==========================================
// TRANG TÍNH LƯƠNG GROSS
// ==========================================
const TabGrossPayrollTable = ({ filteredPayrolls, editingRecords, isClosed, handleInputChange, handleSaveRow }: any) => {
  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden animate-in fade-in-50">
      <div className="overflow-auto max-h-[calc(100vh-240px)] pb-4 custom-scrollbar relative">
        <table className="w-full text-[11px] border-collapse min-w-[2200px] bg-white">
          <thead className="bg-[#003366] text-white">
            <tr className="h-[48px]">
              <th rowSpan={2} className="p-2 sticky left-0 top-0 bg-[#003366] z-[60] w-[45px] min-w-[45px] max-w-[45px] border-r border-b border-slate-600 text-center">STT</th>
              <th rowSpan={2} className="p-2 sticky left-[45px] top-0 bg-[#003366] z-[60] w-[160px] min-w-[160px] max-w-[160px] border-r border-b border-slate-600 text-left shadow-[4px_0_10px_rgba(0,0,0,0.3)]">Họ và tên</th>
              
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Chức vụ</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Bộ phận</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Lương CV</th>
              <th colSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1e40af] text-center sticky top-0 z-[50]">Lương Thời Gian</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1d4ed8] text-center max-w-[100px] sticky top-0 z-[50]">Làm Thêm Giờ</th>
              <th colSpan={3} className="p-2 border-r border-b border-slate-600 bg-[#6b21a8] text-center sticky top-0 z-[50]">Hiệu Suất (Show & Công)</th>
              <th colSpan={6} className="p-2 border-r border-b border-slate-600 bg-[#0f766e] text-center sticky top-0 z-[50]">Các Khoản Phụ Cấp</th>
              <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#831843] text-center min-w-[100px] sticky top-0 z-[50]">Thưởng Mới</th>
              
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
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Xăng xe</th>
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Điện thoại</th>
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Trang phục</th>
              <th className="p-1 border-r border-b border-slate-600 sticky top-[48px] bg-[#1e293b] z-[50]">Nhà ở</th>
              <th className="p-1 border-r border-b border-slate-600 text-emerald-200 font-bold bg-[#047857] sticky top-[48px] z-[50]">Tổng PC</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredPayrolls.map((p: any, idx: number) => {
              const edit = editingRecords[p._id] || p;
              const snap = p.employeeSnapshot;
              const allowances = p.incomes?.allowances || {};
              const totalAllw = (allowances.meal || 0) + (allowances.transport || 0) + (allowances.phone || 0) + (allowances.clothing || 0) + (allowances.housing || 0);
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]";
              
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

                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.meal)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.transport)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.phone)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.clothing)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.housing)}</td>
                  <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/50">{formatNumberWithDot(totalAllw)}</td>

                  <td className="p-1 border-r border-b border-slate-200 text-center bg-rose-50/30">
                    <Input 
                      className="h-7 w-full text-right text-[11px] font-bold text-rose-700 px-2"
                      value={formatNumberWithDot(edit?.incomes?.bonus ?? 0)}
                      onChange={(e) => handleInputChange(p._id, "bonus", e.target.value)}
                      disabled={isClosed}
                    />
                  </td>
                  
                  <td className="p-2 text-right font-black text-emerald-700 bg-emerald-50 text-[13px] sticky right-[55px] z-[40] shadow-[-4px_0_8px_rgba(0,0,0,0.06)] border-l border-b border-emerald-200">
                    {formatNumberWithDot(edit?.incomes?.totalGross)}
                  </td>
                  <td className={`p-1.5 sticky right-0 z-[40] ${rowBg} border-l border-b border-slate-200`}>
                    {editingRecords[p._id] && !isClosed ? (
                      <Button size="sm" onClick={() => handleSaveRow(p._id)} className="w-full h-7 text-[9px] bg-blue-600 px-1">LƯU</Button>
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

// ==========================================
// THÀNH PHẦN STATS
// ==========================================
const TabPayrollStats = ({ stats, chartData }: any) => {
  return (
    <div className="space-y-6 mt-4 animate-in fade-in-50">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Nhân sự (Lọc)</div><div className="text-3xl font-black text-slate-800">{stats.count} <span className="text-sm">người</span></div></CardContent></Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Gross</div><div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalGross)}</div></CardContent></Card>
        <Card className="border-l-4 border-l-rose-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Quỹ BHXH (NLĐ)</div><div className="text-2xl font-black text-rose-600">{formatCurrency(stats.totalInsurance)}</div></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Thực Lĩnh</div><div className="text-2xl font-black text-amber-600">{formatCurrency(stats.totalNet)}</div></CardContent></Card>
      </div>
      <Card className="p-6 border shadow-sm">
        <CardHeader className="px-0 pt-0 border-b mb-6 pb-4 flex flex-row items-center justify-between">
          <div><CardTitle className="text-lg font-bold flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Biểu Đồ Thực Lĩnh</CardTitle><CardDescription>Top 15 nhân sự có thu nhập cao nhất</CardDescription></div>
        </CardHeader>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`} />
              <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: number) => [formatCurrency(val), "Thực lĩnh"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="NetSalary" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

// ==========================================
// THÀNH PHẦN KÊ KHAI THUẾ (AUTO-FETCH & SMART FILTER)
// ==========================================
const TabTaxSummary = ({ monthsList }: { monthsList: any[] }) => {
  // 1. Tính toán các năm CÓ DỮ LIỆU
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(monthsList.map(m => m.year)));
    return years.length > 0 ? years.sort((a, b) => b - a) : [new Date().getFullYear()];
  }, [monthsList]);

  const [year, setYear] = useState<number>(availableYears[0]);

  // 2. Tính toán các Quý CÓ DỮ LIỆU dựa vào Năm đã chọn
  const availablePeriods = useMemo(() => {
    const monthsInYear = monthsList.filter(m => m.year === year).map(m => m.month);
    const periods = [{ value: "ALL", label: "Cả năm" }];
    
    if (monthsInYear.some(m => [1, 2, 3].includes(m))) periods.push({ value: "Q1", label: "Quý 1" });
    if (monthsInYear.some(m => [4, 5, 6].includes(m))) periods.push({ value: "Q2", label: "Quý 2" });
    if (monthsInYear.some(m => [7, 8, 9].includes(m))) periods.push({ value: "Q3", label: "Quý 3" });
    if (monthsInYear.some(m => [10, 11, 12].includes(m))) periods.push({ value: "Q4", label: "Quý 4" });
    
    return periods;
  }, [monthsList, year]);

  const [period, setPeriod] = useState<string>("ALL");
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [isAggregating, setIsAggregating] = useState(false);

  // Auto set Year nếu dữ liệu thay đổi
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears, year]);

  // Auto set Period nếu dữ liệu thay đổi
  useEffect(() => {
    if (!availablePeriods.find(p => p.value === period)) {
      setPeriod("ALL");
    }
  }, [availablePeriods, period]);

  // TÍNH TOÁN TRỰC TIẾP LÚC GỌI AUTO-FETCH
  const fetchAndAggregate = async () => {
    setIsAggregating(true);
    try {
      let months = [];
      if (period === "Q1") months = [1, 2, 3];
      else if (period === "Q2") months = [4, 5, 6];
      else if (period === "Q3") months = [7, 8, 9];
      else if (period === "Q4") months = [10, 11, 12];
      else months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // ALL

      const promises = months.map(m => 
        fetch(`${API_BASE_URL}?month=${m}&year=${year}`, { headers: getAuthHeaders() }).then(res => res.json())
      );
      const results = await Promise.all(promises);

      const map: { [code: string]: any } = {};
      results.forEach(res => {
        if (res.records) {
          res.records.forEach((p: any) => {
            const snap = p.employeeSnapshot;
            if (!snap) return;
            const code = snap.employeeCode;
            
            if (!map[code]) {
              map[code] = {
                employeeCode: code,
                fullName: snap.fullName,
                department: snap.department,
                totalGross: 0,
                totalInsurance: 0,
                totalTax: 0,
                totalNet: 0
              };
            }
            map[code].totalGross += (p.incomes?.totalGross || 0);
            map[code].totalInsurance += (p.deductions?.insurance?.total || 0);
            map[code].totalTax += (p.deductions?.tax || 0);
            map[code].totalNet += (p.netSalary || 0);
          });
        }
      });
      
      setAggregatedData(Object.values(map).sort((a: any, b: any) => b.totalGross - a.totalGross));
    } catch (error) {
      console.error(error);
    } finally {
      setIsAggregating(false);
    }
  };

  // HOOK TỰ ĐỘNG CÀO DỮ LIỆU MỖI KHI NĂM / KỲ THAY ĐỔI
  useEffect(() => {
    if (year && period) {
      fetchAndAggregate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, period]);

  const totals = useMemo(() => {
    return aggregatedData.reduce((acc, curr) => {
      acc.gross += curr.totalGross;
      acc.insurance += curr.totalInsurance;
      acc.tax += curr.totalTax;
      acc.net += curr.totalNet;
      return acc;
    }, { gross: 0, insurance: 0, tax: 0, net: 0 });
  }, [aggregatedData]);

  const handleExportTaxExcel = () => {
    if (aggregatedData.length === 0) return alert("Không có dữ liệu để xuất");
    
    const wb = XLSX.utils.book_new();

    const periodText = period === "ALL" ? `Năm ${year}` : `Quý ${period.replace('Q', '')} Năm ${year}`;
    const titleRow = [`BẢNG KÊ TỔNG HỢP CHI PHÍ THU NHẬP - ${periodText.toUpperCase()}`];
    const emptyRow = [""];
    const headers = ["STT", "Mã NV", "Họ và tên", "Phòng ban", "Tổng Thu Nhập (Gross)", "Các Khoản Trừ (BHXH)", "Thuế TNCN Khấu Trừ", "Thực Lĩnh (Net)"];
    
    const dataRows = aggregatedData.map((d, i) => [
      i + 1, d.employeeCode, d.fullName, d.department, d.totalGross, d.totalInsurance, d.totalTax, d.totalNet
    ]);

    const totalRow = ["", "", "TỔNG CỘNG", "", totals.gross, totals.insurance, totals.tax, totals.net];

    const wsData = [titleRow, emptyRow, headers, ...dataRows, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]; 
    
    ws["A1"].s = {
      font: { name: "Arial", sz: 14, bold: true, color: { rgb: "003366" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const headerRowIndex = 2;
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        fill: { fgColor: { rgb: "003366" } },
        font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    for (let r = 3; r <= 3 + dataRows.length; r++) { 
      const isTotalRow = r === 3 + dataRows.length;
      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        
        ws[cellRef].s = {
          font: { name: "Arial", sz: 11, bold: isTotalRow }, 
          fill: isTotalRow ? { fgColor: { rgb: "FFF2CC" } } : undefined, 
          border: {
            top: { style: "thin", color: { rgb: "DDDDDD" } }, bottom: { style: "thin", color: { rgb: "DDDDDD" } },
            left: { style: "thin", color: { rgb: "DDDDDD" } }, right: { style: "thin", color: { rgb: "DDDDDD" } }
          },
          alignment: { vertical: "center", horizontal: (c >= 4 ? "right" : (c === 0 ? "center" : "left")) }
        };

        if (c >= 4 && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = "#,##0";
        }
      }
    }

    ws["!cols"] = [
      { wch: 6 },  { wch: 12 }, { wch: 28 }, { wch: 15 }, 
      { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Tong_Hop");
    XLSX.writeFile(wb, `BaoCaoTongHop_${period}_${year}.xlsx`);
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 mt-4 w-full">
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center w-full">
        <div className="flex gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Năm Kê Khai</label>
            <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none bg-slate-50 text-slate-700 min-w-[120px] focus:ring-2 focus:ring-blue-500/20" value={year} onChange={e => setYear(Number(e.target.value))}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Kỳ Báo Cáo</label>
            <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none bg-slate-50 text-slate-700 min-w-[150px] focus:ring-2 focus:ring-blue-500/20" value={period} onChange={e => setPeriod(e.target.value)}>
              {availablePeriods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" onClick={handleExportTaxExcel} disabled={aggregatedData.length === 0} className="rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold h-[42px] px-6 transition-all bg-white shadow-sm">
            <FileSpreadsheet className="w-5 h-5 mr-2"/> XUẤT EXCEL CHUẨN
          </Button>
        </div>
      </div>

      {aggregatedData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-slate-400">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Nhận Sự</span>
            <span className="text-2xl font-black text-slate-800">{aggregatedData.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Thu Nhập Trả</span>
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(totals.gross)}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-rose-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng BHXH (NLĐ)</span>
            <span className="text-2xl font-black text-rose-500">{formatCurrency(totals.insurance)}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thuế Thu Đóng</span>
            <span className="text-2xl font-black text-amber-500">{formatCurrency(totals.tax)}</span>
          </div>
        </div>
      )}

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white mt-4">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar relative">
          <table className="w-full text-xs border-collapse min-w-[1100px]">
            <thead className="bg-[#f8fafc] text-slate-600 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 border-b border-slate-200 text-center font-bold uppercase w-[60px] bg-[#f8fafc]">STT</th>
                <th className="p-4 border-b border-slate-200 text-left font-bold uppercase w-[120px] bg-[#f8fafc]">Mã NV</th>
                <th className="p-4 border-b border-slate-200 text-left font-bold uppercase bg-[#f8fafc]">Họ và tên</th>
                <th className="p-4 border-b border-slate-200 text-left font-bold uppercase bg-[#f8fafc]">Phòng ban</th>
                <th className="p-4 border-b border-slate-200 text-right font-bold uppercase text-emerald-600 bg-[#f8fafc]">Tổng Thu Nhập</th>
                <th className="p-4 border-b border-slate-200 text-right font-bold uppercase text-rose-600 bg-[#f8fafc]">Tổng BHXH Trừ</th>
                <th className="p-4 border-b border-slate-200 text-right font-bold uppercase text-amber-600 bg-[#f8fafc]">Thuế Đã Trừ</th>
                <th className="p-4 border-b border-slate-200 text-right font-black uppercase text-blue-700 bg-[#f8fafc]">Tổng Thực Lĩnh</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isAggregating ? (
                <tr><td colSpan={8} className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2"/><div className="text-slate-400 font-medium">Đang cào dữ liệu...</div></td></tr>
              ) : aggregatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center flex-col items-center justify-center">
                    <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <div className="text-slate-500 font-medium text-base">Chưa có dữ liệu cho kỳ này.</div>
                  </td>
                </tr>
              ) : aggregatedData.map((d, i) => (
                <tr key={d.employeeCode} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="p-4 text-center font-medium text-slate-500">{i + 1}</td>
                  <td className="p-4 font-medium text-slate-500">{d.employeeCode}</td>
                  <td className="p-4 font-bold text-slate-800">{d.fullName}</td>
                  <td className="p-4 text-slate-600">
                    <Badge variant="outline" className="bg-white">{d.department}</Badge>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-700">{formatCurrency(d.totalGross)}</td>
                  <td className="p-4 text-right font-medium text-rose-500">{formatCurrency(d.totalInsurance)}</td>
                  <td className="p-4 text-right font-bold text-amber-500">{formatCurrency(d.totalTax)}</td>
                  <td className="p-4 text-right font-black text-blue-700 bg-blue-50/30">{formatCurrency(d.totalNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// =========================================================================
// MAIN COMPONENT: GIAO DIỆN CHÍNH
// =========================================================================
export default function PayrollBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonthDoc, setSelectedMonthDoc] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingRecords, setEditingRecords] = useState<{ [recordId: string]: any }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [configRates, setConfigRates] = useState({
    minishow:  40800, bigshow:  130500, meal: 35000, transport: 30000, housingUnder15: 425000, housingOver15: 850000
  });

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

  const stats = useMemo(() => {
    return {
      count: filteredPayrolls.length,
      totalGross: filteredPayrolls.reduce((acc, curr) => acc + (curr.incomes?.totalGross || 0), 0),
      totalNet: filteredPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0),
      totalInsurance: filteredPayrolls.reduce((acc, curr) => acc + (curr.deductions?.insurance?.total || 0), 0),
    };
  }, [filteredPayrolls]);

  const chartData = useMemo(() => {
    return filteredPayrolls.map((p) => ({ name: p.employeeSnapshot?.fullName?.split(" ").pop() || "N/A", NetSalary: p.netSalary || 0 }))
      .sort((a, b) => b.NetSalary - a.NetSalary).slice(0, 15);
  }, [filteredPayrolls]);

  const handleInitMonth = async () => {
    if (!window.confirm("Bắt đầu Đồng Bộ Tự Động?\nHệ thống sẽ tính toán lại dựa trên các tham số cấu hình phụ cấp và KPIs.")) return;
    setIsLoading(true);
    try {
      const payload = { month: newMonth, year: newYear, standardDays: 26, rates: configRates };
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
    const actionName = newStatus === "approved" ? "KHÓA SỔ" : newStatus === "paid" ? "ĐÁNH DẤU ĐÃ THANH TOÁN" : "MỞ KHÓA";
    if (!window.confirm(`Bạn có chắc muốn ${actionName}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/months/${selectedMonthDoc._id}/status`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        fetchMonthsList();
        setSelectedMonthDoc((prev: any) => ({ ...prev, status: newStatus }));
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

  const handleInputChange = (recordId: string, field: "bonus", value: string) => {
    const numValue = value.replace(/\D/g, "");
    setEditingRecords((prev) => {
      const currentEdit = prev[recordId] ? { ...prev[recordId] } : JSON.parse(JSON.stringify(payrolls.find((p) => p._id === recordId)));
      if (!currentEdit.incomes) currentEdit.incomes = {};
      currentEdit.incomes[field] = Number(numValue);
      
      const allw = currentEdit.incomes.allowances || {};
      const totalAllw = (allw.meal||0) + (allw.transport||0) + (allw.phone||0) + (allw.clothing||0) + (allw.housing||0) + (allw.other||0);
      currentEdit.incomes.totalGross = currentEdit.incomes.timeSalary + totalAllw + currentEdit.incomes.overtime + currentEdit.incomes.bonus + currentEdit.incomes.miniShowMoney + currentEdit.incomes.bigShowMoney + currentEdit.incomes.kpiBonus;

      return { ...prev, [recordId]: currentEdit };
    });
  };

  const handleSaveRow = async (recordId: string) => {
    const updatedData = editingRecords[recordId];
    if (!updatedData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${recordId}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ bonus: updatedData.incomes.bonus }) });
      if (res.ok) fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year);
    } catch (error) { console.error(error); }
  };

  const handleExportExcel = () => {
    // Logic export excel cho Bảng Lương (nếu có)
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
      
      <aside className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[320px]' : 'w-0'}`}>
        <div className={`w-[320px] h-full p-5 space-y-4 overflow-y-auto no-scrollbar ${isSidebarOpen ? 'block' : 'hidden'}`}>
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" /> Đồng Bộ & Tính Lương</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border space-y-2 mb-2">
                <div className="flex items-center gap-1 mb-2 font-bold text-xs text-slate-600"><Settings className="w-3 h-3"/> Thông số tính toán</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><label className="text-slate-500">Minishow</label><Input type="number" value={configRates.minishow} onChange={(e) => setConfigRates({...configRates, minishow: Number(e.target.value)})} className="h-6 text-[10px] px-1" /></div>
                  <div><label className="text-slate-500">Bigshow</label><Input type="number" value={configRates.bigshow} onChange={(e) => setConfigRates({...configRates, bigshow: Number(e.target.value)})} className="h-6 text-[10px] px-1" /></div>
                  <div><label className="text-slate-500">Ăn / Công</label><Input type="number" value={configRates.meal} onChange={(e) => setConfigRates({...configRates, meal: Number(e.target.value)})} className="h-6 text-[10px] px-1" /></div>
                  <div><label className="text-slate-500">Đi lại / Công</label><Input type="number" value={configRates.transport} onChange={(e) => setConfigRates({...configRates, transport: Number(e.target.value)})} className="h-6 text-[10px] px-1" /></div>
                </div>
              </div>
              <div className="flex gap-2">
                <select className="border rounded-md p-2 text-xs w-full bg-slate-50" value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))}>{[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1}>Tháng {i + 1}</option>))}</select>
                <select className="border rounded-md p-2 text-xs w-full bg-slate-50" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))}>{[2025, 2026, 2027].map((y) => (<option key={y} value={y}>Năm {y}</option>))}</select>
              </div>
              <Button onClick={handleInitMonth} className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 font-bold"><PlayCircle className="w-4 h-4 mr-1" /> Gom Số Liệu Tự Động</Button>
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
          <Tabs defaultValue="board">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-[#0f172a] flex items-center gap-3">
                  Bảng Lương Tháng {selectedMonthDoc.month}/{selectedMonthDoc.year}
                  {selectedMonthDoc.status === "draft" && <Badge variant="secondary" className="bg-amber-100 text-amber-700">Bản Nháp</Badge>}
                  {selectedMonthDoc.status === "approved" && <Badge variant="secondary" className="bg-blue-100 text-blue-700">Đã Khóa Sổ</Badge>}
                  {selectedMonthDoc.status === "paid" && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Hoàn Tất Chi Trả</Badge>}
                </h1>
              </div>
              <TabsList className="bg-white border p-1 rounded-xl shadow-sm">
                <TabsTrigger value="board" className="data-[state=active]:bg-slate-100 shadow-sm font-bold"><Calculator className="w-4 h-4 mr-2" /> Bảng Lương Gross</TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-slate-100 shadow-sm font-bold"><TrendingUp className="w-4 h-4 mr-2" /> Tổng Cục</TabsTrigger>
                <TabsTrigger value="tax" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 shadow-sm font-bold"><Landmark className="w-4 h-4 mr-2" /> Kê Khai Thuế</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="board" className="mt-0">
              <div className="bg-white p-3 rounded-2xl border-none shadow-sm flex flex-wrap gap-4 items-center mb-4">
                <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5"><Filter className="w-4 h-4 text-slate-400" /><select className="bg-transparent text-sm font-medium outline-none cursor-pointer" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option value="ALL">Tất cả phòng ban</option>{departments.map((d) => (<option key={d} value={d}>{d}</option>))}</select></div>
                <div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-xl bg-slate-50 border-slate-200" /></div>
                <div className="flex gap-2 ml-auto items-center">
                  <Button variant="ghost" size="sm" onClick={() => fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year)}><RefreshCcw className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"><FileDown className="w-4 h-4 mr-1" /> Xuất Excel</Button>
                  {selectedMonthDoc.status === "draft" && <Button size="sm" onClick={() => handleToggleStatus("approved")} className="bg-[#0f172a] hover:bg-slate-800 rounded-xl"><Lock className="w-4 h-4 mr-1" /> Khóa Sổ</Button>}
                </div>
              </div>
              {isDataLoading ? (<div className="bg-white h-64 rounded-2xl flex items-center justify-center"><Loader /></div>) : (<TabGrossPayrollTable filteredPayrolls={filteredPayrolls} editingRecords={editingRecords} isClosed={selectedMonthDoc.status !== "draft"} handleInputChange={handleInputChange} handleSaveRow={handleSaveRow} />)}
            </TabsContent>
            

            <TabsContent value="stats"><TabPayrollStats stats={stats} chartData={chartData} /></TabsContent>
            <TabsContent value="tax"><TabTaxSummary monthsList={monthsList} /></TabsContent>
          </Tabs>
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm"><Calculator className="w-20 h-20 mb-4 opacity-20" /><p className="font-bold text-lg uppercase tracking-widest opacity-60">Vui lòng khởi tạo một bảng lương</p></div>
        )}
      </main>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}