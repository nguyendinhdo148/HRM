/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Search, FileDown, Wallet, Filter, CheckCircle2, Lock, Landmark, ChevronLeft, ChevronRight, HandCoins, Calculator, Users, TrendingUp, Banknote, Building2, Loader2, FileSpreadsheet, ClipboardList, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
// Format số có dấu âm: -500.000
const formatNumberWithDotSigned = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  const sign = num < 0 ? "-" : "";
  return sign + Math.abs(num).toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ==========================================
// BỘ LỌC BÁO CÁO
// ==========================================
const ReportFilterBar = ({ 
  reportYear, setReportYear, 
  reportType, setReportType, 
  reportValue, setReportValue, 
  availableYears, 
  onExport 
}: any) => {
  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center w-full shrink-0 mb-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Năm Dữ Liệu</label>
          <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none bg-slate-50 text-slate-700 focus:ring-2 focus:ring-amber-500/20 min-w-[120px]" value={reportYear} onChange={e => setReportYear(Number(e.target.value))}>
            {availableYears.map((y: number) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Phân Loại Lọc</label>
          <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none bg-slate-50 text-slate-700 focus:ring-2 focus:ring-amber-500/20 min-w-[150px]" value={reportType} onChange={e => setReportType(e.target.value)}>
            <option value="MONTH">Theo Tháng</option>
            <option value="QUARTER">Theo Quý</option>
            <option value="YEAR">Cả Năm</option>
          </select>
        </div>
        {reportType !== "YEAR" && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              {reportType === "MONTH" ? "Chọn Tháng" : "Chọn Quý"}
            </label>
            <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none bg-slate-50 text-slate-700 focus:ring-2 focus:ring-amber-500/20 min-w-[120px]" value={reportValue} onChange={e => setReportValue(Number(e.target.value))}>
              {reportType === "MONTH"
                ? [...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)
                : [...Array(4)].map((_, i) => <option key={i+1} value={i+1}>Quý {i+1}</option>)
              }
            </select>
          </div>
        )}
      </div>
      {onExport && (
        <div className="mt-4 md:mt-0">
          <Button onClick={onExport} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-[42px] px-6 transition-all shadow-sm">
            <FileSpreadsheet className="w-5 h-5 mr-2"/> XUẤT EXCEL CHUẨN SỐ
          </Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STATS
// ==========================================
const TabPayrollStats = ({ reportData, filterProps }: any) => {
  const stats = useMemo(() => {
    return reportData.reduce((acc: any, curr: any) => {
      acc.gross += curr.totalGross;
      acc.net += curr.accountingNet;
      acc.adjustment += curr.adjustment || 0;
      acc.finalPayment += curr.finalPayment || 0;
      return acc;
    }, { gross: 0, net: 0, adjustment: 0, finalPayment: 0 });
  }, [reportData]);

  const chartData = useMemo(() => {
    return [...reportData]
      .sort((a, b) => b.accountingNet - a.accountingNet)
      .slice(0, 15)
      .map((p) => ({
        name: p.fullName?.split(" ").pop() || "N/A",
        NetSalary: p.accountingNet || 0
      }));
  }, [reportData]);

  return (
    <div className="flex flex-col h-full animate-in fade-in-50 pb-2">
      <ReportFilterBar {...filterProps} />
      
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-600 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Nhân sự (Tổng)</div><div className="text-3xl font-black text-slate-800">{reportData.length} <span className="text-sm">người</span></div></CardContent></Card>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Gross</div><div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.gross)}</div></CardContent></Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Kế Toán (Net Gốc)</div><div className="text-2xl font-black text-amber-600">{formatCurrency(stats.net)}</div></CardContent></Card>
          <Card className="border-l-4 border-l-rose-500 shadow-sm"><CardContent className="p-5"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Thanh Toán CK</div><div className="text-2xl font-black text-rose-600">{formatCurrency(stats.finalPayment)}</div></CardContent></Card>
        </div>
        <Card className="p-6 border shadow-sm bg-white">
          <CardHeader className="px-0 pt-0 border-b mb-6 pb-4 flex flex-row items-center justify-between">
            <div><CardTitle className="text-lg font-bold flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Biểu Đồ Thực Lĩnh </CardTitle><CardDescription>Top 15 nhân sự có thu nhập gốc cao nhất kỳ báo cáo</CardDescription></div>
          </CardHeader>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: number) => [formatCurrency(val), "Thực lĩnh "]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="NetSalary" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// TAX SUMMARY
// ==========================================
const TabTaxSummary = ({ reportData, isReportingFetching, filterProps }: any) => {
  const totals = useMemo(() => {
    return reportData.reduce((acc: any, curr: any) => {
      acc.actualDays += curr.actualDays;
      acc.timeSalary += curr.timeSalary;
      acc.overtime += curr.overtime;
      acc.miniShowMoney += curr.miniShowMoney;
      acc.bigShowMoney += curr.bigShowMoney;
      acc.kpiBonus += curr.kpiBonus;
      acc.meal += curr.meal;
      acc.transport += curr.transport;
      acc.phone += curr.phone;
      acc.clothing += curr.clothing;
      acc.housing += curr.housing;
      acc.bonus += curr.bonus;
      acc.gross += curr.totalGross;
      acc.advance += curr.advance;
      acc.taxTNCN += curr.taxTNCN;
      acc.deductions += curr.accountingDeductions;
      acc.net += curr.accountingNet;
      acc.adjustment += curr.adjustment || 0;
      acc.finalPayment += curr.finalPayment || 0;
      return acc;
    }, { 
      actualDays: 0, timeSalary: 0, overtime: 0, miniShowMoney: 0, bigShowMoney: 0, kpiBonus: 0,
      meal: 0, transport: 0, phone: 0, clothing: 0, housing: 0, bonus: 0,
      gross: 0, advance: 0, taxTNCN: 0, deductions: 0, net: 0, adjustment: 0, finalPayment: 0 
    });
  }, [reportData]);

  const handleExportTaxExcel = () => {
    if (reportData.length === 0) return alert("Không có dữ liệu để xuất");
    
    const wb = XLSX.utils.book_new();
    const { reportType, reportValue, reportYear } = filterProps;
    let periodLabel = "";
    if (reportType === "MONTH") periodLabel = `THÁNG ${reportValue}`;
    else if (reportType === "QUARTER") periodLabel = `QUÝ ${reportValue}`;
    else periodLabel = `CẢ NĂM`;
    
    const titleRow = [`BẢNG KÊ TỔNG HỢP CHI PHÍ THU NHẬP (GỐC KẾ TOÁN) - ${periodLabel} - NĂM ${reportYear}`];
    const emptyRow = [""];
    
    const headers = [
      "STT", "Mã NV", "Họ và tên", "Chức vụ", "Phòng ban", 
      "Tổng Ngày Công", "Lương Thời Gian", "Làm Thêm Giờ", 
      "Mini Show", "Big Show", "Thưởng N.Công", 
      "Tiền Ăn Ca", "Xăng Xe", "Điện Thoại", "Trang Phục", "Nhà Ở", 
      "Thưởng Mới", "TỔNG GROSS", 
      "Tạm Ứng", "Thuế TNCN (100% Gốc)", "Tổng Khấu Trừ", "THỰC LĨNH",
      "ĐIỀU CHỈNH CP KHÁC", "TỔNG THANH TOÁN CK"
    ];
    
    const dataRows = reportData.map((d: any, i: number) => [
      Number(i + 1), d.employeeCode, d.fullName, d.position, d.department,
      Number(d.actualDays) || 0, Number(d.timeSalary) || 0, Number(d.overtime) || 0, 
      Number(d.miniShowMoney) || 0, Number(d.bigShowMoney) || 0, Number(d.kpiBonus) || 0, 
      Number(d.meal) || 0, Number(d.transport) || 0, Number(d.phone) || 0, Number(d.clothing) || 0, Number(d.housing) || 0, 
      Number(d.bonus) || 0, Number(d.totalGross) || 0, 
      Number(d.advance) || 0, Number(d.taxTNCN) || 0, Number(d.accountingDeductions) || 0, Number(d.accountingNet) || 0,
      Number(d.adjustment) || 0, Number(d.finalPayment) || 0
    ]);

    const totalRow = [
      "", "", "TỔNG CỘNG", "", "", 
      Number(totals.actualDays) || 0, Number(totals.timeSalary) || 0, Number(totals.overtime) || 0, 
      Number(totals.miniShowMoney) || 0, Number(totals.bigShowMoney) || 0, Number(totals.kpiBonus) || 0, 
      Number(totals.meal) || 0, Number(totals.transport) || 0, Number(totals.phone) || 0, Number(totals.clothing) || 0, Number(totals.housing) || 0, 
      Number(totals.bonus) || 0, Number(totals.gross) || 0, 
      Number(totals.advance) || 0, Number(totals.taxTNCN) || 0, Number(totals.deductions) || 0, Number(totals.net) || 0,
      Number(totals.adjustment) || 0, Number(totals.finalPayment) || 0
    ];

    const wsData = [titleRow, emptyRow, headers, ...dataRows, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }]; 
    
    ws["A1"].s = {
      font: { name: "Arial", sz: 14, bold: true, color: { rgb: "003366" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    for (let r = 2; r <= 3 + dataRows.length; r++) { 
      const isTotalRow = r === 3 + dataRows.length;
      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        
        if (r === 2) {
          ws[cellRef].s = {
            fill: { fgColor: { rgb: "003366" } },
            font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        } else {
          ws[cellRef].s = {
            font: { name: "Arial", sz: 11, bold: isTotalRow }, 
            fill: isTotalRow ? { fgColor: { rgb: "FFF2CC" } } : undefined, 
            border: {
              top: { style: "thin", color: { rgb: "DDDDDD" } }, bottom: { style: "thin", color: { rgb: "DDDDDD" } },
              left: { style: "thin", color: { rgb: "DDDDDD" } }, right: { style: "thin", color: { rgb: "DDDDDD" } }
            },
            alignment: { vertical: "center", horizontal: (c >= 5 ? "right" : (c === 0 ? "center" : "left")) }
          };

          if (typeof ws[cellRef].v === 'number') {
            ws[cellRef].t = 'n';
            if (c >= 6) {
              ws[cellRef].s.numFmt = "#,##0";
            }
          }
        }
      }
    }

    ws["!cols"] = [
      { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, 
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, 
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, 
      { wch: 14 }, { wch: 16 }, 
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke_Thue_Ke_Toan");
    XLSX.writeFile(wb, `ThongKeThue_KeToan_${periodLabel}_${reportYear}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in-50 pb-2">
      <ReportFilterBar {...filterProps} onExport={handleExportTaxExcel} />

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white flex-1 min-h-0 flex flex-col">
        <div className="w-full h-full overflow-auto custom-scrollbar relative">
          <table className="w-full text-[11px] border-collapse min-w-[2450px]">
            <thead className="bg-[#003366] text-white">
              <tr className="h-[40px]">
                <th rowSpan={2} className="p-2 sticky left-0 top-0 bg-[#003366] z-[60] border-r border-b border-slate-600 text-center w-[45px]">STT</th>
                <th rowSpan={2} className="p-2 sticky left-[45px] top-0 bg-[#003366] z-[60] border-r border-b border-slate-600 text-left w-[180px] shadow-[4px_0_10px_rgba(0,0,0,0.3)]">Thông tin NV</th>
                <th rowSpan={2} className="p-2 border-r border-b border-slate-600 min-w-[100px] sticky top-0 z-[50] bg-[#003366]">Phòng ban</th>
                <th colSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1e40af] text-center sticky top-0 z-[50]">Lương Thời Gian</th>
                <th rowSpan={2} className="p-2 border-r border-b border-slate-600 bg-[#1d4ed8] text-center sticky top-0 z-[50] w-[90px]">Làm Thêm</th>
                <th colSpan={3} className="p-2 border-r border-b border-slate-600 bg-[#6b21a8] text-center sticky top-0 z-[50]">Hiệu Suất (Show & Công)</th>
                <th colSpan={6} className="p-2 border-r border-b border-slate-600 bg-[#0f766e] text-center sticky top-0 z-[50]">Các Khoản Phụ Cấp & Thưởng</th>
                <th rowSpan={2} className="p-2 bg-[#064e3b] text-emerald-300 font-black text-xs w-[110px] text-center sticky top-0 z-[50] border-r border-b border-slate-600">TỔNG GROSS</th>
                <th colSpan={3} className="p-2 border-r border-b border-slate-600 bg-slate-800 text-center sticky top-0 z-[50]">Các Khoản Khấu Trừ Gốc</th>
                <th rowSpan={2} className="p-2 bg-amber-700 text-white font-black text-sm w-[130px] text-right sticky top-0 z-[50] border-r border-b border-amber-800">THỰC LĨNH</th>
                <th rowSpan={2} className="p-2 bg-orange-800 text-white font-black text-xs w-[140px] text-right sticky top-0 z-[50] border-r border-b border-orange-900">ĐIỀU CHỈNH CP KHÁC</th>
                <th rowSpan={2} className="p-2 bg-indigo-800 text-white font-black text-sm w-[150px] text-right sticky right-0 top-0 z-[60] shadow-[-4px_0_10px_rgba(0,0,0,0.3)] border-b border-indigo-900">TỔNG THANH TOÁN CK</th>
              </tr>
              <tr className="h-[32px] bg-slate-800 text-[10px] text-center text-slate-300">
                <th className="p-1 border-r border-b border-slate-600 text-white sticky top-[40px] bg-slate-800 z-[50] w-[60px]">N.Công</th>
                <th className="p-1 border-r border-b border-slate-600 text-blue-300 sticky top-[40px] bg-slate-800 z-[50] w-[90px]">Thành tiền</th>
                <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Mini Show</th>
                <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Big Show</th>
                <th className="p-1 border-r border-b border-slate-600 text-[#d8b4fe] sticky top-[40px] bg-slate-800 z-[50] w-[90px]">Thưởng N.C</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Tiền ăn</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Xăng xe</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Đ.Thoại</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Phục trang</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[80px]">Nhà ở</th>
                <th className="p-1 border-r border-b border-slate-600 text-teal-300 font-bold sticky top-[40px] bg-slate-800 z-[50] w-[90px]">Thưởng Mới</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[85px]">Tạm Ứng</th>
                <th className="p-1 border-r border-b border-slate-600 sticky top-[40px] bg-slate-800 z-[50] w-[85px]">Thuế TNCN</th>
                <th className="p-1 border-r border-b border-slate-600 text-rose-300 font-bold sticky top-[40px] bg-slate-800 z-[50] w-[95px]">Tổng Trừ</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isReportingFetching ? (
                <tr><td colSpan={24} className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2"/><div className="text-slate-400 font-medium">Đang tổng hợp dữ liệu kế toán...</div></td></tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={24} className="p-20 text-center flex-col items-center justify-center">
                    <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <div className="text-slate-500 font-medium text-base">Chưa có dữ liệu cho kỳ báo cáo này.</div>
                  </td>
                </tr>
              ) : reportData.map((d: any, i: number) => {
                const rowBg = i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]";
                return (
                  <tr key={d.employeeCode} className={`${rowBg} hover:bg-amber-50/50 transition-colors`}>
                    <td className={`p-2 text-center font-medium text-slate-500 sticky left-0 z-[40] ${rowBg} border-r border-b border-slate-200`}>{i + 1}</td>
                    <td className={`p-2 sticky left-[45px] z-[40] ${rowBg} border-r border-b border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.06)]`}>
                      <div className="font-bold text-slate-800 truncate w-[160px]" title={d.fullName}>{d.fullName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{d.employeeCode} • {d.position}</div>
                    </td>
                    <td className="p-2 text-slate-600 border-r border-b border-slate-200"><Badge variant="outline" className="bg-white text-[10px]">{d.department}</Badge></td>
                    
                    <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/30 border-r border-b border-slate-200">{d.actualDays}</td>
                    <td className="p-2 text-right font-bold text-blue-800 bg-blue-50/30 border-r border-b border-slate-200">{formatNumberWithDot(d.timeSalary)}</td>
                    <td className="p-2 text-right font-bold text-indigo-700 bg-indigo-50/30 border-r border-b border-slate-200">{formatNumberWithDot(d.overtime)}</td>
                    
                    <td className="p-2 text-right font-bold text-purple-700 bg-purple-50/20 border-r border-b border-slate-200">{formatNumberWithDot(d.miniShowMoney)}</td>
                    <td className="p-2 text-right font-bold text-purple-700 bg-purple-50/20 border-r border-b border-slate-200">{formatNumberWithDot(d.bigShowMoney)}</td>
                    <td className="p-2 text-right font-bold text-purple-800 bg-purple-100/30 border-r border-b border-slate-200">{formatNumberWithDot(d.kpiBonus)}</td>

                    <td className="p-2 text-right text-emerald-600 border-r border-b border-slate-200">{formatNumberWithDot(d.meal)}</td>
                    <td className="p-2 text-right text-emerald-600 border-r border-b border-slate-200">{formatNumberWithDot(d.transport)}</td>
                    <td className="p-2 text-right text-emerald-600 border-r border-b border-slate-200">{formatNumberWithDot(d.phone)}</td>
                    <td className="p-2 text-right text-emerald-600 border-r border-b border-slate-200">{formatNumberWithDot(d.clothing)}</td>
                    <td className="p-2 text-right text-emerald-600 border-r border-b border-slate-200">{formatNumberWithDot(d.housing)}</td>
                    <td className="p-2 text-right text-teal-600 border-r border-b border-slate-200 font-bold">{formatNumberWithDot(d.bonus)}</td>

                    <td className="p-2 text-right font-black text-emerald-700 bg-emerald-50 border-r border-b border-slate-200">{formatNumberWithDot(d.totalGross)}</td>
                    <td className="p-2 text-right text-slate-600 border-r border-b border-slate-200">{formatNumberWithDot(d.advance)}</td>
                    <td className="p-2 text-right font-bold text-amber-600 bg-amber-50/10 border-r border-b border-slate-200" title="Thuế phát sinh gốc">{formatNumberWithDot(d.taxTNCN)}</td>
                    <td className="p-2 text-right font-bold text-rose-700 bg-rose-50/30 border-r border-b border-slate-200">{formatNumberWithDot(d.accountingDeductions)}</td>
                    <td className="p-2 text-right font-black text-amber-900 bg-amber-50 text-[13px] border-r border-b border-slate-200">{formatNumberWithDot(d.accountingNet)}</td>
                    <td className="p-2 text-right font-bold text-orange-700 bg-orange-50/30 border-r border-b border-slate-200">{formatNumberWithDotSigned(d.adjustment || 0)}</td>
                    <td className="p-2 text-right font-black text-indigo-900 bg-indigo-50 text-[13px] sticky right-0 z-[40] shadow-[-4px_0_8px_rgba(0,0,0,0.06)] border-l border-b border-indigo-200">{formatNumberWithDot(d.finalPayment || 0)}</td>
                  </tr>
                );
              })}
              {reportData.length > 0 && (
                <tr className="bg-slate-800 text-white font-bold sticky bottom-0 z-[50]">
                  <td colSpan={3} className="p-2 text-center border-r border-slate-600 sticky left-0 z-[60] bg-slate-800">TỔNG CỘNG</td>
                  <td className="p-2 text-center border-r border-slate-600 text-blue-300">{totals.actualDays}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-blue-300">{formatNumberWithDot(totals.timeSalary)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-indigo-300">{formatNumberWithDot(totals.overtime)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-purple-300">{formatNumberWithDot(totals.miniShowMoney)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-purple-300">{formatNumberWithDot(totals.bigShowMoney)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-purple-300">{formatNumberWithDot(totals.kpiBonus)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.meal)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.transport)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.phone)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.clothing)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.housing)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-teal-300">{formatNumberWithDot(totals.bonus)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-emerald-400 font-black">{formatNumberWithDot(totals.gross)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-slate-300">{formatNumberWithDot(totals.advance)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-amber-400 font-black">{formatNumberWithDot(totals.taxTNCN)}</td>
                  <td className="p-2 text-right border-r border-slate-600 text-rose-300 font-black">{formatNumberWithDot(totals.deductions)}</td>
                  <td className="p-2 text-right text-amber-300 font-black border-r border-slate-600">{formatNumberWithDot(totals.net)}</td>
                  <td className="p-2 text-right text-orange-300 font-black border-r border-slate-600">{formatNumberWithDotSigned(totals.adjustment)}</td>
                  <td className="p-2 text-right text-indigo-300 font-black sticky right-0 z-[60] bg-slate-800 border-l border-slate-600 shadow-[-4px_0_8px_rgba(0,0,0,0.5)]">{formatNumberWithDot(totals.finalPayment)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==========================================
// EMPLOYEE SUMMARY
// ==========================================
const TabEmployeeSummary = ({ reportData, isReportingFetching, filterProps }: any) => {
  const totals = useMemo(() => {
    return reportData.reduce((acc: any, curr: any) => {
      acc.gross += curr.totalGross;
      acc.advance += curr.advance;
      acc.employeeNet += curr.employeeNet;
      acc.adjustment += curr.adjustment || 0;
      acc.finalPayment += curr.finalPayment || 0;
      return acc;
    }, { gross: 0, advance: 0, employeeNet: 0, adjustment: 0, finalPayment: 0 });
  }, [reportData]);

  const handleExportEmployeeSummaryExcel = () => {
    if (reportData.length === 0) return alert("Không có dữ liệu để xuất");
    
    const wb = XLSX.utils.book_new();
    const { reportType, reportValue, reportYear } = filterProps;
    let periodLabel = "";
    if (reportType === "MONTH") periodLabel = `THÁNG ${reportValue}`;
    else if (reportType === "QUARTER") periodLabel = `QUÝ ${reportValue}`;
    else periodLabel = `CẢ NĂM`;
    
    const FONT = { name: "Times New Roman", sz: 11 };
    const BORDER = { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } };
    
    const titleStyle = { font: { name: "Times New Roman", sz: 14, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
    const headerStyle = { font: { ...FONT, bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, fill: { fgColor: { rgb: "D9E1F2" } }, border: BORDER };
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRightBold = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };

    const wsData: any[][] = [];
    wsData.push([{ v: `BẢNG TỔNG HỢP THỰC NHẬN NHÂN VIÊN - ${periodLabel} - NĂM ${reportYear}`, s: titleStyle }]);
    wsData.push([{ v: "Phúc lợi: Công ty hỗ trợ 100% Thuế TNCN.", s: { font: { ...FONT, italic: true, color: { rgb: "FF0000" } } } }]);
    wsData.push([]);

    wsData.push([
      { v: "STT", s: headerStyle }, { v: "Mã NV", s: headerStyle }, { v: "Họ và tên", s: headerStyle }, { v: "Bộ phận", s: headerStyle },
      { v: "Tổng Thu Nhập (Gross)", s: headerStyle }, { v: "Tạm Ứng", s: headerStyle }, 
      { v: "Thuế TNCN", s: headerStyle },
      { v: "THỰC NHẬN CHUYỂN KHOẢN", s: headerStyle },
      { v: "ĐIỀU CHỈNH CP KHÁC", s: headerStyle },
      { v: "TỔNG THANH TOÁN CK", s: headerStyle }
    ]);

    reportData.forEach((d: any, index: number) => {
      wsData.push([
        { v: Number(index + 1), s: cellCenter }, 
        { v: d.employeeCode || "", s: cellCenter }, 
        { v: d.fullName || "", s: cellLeft }, 
        { v: d.department || "", s: cellCenter },
        { v: Number(d.totalGross) || 0, s: {} },
        { v: Number(d.advance) || 0, s: {} },
        { v: 0, s: {} }, 
        { v: Number(d.employeeNet) || 0, s: { ...cellRightBold, font: { ...FONT, bold: true, color: { rgb: "9C0006" } }, fill: { fgColor: { rgb: "FFC7CE" } } } },
        { v: Number(d.adjustment) || 0, s: {} },
        { v: Number(d.finalPayment) || 0, s: { ...cellRightBold, fill: { fgColor: { rgb: "DBEAFE" } }, font: { ...FONT, bold: true, color: { rgb: "1E3A8A" } } } }
      ]);
    });

    const totalRow = [
      { v: "", s: cellCenter }, { v: "", s: cellCenter }, { v: "TỔNG CỘNG", s: { ...cellLeft, font: { ...FONT, bold: true } } }, { v: "", s: cellCenter },
      { v: Number(totals.gross) || 0, s: cellRightBold },
      { v: Number(totals.advance) || 0, s: cellRightBold },
      { v: 0, s: cellRightBold },
      { v: Number(totals.employeeNet) || 0, s: { ...cellRightBold, fill: { fgColor: { rgb: "FFC7CE" } }, font: { ...FONT, bold: true, color: { rgb: "9C0006" } } } },
      { v: Number(totals.adjustment) || 0, s: cellRightBold },
      { v: Number(totals.finalPayment) || 0, s: { ...cellRightBold, fill: { fgColor: { rgb: "DBEAFE" } }, font: { ...FONT, bold: true, color: { rgb: "1E3A8A" } } } }
    ];
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }];
    ws["!cols"] = [{ wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 14 }, { wch: 15 }, { wch: 26 }, { wch: 20 }, { wch: 22 }];

    for (let r = 3; r < wsData.length; r++) {
      for (let c = 0; c <= 9; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;

        if (typeof ws[cellRef].v === 'number') {
          ws[cellRef].t = 'n';
          if (c >= 4) {
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.numFmt = "#,##0";
            if(r < wsData.length - 1 && c !== 7 && c !== 9) {
               ws[cellRef].s.font = FONT;
               ws[cellRef].s.alignment = { horizontal: "right", vertical: "center" };
               ws[cellRef].s.border = BORDER;
            }
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke_Nhan_Vien");
    XLSX.writeFile(wb, `ThongKe_ThucNhan_NhanVien_${periodLabel}_${reportYear}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in-50 pb-2">
      <ReportFilterBar {...filterProps} onExport={handleExportEmployeeSummaryExcel} />

      <Card className="flex-1 overflow-hidden border-none rounded-2xl bg-white shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto h-full custom-scrollbar relative">
          <table className="w-full text-xs border-collapse min-w-[1250px] bg-white">
            <thead className="bg-[#1e293b] text-white sticky top-0 z-30">
              <tr className="h-[44px]">
                <th className="p-3 text-center w-[60px] border-b border-slate-700">STT</th>
                <th className="p-3 text-center w-[110px] border-b border-slate-700">Mã NV</th>
                <th className="p-3 text-left sticky left-0 bg-[#1e293b] z-20 w-[180px] border-b border-slate-700">Họ và tên</th>
                <th className="p-3 text-center w-[130px] border-b border-slate-700">Bộ phận</th>
                <th className="p-3 text-right text-emerald-300 w-[160px] border-b border-slate-700">Tổng Thu Nhập</th>
                <th className="p-3 text-right text-rose-300 w-[130px] border-b border-slate-700">Tạm Ứng</th>
                <th className="p-3 text-right text-rose-300 w-[130px] border-b border-slate-700">Thuế TNCN</th>
                <th className="p-3 text-right text-amber-300 w-[150px] bg-slate-900 font-bold border-b border-slate-950">Thực Nhận</th>
                <th className="p-3 text-right text-orange-300 w-[150px] border-b border-slate-700">Điều Chỉnh CP Khác</th>
                <th className="p-3 text-right text-indigo-300 w-[160px] bg-indigo-900 font-bold border-b border-indigo-950">Tổng Thanh Toán CK</th>
              </tr>
            </thead>
            <tbody>
              {isReportingFetching ? (
                <tr><td colSpan={10} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2"/><div className="text-slate-400 font-medium">Đang tổng hợp dữ liệu nhân viên...</div></td></tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-20 text-center flex-col items-center justify-center">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <div className="text-slate-500 font-medium text-base">Chưa có dữ liệu cho kỳ báo cáo này.</div>
                  </td>
                </tr>
              ) : reportData.map((d: any, idx: number) => {
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                return (
                  <tr key={d.employeeCode} className={`${rowBg} hover:bg-emerald-50/40 transition-colors`}>
                    <td className="p-3 text-center border-b border-slate-100 text-slate-400">{idx + 1}</td>
                    <td className="p-3 text-center border-b border-slate-100 font-mono font-medium text-slate-600">{d.employeeCode}</td>
                    <td className={`p-3 border-b border-slate-100 font-bold text-slate-800 sticky left-0 ${rowBg} z-10`}>{d.fullName}</td>
                    <td className="p-3 text-center border-b border-slate-100 text-slate-600">{d.department}</td>
                    <td className="p-3 text-right border-b border-slate-100 font-medium">{formatNumberWithDot(d.totalGross)}</td>
                    <td className="p-3 text-right border-b border-slate-100 text-rose-600">{formatNumberWithDot(d.advance)}</td>
                    <td className="p-3 text-right border-b border-slate-100 font-bold text-slate-400">
                      <span className="text-slate-400 text-xs">0 đ</span>
                    </td>
                    <td className="p-3 text-right border-b border-slate-100 font-black text-emerald-700 bg-emerald-50/30 text-sm">
                      {formatNumberWithDot(d.employeeNet)}
                    </td>
                    <td className="p-3 text-right border-b border-slate-100 font-bold text-orange-700 bg-orange-50/30">
                      {formatNumberWithDotSigned(d.adjustment || 0)}
                    </td>
                    <td className="p-3 text-right border-b border-slate-100 font-black text-indigo-700 bg-indigo-50/30 text-sm">
                      {formatNumberWithDot(d.finalPayment || 0)}
                    </td>
                  </tr>
                );
              })}
              {reportData.length > 0 && (
                <tr className="bg-slate-800 text-white font-bold sticky bottom-0 z-[50]">
                  <td colSpan={3} className="p-3 text-center border-r border-slate-600 sticky left-0 z-[60] bg-slate-800">TỔNG CỘNG</td>
                  <td className="p-3 text-center border-r border-slate-600"></td>
                  <td className="p-3 text-right border-r border-slate-600 text-emerald-300">{formatNumberWithDot(totals.gross)}</td>
                  <td className="p-3 text-right border-r border-slate-600 text-rose-300">{formatNumberWithDot(totals.advance)}</td>
                  <td className="p-3 text-right border-r border-slate-600 text-slate-400">0 đ</td>
                  <td className="p-3 text-right text-amber-300 font-black bg-slate-900 border-r border-slate-600">{formatNumberWithDot(totals.employeeNet)}</td>
                  <td className="p-3 text-right text-orange-300 font-black border-r border-slate-600">{formatNumberWithDotSigned(totals.adjustment)}</td>
                  <td className="p-3 text-right text-indigo-300 font-black bg-indigo-900">{formatNumberWithDot(totals.finalPayment)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// =========================================================================
// MAIN
// =========================================================================
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

  // State cho điều chỉnh CP khác (nhập tay)
  const [editingAdjustments, setEditingAdjustments] = useState<{ [payrollId: string]: number }>({});
  const [savingIds, setSavingIds] = useState<{ [payrollId: string]: boolean }>({});

  // ===== STATE TOAST =====
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<string>("MONTH");
  const [reportValue, setReportValue] = useState<number>(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isReportingFetching, setIsReportingFetching] = useState(false);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(monthsList.map(m => m.year)));
    return years.length > 0 ? years.sort((a, b) => b - a) : [new Date().getFullYear()];
  }, [monthsList]);

  const fetchMonthsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/months`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMonthsList(data);
        if (data.length > 0 && !selectedMonthDoc) {
          setSelectedMonthDoc(data[0]);
          if (!availableYears.includes(reportYear)) setReportYear(data[0].year);
        }
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
        setEditingAdjustments({});
      }
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  const fetchReportData = async () => {
    setIsReportingFetching(true);
    try {
      let targetMonths: number[] = [];
      if (reportType === "MONTH") targetMonths = [reportValue];
      else if (reportType === "QUARTER") {
        if (reportValue === 1) targetMonths = [1, 2, 3];
        else if (reportValue === 2) targetMonths = [4, 5, 6];
        else if (reportValue === 3) targetMonths = [7, 8, 9];
        else if (reportValue === 4) targetMonths = [10, 11, 12];
      } else if (reportType === "YEAR") {
        targetMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      }

      const promises = targetMonths.map(m =>
        fetch(`${API_BASE_URL}?month=${m}&year=${reportYear}`, { headers: getAuthHeaders() })
          .then(res => res.json().catch(() => null))
      );
      
      const results = await Promise.all(promises);
      const map: { [code: string]: any } = {};

      results.forEach(res => {
        if (res && res.records) {
          res.records.forEach((p: any) => {
            const snap = p.employeeSnapshot;
            if (!snap) return;
            const code = snap.employeeCode;
            
            if (!map[code]) {
              map[code] = {
                employeeCode: code,
                fullName: snap.fullName,
                department: snap.department,
                position: snap.position,
                actualDays: 0, timeSalary: 0, overtime: 0, miniShowMoney: 0, bigShowMoney: 0, kpiBonus: 0,
                meal: 0, transport: 0, phone: 0, clothing: 0, housing: 0, bonus: 0,
                totalGross: 0, advance: 0, taxTNCN: 0,
                accountingDeductions: 0, accountingNet: 0,
                employeeNet: 0,
                adjustment: 0,
                finalPayment: 0
              };
            }
            
            const allw = p.incomes?.allowances || {};
            const ded = p.deductions || {};

            map[code].actualDays += Number(p.actualDays || 0);
            map[code].timeSalary += Number(p.incomes?.timeSalary || 0);
            map[code].overtime += Number(p.incomes?.overtime || 0);
            map[code].miniShowMoney += Number(p.incomes?.miniShowMoney || 0);
            map[code].bigShowMoney += Number(p.incomes?.bigShowMoney || 0);
            map[code].kpiBonus += Number(p.incomes?.kpiBonus || 0);
            map[code].meal += Number(allw.meal || 0);
            map[code].transport += Number(allw.transport || 0);
            map[code].phone += Number(allw.phone || 0);
            map[code].clothing += Number(allw.clothing || 0);
            map[code].housing += Number(allw.housing || 0);
            map[code].bonus += Number(p.incomes?.bonus || 0);

            const gross = Number(p.incomes?.totalGross || 0);
            const advance = Number(ded.advance || 0);

            map[code].totalGross += gross;
            map[code].advance += advance;
            map[code].taxTNCN += Number(ded.taxTNCN || 0);

            // Cộng dồn điều chỉnh CP khác
            map[code].adjustment += Number(p.incomes?.adjustment || 0);

            // Thực nhận nhân viên = Gross - Tạm ứng
            map[code].employeeNet += (gross - advance);
          });
        }
      });

      const finalData = Object.values(map).map((d: any) => {
        // Tổng khấu trừ gốc = Tạm ứng + Thuế
        d.accountingDeductions = d.advance + d.taxTNCN;
        d.accountingNet = d.totalGross - d.accountingDeductions;
        // Tổng thanh toán CK = Thực lĩnh + Điều chỉnh CP khác
        d.finalPayment = d.accountingNet + d.adjustment;
        return d;
      });

      finalData.sort((a: any, b: any) => b.totalGross - a.totalGross);
      setReportData(finalData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsReportingFetching(false);
    }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { if (selectedMonthDoc) fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year); }, [selectedMonthDoc]);
  
  useEffect(() => {
    if (reportYear && reportType && reportValue) {
      fetchReportData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportYear, reportType, reportValue]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const snap = p.employeeSnapshot;
      if (!snap) return false;
      const nameMatch = snap.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || snap.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = deptFilter === "ALL" || snap.department === deptFilter;
      return nameMatch && deptMatch;
    });
  }, [payrolls, searchQuery, deptFilter]);

  // ===== LƯU ĐIỀU CHỈNH CP KHÁC CHO 1 NHÂN SỰ =====
  const handleSaveAdjustment = async (payrollId: string) => {
    const value = editingAdjustments[payrollId];
    if (value === undefined) return;
    
    setSavingIds(prev => ({ ...prev, [payrollId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/${payrollId}/adjustment`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ adjustment: value })
      });
      
      if (res.ok) {
        // ===== CẬP NHẬT LOCAL STATE — KHÔNG FETCH LẠI =====
        const matchedPayroll = payrolls.find(p => p._id === payrollId);
        const oldAdjustment = Number(matchedPayroll?.incomes?.adjustment || 0);

        // Cập nhật payrolls local
        setPayrolls(prev => prev.map(p => {
          if (p._id === payrollId) {
            return {
              ...p,
              incomes: {
                ...p.incomes,
                adjustment: value
              }
            };
          }
          return p;
        }));
        
        // Cập nhật reportData local
        if (matchedPayroll) {
          const empCode = matchedPayroll.employeeSnapshot?.employeeCode;
          setReportData(prev => prev.map(d => {
            if (d.employeeCode === empCode) {
              const newAdjustment = d.adjustment + (value - oldAdjustment);
              return {
                ...d,
                adjustment: newAdjustment,
                finalPayment: d.accountingNet + newAdjustment
              };
            }
            return d;
          }));
        }
        
        // Xóa khỏi editingAdjustments (đã lưu thành công)
        setEditingAdjustments(prev => {
          const next = { ...prev };
          delete next[payrollId];
          return next;
        });
        
        showToast("Đã lưu điều chỉnh thành công!");
      } else {
        showToast("Lỗi lưu điều chỉnh", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi kết nối", "error");
    } finally {
      setSavingIds(prev => {
        const next = { ...prev };
        delete next[payrollId];
        return next;
      });
    }
  };

  // ==========================================
  // XUẤT EXCEL FULL
  // ==========================================
  const handleExportExcelFull = () => {
    if (filteredPayrolls.length === 0) return alert("Không có dữ liệu để xuất");
    const m = selectedMonthDoc?.month;
    const y = selectedMonthDoc?.year;
    
    const FONT = { name: "Arial", sz: 10 };
    const BORDER = { top: { style: "thin", color: { rgb: "CCCCCC" } }, bottom: { style: "thin", color: { rgb: "CCCCCC" } }, left: { style: "thin", color: { rgb: "CCCCCC" } }, right: { style: "thin", color: { rgb: "CCCCCC" } } };
    
    const titleStyle = { font: { name: "Arial", sz: 14, bold: true, color: { rgb: "003366" } }, alignment: { horizontal: "center", vertical: "center" } };
    const headerMainStyle = { font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "003366" } }, border: BORDER, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
    const headerSubStyle = { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "333333" } }, fill: { fgColor: { rgb: "F2F2F2" } }, border: BORDER, alignment: { horizontal: "center", vertical: "center" } };
    
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRightBold = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };

    const wsData: any[][] = [];
    wsData.push([{ v: `BẢNG TỔNG HỢP CHI TIẾT THU NHẬP & TRÍCH TRỪ KẾ TOÁN - THÁNG ${m}/${y}`, s: titleStyle }]);
    wsData.push([]);
    
    wsData.push([
      { v: "STT", s: headerMainStyle }, { v: "Mã NV", s: headerMainStyle }, { v: "Họ và tên", s: headerMainStyle }, { v: "Bộ phận", s: headerMainStyle }, { v: "Chức vụ", s: headerMainStyle },
      { v: "Lương CV", s: headerMainStyle }, { v: "Lương Thời Gian", s: headerMainStyle }, { v: "Lương Thời Gian", s: headerMainStyle }, { v: "Làm Thêm Giờ", s: headerMainStyle },
      { v: "Hiệu Suất (Show & Công)", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle },
      { v: "Các Khoản Phụ Cấp", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle },
      { v: "Thưởng Mới", s: headerMainStyle }, { v: "TỔNG GROSS", s: headerMainStyle },
      { v: "Các Khoản Trích Trừ Vào Lương (Sổ Sách Gốc)", s: headerMainStyle }, { v: "", s: headerMainStyle }, { v: "", s: headerMainStyle },
      { v: "THỰC LĨNH", s: headerMainStyle },
      { v: "ĐIỀU CHỈNH CP KHÁC", s: headerMainStyle },
      { v: "TỔNG THANH TOÁN CK", s: headerMainStyle }
    ]);

    wsData.push([
      { v: "", s: headerSubStyle }, { v: "", s: headerSubStyle }, { v: "", s: headerSubStyle }, { v: "", s: headerSubStyle }, { v: "", s: headerSubStyle },
      { v: "", s: headerSubStyle }, { v: "Ngày công", s: headerSubStyle }, { v: "Số tiền", s: headerSubStyle }, { v: "", s: headerSubStyle },
      { v: "Mini Show", s: headerSubStyle }, { v: "Big Show", s: headerSubStyle }, { v: "Thưởng Công", s: headerSubStyle },
      { v: "Tiền ăn", s: headerSubStyle }, { v: "Xăng xe", s: headerSubStyle }, { v: "Điện thoại", s: headerSubStyle }, { v: "Trang phục", s: headerSubStyle }, { v: "Nhà ở", s: headerSubStyle }, { v: "Tổng PC", s: headerSubStyle },
      { v: "", s: headerSubStyle }, { v: "", s: headerSubStyle },
      { v: "Tạm Ứng", s: headerSubStyle }, { v: "Thuế TNCN (100%)", s: headerSubStyle }, { v: "Tổng Khấu Trừ Gốc", s: headerSubStyle },
      { v: "", s: headerSubStyle },
      { v: "", s: headerSubStyle },
      { v: "", s: headerSubStyle }
    ]);

    filteredPayrolls.forEach((p, index) => {
      const snap = p.employeeSnapshot || {};
      const allw = p.incomes?.allowances || {};
      const ded = p.deductions || {};
      const totalAllw = Number(allw.meal || 0) + Number(allw.transport || 0) + Number(allw.phone || 0) + Number(allw.clothing || 0) + Number(allw.housing || 0);

      const advance = Number(ded.advance || 0);
      const taxTNCN = Number(ded.taxTNCN || 0);
      const gross = Number(p.incomes?.totalGross || 0);
      const adjustment = Number(p.incomes?.adjustment || 0);

      const accountingDeductions = advance + taxTNCN;
      const accountingNet = gross - accountingDeductions;
      const finalPayment = accountingNet + adjustment;

      wsData.push([
        { v: Number(index + 1), s: cellCenter }, { v: snap.employeeCode || "", s: cellCenter }, { v: snap.fullName || "", s: cellLeft }, { v: snap.department || "", s: cellCenter }, { v: snap.position || "", s: cellCenter },
        { v: Number(p.baseSalary) || 0, s: {} }, { v: Number(p.actualDays) || 0, s: cellCenter }, { v: Number(p.incomes?.timeSalary) || 0, s: {} }, { v: Number(p.incomes?.overtime) || 0, s: {} },
        { v: Number(p.incomes?.miniShowMoney) || 0, s: {} }, { v: Number(p.incomes?.bigShowMoney) || 0, s: {} }, { v: Number(p.incomes?.kpiBonus) || 0, s: {} },
        { v: Number(allw.meal) || 0, s: {} }, { v: Number(allw.transport) || 0, s: {} }, { v: Number(allw.phone) || 0, s: {} }, { v: Number(allw.clothing) || 0, s: {} }, { v: Number(allw.housing) || 0, s: {} }, { v: totalAllw, s: cellRightBold },
        { v: Number(p.incomes?.bonus) || 0, s: {} }, { v: gross, s: cellRightBold },
        { v: advance, s: {} }, { v: taxTNCN, s: {} }, { v: accountingDeductions, s: cellRightBold },
        { v: accountingNet, s: { ...cellRightBold, fill: { fgColor: { rgb: "FFF2CC" } } } },
        { v: adjustment, s: {} },
        { v: finalPayment, s: { ...cellRightBold, fill: { fgColor: { rgb: "DBEAFE" } } } }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 25 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, 
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, 
      { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, 
      { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } }, 
      { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } }, 
      { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } }, 
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, 
      { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } }, 
      { s: { r: 2, c: 9 }, e: { r: 2, c: 11 } }, 
      { s: { r: 2, c: 12 }, e: { r: 2, c: 17 } }, 
      { s: { r: 2, c: 18 }, e: { r: 3, c: 18 } }, 
      { s: { r: 2, c: 19 }, e: { r: 3, c: 19 } }, 
      { s: { r: 2, c: 20 }, e: { r: 2, c: 22 } }, 
      { s: { r: 2, c: 23 }, e: { r: 3, c: 23 } }, 
      { s: { r: 2, c: 24 }, e: { r: 3, c: 24 } }, 
      { s: { r: 2, c: 25 }, e: { r: 3, c: 25 } }, 
    ];

    for (let r = 4; r < wsData.length; r++) {
      for (let c = 0; c <= 25; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;

        if (typeof ws[cellRef].v === 'number') {
          ws[cellRef].t = 'n';
          if (c >= 5 && c !== 6) {
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.numFmt = "#,##0";
            if(Object.keys(ws[cellRef].s).length === 1) {
              ws[cellRef].s.font = FONT;
              ws[cellRef].s.alignment = { horizontal: "right", vertical: "center" };
              ws[cellRef].s.border = BORDER;
            }
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi_Tiet_Ke_Toan");
    XLSX.writeFile(wb, `BangKeKhai_FullChiTiet_T${m}_${y}.xlsx`);
  };

  // ==========================================
  // XUẤT EXCEL GỬI NHÂN VIÊN
  // ==========================================
  const handleExportExcelEmployee = () => {
    if (filteredPayrolls.length === 0) return alert("Không có dữ liệu để xuất");
    const m = selectedMonthDoc?.month;
    const y = selectedMonthDoc?.year;

    const FONT = { name: "Times New Roman", sz: 11 };
    const BORDER = { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } };
    
    const titleStyle = { font: { name: "Times New Roman", sz: 15, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
    const headerStyle = { font: { ...FONT, bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, fill: { fgColor: { rgb: "D9E1F2" } }, border: BORDER };
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRightBold = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };

    const wsData: any[][] = [];
    wsData.push([{ v: `BẢNG THANH TOÁN LƯƠNG NHÂN VIÊN - THÁNG ${m}/${y}`, s: titleStyle }]);
    wsData.push([{ v: "Phúc lợi: Công ty hỗ trợ 100% Thuế TNCN phát sinh.", s: { font: { ...FONT, italic: true, color: { rgb: "FF0000" } } } }]);
    wsData.push([]);

    wsData.push([
      { v: "STT", s: headerStyle }, { v: "Mã NV", s: headerStyle }, { v: "Họ và tên", s: headerStyle }, { v: "Bộ phận", s: headerStyle },
      { v: "Tổng Thu Nhập (Gross)", s: headerStyle }, { v: "Tạm Ứng", s: headerStyle }, 
      { v: "Thuế TNCN (Công ty hỗ trợ)", s: headerStyle },
      { v: "THỰC NHẬN CHUYỂN KHOẢN", s: headerStyle },
      { v: "ĐIỀU CHỈNH CP KHÁC", s: headerStyle },
      { v: "TỔNG THANH TOÁN CK", s: headerStyle }
    ]);

    filteredPayrolls.forEach((p, index) => {
      const snap = p.employeeSnapshot || {};
      const ded = p.deductions || {};
      const adjustment = Number(p.incomes?.adjustment || 0);
      const netSalary = Number(p.netSalary) || 0;
      const finalPayment = netSalary + adjustment;
      
      wsData.push([
        { v: Number(index + 1), s: cellCenter }, 
        { v: snap.employeeCode || "", s: cellCenter }, 
        { v: snap.fullName || "", s: cellLeft }, 
        { v: snap.department || "", s: cellCenter },
        { v: Number(p.incomes?.totalGross) || 0, s: {} },
        { v: Number(ded.advance) || 0, s: {} },
        { v: 0, s: {} }, 
        { v: netSalary, s: { ...cellRightBold, font: { ...FONT, bold: true, color: { rgb: "9C0006" } }, fill: { fgColor: { rgb: "FFC7CE" } } } },
        { v: adjustment, s: {} },
        { v: finalPayment, s: { ...cellRightBold, fill: { fgColor: { rgb: "DBEAFE" } }, font: { ...FONT, bold: true, color: { rgb: "1E3A8A" } } } }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }];
    ws["!cols"] = [{ wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 22 }];

    for (let r = 3; r < wsData.length; r++) {
      for (let c = 0; c <= 9; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;

        if (typeof ws[cellRef].v === 'number') {
          ws[cellRef].t = 'n';
          if (c >= 4) {
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.numFmt = "#,##0";
            if(r < wsData.length && c !== 7 && c !== 9) {
               ws[cellRef].s.font = FONT;
               ws[cellRef].s.alignment = { horizontal: "right", vertical: "center" };
               ws[cellRef].s.border = BORDER;
            }
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangLuong_NhanVien");
    XLSX.writeFile(wb, `PhieuLuong_GuiNhanVien_T${m}_${y}.xlsx`);
  };

  const sharedFilterProps = {
    reportYear, setReportYear,
    reportType, setReportType,
    reportValue, setReportValue,
    availableYears
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
      
      <aside className={`relative bg-white border-r border-slate-200 h-full flex-shrink-0 z-20 shadow-sm transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px]' : 'w-0'}`}>
        <div className={`w-[280px] h-full flex flex-col overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
          <div className="p-5 border-b bg-slate-50 font-black text-sm text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-5 h-5" /> Đối Soát Thực Lĩnh
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Bảng Chi Tiết Định Kỳ</h3>
            {monthsList.map((m) => (
              <button 
                key={`${m.month}-${m.year}`} 
                onClick={() => setSelectedMonthDoc(m)} 
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${selectedMonthDoc?.month === m.month && selectedMonthDoc?.year === m.year ? "bg-amber-600 text-white shadow-md" : "bg-white border hover:bg-amber-50 text-slate-700"}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Tháng {m.month}/{m.year}</span>
                </div>
                <div>
                  {m.status === "paid" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : m.status === "approved" ? <Lock className="w-4 h-4 text-amber-200" /> : <span className="w-3 h-3 rounded-full bg-slate-300" />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-4 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm cursor-pointer">
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 sm:p-6 min-w-0 bg-slate-50">
        {selectedMonthDoc ? (
          <div className="flex flex-col h-full animate-in fade-in-50">
            
            <Tabs defaultValue="accounting_board" className="flex flex-col h-full">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 shrink-0">
                <div>
                  <h1 className="text-2xl font-black text-[#0f172a] flex items-center gap-3">
                    <HandCoins className="w-6 h-6 text-amber-600" /> Bảng Đối Soát
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Bảng Đối Soát gốc (không trừ BHXH), có cột Điều chỉnh CP khác và Tổng thanh toán CK.</p>
                </div>
                
                <TabsList className="bg-white border p-1 rounded-xl shadow-sm flex flex-wrap shrink-0">
                  <TabsTrigger value="accounting_board" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-bold text-xs"><Calculator className="w-3.5 h-3.5 mr-1.5" /> Lương chưa trừ DN</TabsTrigger>
                  <TabsTrigger value="employee_board" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold text-xs"><Users className="w-3.5 h-3.5 mr-1.5" /> Lương đã trừ DN</TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 shadow-sm font-bold text-xs"><TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Biểu đồ thống kê</TabsTrigger>
                  <TabsTrigger value="tax" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 shadow-sm font-bold text-xs"><Landmark className="w-3.5 h-3.5 mr-1.5" /> Lương chưa trừ DN (Quỹ)</TabsTrigger>
                  <TabsTrigger value="employee_summary" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 shadow-sm font-bold text-xs"><ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Lương đã trừ DN (Quỹ)</TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: BẢNG KẾ TOÁN FULL CHI TIẾT */}
              <TabsContent value="accounting_board" className="flex-1 min-h-0 mt-0 focus-visible:outline-none flex flex-col">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center mb-4 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-700" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                      <option value="ALL">Tất cả phòng ban</option>
                      {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200" />
                  </div>
                </div>
                
                <div className="mb-2 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cấu phần chi tiết dòng chi thu nhập & trích trừ Kế Toán - Tháng {selectedMonthDoc.month}/{selectedMonthDoc.year}</span>
                  <Button size="sm" onClick={handleExportExcelFull} className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs h-8"><FileDown className="w-3.5 h-3.5 mr-1" /> Xuất Excel Kế Toán</Button>
                </div>
                <Card className="flex-1 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <div className="overflow-auto h-full custom-scrollbar relative">
                    <table className="w-full text-[11px] border-collapse min-w-[2500px] bg-white">
                      <thead className="bg-[#003366] text-white sticky top-0 z-30">
                        <tr className="h-[44px]">
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-center sticky left-0 bg-[#003366] z-40 w-[45px]">STT</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-left sticky left-[45px] bg-[#003366] z-40 w-[150px] shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Họ và tên</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-center w-[90px]">Mã NV</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-left w-[100px]">Bộ phận</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-left w-[100px]">Chức vụ</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 text-right w-[100px]">Lương CV</th>
                          <th colSpan={2} className="p-2 border-r border-b border-slate-700 bg-blue-900 text-center">Lương Thời Gian</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 bg-blue-900 text-right w-[90px]">Làm Thêm</th>
                          <th colSpan={3} className="p-2 border-r border-b border-slate-700 bg-purple-900 text-center">Hiệu Suất (Show)</th>
                          <th colSpan={6} className="p-2 border-r border-b border-slate-700 bg-teal-950 text-center">Các Khoản Phụ Cấp</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 bg-rose-950 text-right w-[90px]">Thưởng Mới</th>
                          <th rowSpan={2} className="p-2 border-r border-b border-slate-700 bg-emerald-900 text-emerald-300 font-bold text-right w-[110px]">TỔNG GROSS</th>
                          <th colSpan={3} className="p-2 border-r border-b border-slate-700 bg-slate-800 text-center">Các Khoản Khấu Trừ Gốc</th>
                          <th rowSpan={2} className="p-2 bg-amber-700 text-white font-black text-right w-[120px] border-b border-amber-800">THỰC LĨNH</th>
                          <th rowSpan={2} className="p-2 bg-orange-800 text-white font-black text-right w-[140px] border-b border-orange-900">ĐIỀU CHỈNH CP KHÁC</th>
                          <th rowSpan={2} className="p-2 bg-indigo-800 text-white font-black text-right w-[150px] sticky right-0 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.1)] border-b border-indigo-900">TỔNG THANH TOÁN CK</th>
                        </tr>
                        <tr className="h-[32px] bg-slate-800 text-[10px] text-slate-300">
                          <th className="p-1 border-r border-b border-slate-700 text-center w-[50px]">Công</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[90px]">Thành tiền</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Mini Show</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Big Show</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[85px]">Thưởng Công</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Tiền ăn</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Xăng xe</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Đ.Thoại</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Phục trang</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[80px]">Nhà ở</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[90px] text-teal-300 font-bold">Tổng PC</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[85px]">Tạm Ứng</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[85px]">Thuế TNCN</th>
                          <th className="p-1 border-r border-b border-slate-700 text-right w-[95px] font-bold text-rose-300">Tổng Trừ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          <tr><td colSpan={26} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600"/></td></tr>
                        ) : filteredPayrolls.map((p, idx) => {
                          const snap = p.employeeSnapshot || {};
                          const allw = p.incomes?.allowances || {};
                          const ded = p.deductions || {};
                          const totalAllw = Number(allw.meal||0) + Number(allw.transport||0) + Number(allw.phone||0) + Number(allw.clothing||0) + Number(allw.housing||0);
                          const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/60";

                          const accountingDeductions = Number(ded.advance || 0) + Number(ded.taxTNCN || 0);
                          const accountingNet = Number(p.incomes?.totalGross || 0) - accountingDeductions;
                          
                          const adjustment = editingAdjustments[p._id] !== undefined 
                            ? editingAdjustments[p._id] 
                            : Number(p.incomes?.adjustment || 0);
                          const finalPayment = accountingNet + adjustment;
                          const isAdjustmentDirty = editingAdjustments[p._id] !== undefined 
                            && editingAdjustments[p._id] !== Number(p.incomes?.adjustment || 0);
                          const isSaving = savingIds[p._id];

                          return (
                            <tr key={p._id} className={`${rowBg} hover:bg-slate-100/80 transition-colors`}>
                              <td className={`p-2 border-r border-b border-slate-200 text-center sticky left-0 ${rowBg} z-10`}>{idx + 1}</td>
                              <td className={`p-2 border-r border-b border-slate-200 font-bold text-slate-800 sticky left-[45px] ${rowBg} z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)] truncate w-[150px]`} title={snap.fullName}>{snap.fullName}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-center text-slate-500">{snap.employeeCode}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-slate-600">{snap.department}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-slate-600">{snap.position}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right font-medium text-slate-600">{formatNumberWithDot(p.baseSalary)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-center font-bold text-blue-700">{p.actualDays}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-slate-700">{formatNumberWithDot(p.incomes?.timeSalary)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-slate-700">{formatNumberWithDot(p.incomes?.overtime)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-purple-700">{formatNumberWithDot(p.incomes?.miniShowMoney)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-purple-700">{formatNumberWithDot(p.incomes?.bigShowMoney)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-purple-800">{formatNumberWithDot(p.incomes?.kpiBonus)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-teal-700">{formatNumberWithDot(allw.meal)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-teal-700">{formatNumberWithDot(allw.transport)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-teal-700">{formatNumberWithDot(allw.phone)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-teal-700">{formatNumberWithDot(allw.clothing)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-teal-700">{formatNumberWithDot(allw.housing)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-teal-800 bg-teal-50/20">{formatNumberWithDot(totalAllw)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-rose-600 font-medium">{formatNumberWithDot(p.incomes?.bonus)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right font-black text-emerald-800 bg-emerald-50/20">{formatNumberWithDot(p.incomes?.totalGross)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-slate-600">{formatNumberWithDot(ded.advance)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right text-amber-600" title="Thuế phát sinh gốc">{formatNumberWithDot(ded.taxTNCN)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right font-bold text-rose-700 bg-rose-50/20">{formatNumberWithDot(accountingDeductions)}</td>
                              <td className="p-2 border-r border-b border-slate-200 text-right font-black text-amber-900 bg-amber-50 text-xs">{formatNumberWithDot(accountingNet)}</td>
                              
                              {/* CỘT ĐIỀU CHỈNH CP KHÁC — INPUT NHẬP TAY */}
                              <td className="p-1 border-r border-b border-slate-200 text-center bg-orange-50/50">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    className="w-full h-7 text-right text-[11px] font-bold text-orange-700 bg-white border rounded px-1.5 outline-none focus:ring-2 focus:ring-orange-400"
                                    value={formatNumberWithDotSigned(adjustment)}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^\d-]/g, "");
                                      const num = raw === "" || raw === "-" ? 0 : Number(raw);
                                      setEditingAdjustments(prev => ({ ...prev, [p._id]: num }));
                                    }}
                                    placeholder="0"
                                  />
                                  {isAdjustmentDirty && (
                                    <button
                                      onClick={() => handleSaveAdjustment(p._id)}
                                      disabled={isSaving}
                                      className="shrink-0 h-7 w-7 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                      title="Lưu điều chỉnh"
                                    >
                                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                              
                              <td className="p-2 text-right font-black text-indigo-900 bg-indigo-50 text-xs sticky right-0 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.04)] border-b border-indigo-200">
                                {formatNumberWithDot(finalPayment)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 2: BẢNG LƯƠNG GỬI NHÂN VIÊN */}
              <TabsContent value="employee_board" className="flex-1 min-h-0 mt-0 focus-visible:outline-none flex flex-col">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center mb-4 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-700" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                      <option value="ALL">Tất cả phòng ban</option>
                      {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200" />
                  </div>
                </div>

                <div className="mb-2 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase">Thực nhận nhân viên - Tháng {selectedMonthDoc.month}/{selectedMonthDoc.year}</span>
                  <Button size="sm" onClick={handleExportExcelEmployee} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8"><FileDown className="w-3.5 h-3.5 mr-1" /> Xuất Lương Nhân Viên</Button>
                </div>
                <Card className="flex-1 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <div className="overflow-auto h-full custom-scrollbar relative">
                    <table className="w-full text-xs border-collapse min-w-[1350px] bg-white">
                      <thead className="bg-[#1e293b] text-white sticky top-0 z-30">
                        <tr className="h-[44px]">
                          <th className="p-3 text-center w-[60px] border-b border-slate-700">STT</th>
                          <th className="p-3 text-center w-[110px] border-b border-slate-700">Mã NV</th>
                          <th className="p-3 text-left sticky left-0 bg-[#1e293b] z-20 w-[180px] border-b border-slate-700">Họ và tên</th>
                          <th className="p-3 text-center w-[130px] border-b border-slate-700">Bộ phận</th>
                          <th className="p-3 text-right text-emerald-300 w-[150px] border-b border-slate-700">Tổng Thu Nhập</th>
                          <th className="p-3 text-right text-rose-300 w-[120px] border-b border-slate-700">Tạm Ứng</th>
                          <th className="p-3 text-right text-rose-300 w-[120px] border-b border-slate-700">Thuế TNCN</th>
                          <th className="p-3 text-right text-amber-300 w-[140px] bg-slate-900 font-bold border-b border-slate-950">Thực Nhận</th>
                          <th className="p-3 text-right text-orange-300 w-[140px] border-b border-slate-700">Điều Chỉnh CP Khác</th>
                          <th className="p-3 text-right text-indigo-300 w-[150px] bg-indigo-900 font-bold border-b border-indigo-950">Tổng Thanh Toán CK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          <tr><td colSpan={10} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600"/></td></tr>
                        ) : filteredPayrolls.map((p, idx) => {
                          const snap = p.employeeSnapshot || {};
                          const ded = p.deductions || {};
                          const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                          
                          const adjustment = editingAdjustments[p._id] !== undefined 
                            ? editingAdjustments[p._id] 
                            : Number(p.incomes?.adjustment || 0);
                          const finalPayment = Number(p.netSalary || 0) + adjustment;

                          return (
                            <tr key={p._id} className={`${rowBg} hover:bg-emerald-50/40 transition-colors`}>
                              <td className="p-3 text-center border-b border-slate-100 text-slate-400">{idx + 1}</td>
                              <td className="p-3 text-center border-b border-slate-100 font-mono font-medium text-slate-600">{snap.employeeCode}</td>
                              <td className={`p-3 border-b border-slate-100 font-bold text-slate-800 sticky left-0 ${rowBg} z-10`}>{snap.fullName}</td>
                              <td className="p-3 text-center border-b border-slate-100 text-slate-600">{snap.department}</td>
                              <td className="p-3 text-right border-b border-slate-100 font-medium">{formatNumberWithDot(p.incomes?.totalGross)}</td>
                              <td className="p-3 text-right border-b border-slate-100 text-rose-600">{formatNumberWithDot(ded.advance)}</td>
                              <td className="p-3 text-right border-b border-slate-100 font-bold text-slate-400">
                                {Number(ded.taxTNCN) > 0 ? (
                                  <>
                                    <span className="line-through text-[10px] text-rose-400 mr-1.5 font-normal">{formatNumberWithDot(ded.taxTNCN)}</span>
                                    <span className="text-emerald-600 text-xs">0 đ</span>
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-xs">0 đ</span>
                                )}
                              </td>
                              <td className="p-3 text-right border-b border-slate-100 font-black text-emerald-700 bg-emerald-50/30 text-sm">
                                {formatNumberWithDot(p.netSalary)}
                              </td>
                              <td className="p-3 text-right border-b border-slate-100 font-bold text-orange-700 bg-orange-50/30">
                                {formatNumberWithDotSigned(adjustment)}
                              </td>
                              <td className="p-3 text-right border-b border-slate-100 font-black text-indigo-700 bg-indigo-50/30 text-sm">
                                {formatNumberWithDot(finalPayment)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 3: TỔNG CỤC */}
              <TabsContent value="stats" className="flex-1 min-h-0 mt-0 focus-visible:outline-none overflow-y-auto custom-scrollbar pr-1">
                <TabPayrollStats reportData={reportData} filterProps={sharedFilterProps} />
              </TabsContent>

              {/* TAB 4: THỐNG KÊ THUẾ (GỐC) */}
              <TabsContent value="tax" className="flex-1 min-h-0 mt-0 focus-visible:outline-none overflow-y-auto custom-scrollbar pr-1">
                <TabTaxSummary reportData={reportData} isReportingFetching={isReportingFetching} filterProps={sharedFilterProps} />
              </TabsContent>

              {/* TAB 5: THỐNG KÊ NHÂN VIÊN */}
              <TabsContent value="employee_summary" className="flex-1 min-h-0 mt-0 focus-visible:outline-none overflow-y-auto custom-scrollbar pr-1">
                <TabEmployeeSummary reportData={reportData} isReportingFetching={isReportingFetching} filterProps={sharedFilterProps} />
              </TabsContent>

            </Tabs>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <Wallet className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-lg uppercase tracking-widest opacity-60">Vui lòng chọn một tháng từ danh sách để xem</p>
          </div>
        )}
      </main>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in-0 ${
          toast.type === "success" 
            ? "bg-emerald-600 text-white" 
            : "bg-rose-600 text-white"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}