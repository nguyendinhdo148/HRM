/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator, Save, PlayCircle, RefreshCcw, CalendarClock, CheckCircle2,
  Search, FileDown, TrendingUp, Users, Wallet, Filter, Banknote,
  Trash2, Lock, Unlock, Hash, Landmark, FileSpreadsheet, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import XLSX from "xlsx-js-style";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/payroll`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

const formatNumberWithDot = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "0";
  return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// =========================================================================
// 1. COMPONENT: BẢNG LƯƠNG CHI TIẾT (TAB 1)
// =========================================================================
const TabPayrollTable = ({
  filteredPayrolls, editingRecords, isClosed,
  handleInputChange, handleSaveRow
}: any) => {
  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden animate-in fade-in-50">
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-[11px] border-collapse min-w-[2200px]">
          <thead className="bg-[#003366] text-white">
            <tr>
              <th rowSpan={2} className="p-3 sticky left-0 bg-[#003366] z-30 min-w-[50px] border-r border-slate-600 text-center">STT</th>
              <th rowSpan={2} className="p-3 sticky left-[50px] bg-[#003366] z-30 min-w-[150px] border-r border-slate-600 text-left">Họ và tên</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 min-w-[100px]">Chức vụ</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 min-w-[100px]">Bộ phận</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 min-w-[100px]">Lương CV</th>
              <th colSpan={2} className="p-2 border-r border-slate-600 bg-[#1e40af] text-center">Lương Thời Gian</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 bg-[#1d4ed8] text-center max-w-[100px]">Làm Thêm Giờ<br /><span className="text-[9px] font-normal italic">(Auto từ OT)</span></th>
              <th colSpan={6} className="p-2 border-r border-slate-600 bg-[#0f766e] text-center">Các Khoản Phụ Cấp</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 bg-amber-600 text-center max-w-[100px]">Thưởng (+)<br /><span className="text-[9px] font-normal italic">(Nhập Tay)</span></th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 bg-[#064e3b] text-emerald-300 font-black text-xs min-w-[100px]">TỔNG THU NHẬP</th>
              <th rowSpan={2} className="p-2 border-r border-slate-600 bg-[#831843] text-center max-w-[80px]">Tạm Ứng<br /><span className="text-[9px] font-normal italic">(Từ Chấm công)</span></th>
              <th colSpan={3} className="p-2 border-r border-slate-600 bg-[#9f1239] text-center">Bảo Hiểm & Thuế Trừ Lương</th>
              <th rowSpan={2} className="p-3 bg-[#b45309] text-white text-center min-w-[120px] text-[13px] sticky right-[50px] z-20 shadow-[-5px_0_10px_rgba(0,0,0,0.3)]">THỰC LĨNH</th>
              <th rowSpan={2} className="p-2 bg-[#003366] sticky right-0 z-30 min-w-[50px]">Lưu</th>
            </tr>
            <tr className="bg-[#1e293b] text-[10px] text-center text-slate-300">
              <th className="p-1 border-r border-slate-600 text-white">Ngày công</th>
              <th className="p-1 border-r border-slate-600 text-blue-300">Số tiền</th>
              <th className="p-1 border-r border-slate-600">Tiền ăn ca</th>
              <th className="p-1 border-r border-slate-600">Xăng xe</th>
              <th className="p-1 border-r border-slate-600">Điện thoại</th>
              <th className="p-1 border-r border-slate-600">Trang phục</th>
              <th className="p-1 border-r border-slate-600">Nhà ở</th>
              <th className="p-1 border-r border-slate-600 text-emerald-200 font-bold bg-[#047857]">Tổng PC</th>
              <th className="p-1 border-r border-slate-600 text-rose-200">Bảo Hiểm (NLĐ)</th>
              <th className="p-1 border-r border-slate-600 text-rose-200">Thuế TNCN</th>
              <th className="p-1 border-r border-slate-600 text-white bg-[#881337] font-bold">Tổng Trừ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredPayrolls.map((p: any, idx: number) => {
              const edit = editingRecords[p._id] || p;
              const snap = p.employeeSnapshot;
              const allowances = p.incomes?.allowances || {};
              const totalAllw = (allowances.meal || 0) + (allowances.transport || 0) + (allowances.phone || 0) + (allowances.clothing || 0) + (allowances.housing || 0);
              
              return (
                <tr key={p._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"} hover:bg-blue-50/50 transition-colors`}>
                  <td className="p-2 border-r border-slate-200 sticky left-0 z-10 bg-inherit font-medium text-center">{idx + 1}</td>
                  <td className="p-2 px-3 border-r border-slate-200 sticky left-[50px] z-10 bg-inherit font-bold text-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {snap?.fullName}
                    <div className="text-[9px] text-slate-400 font-normal mt-0.5">{snap?.employeeCode}</div>
                  </td>
                  <td className="p-2 border-r border-slate-200 text-slate-600">{snap?.position}</td>
                  <td className="p-2 border-r border-slate-200 text-slate-600">{snap?.department}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-medium text-slate-700">{formatNumberWithDot(p.baseSalary)}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-700 bg-blue-50/30">{p.actualDays}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-bold text-blue-800 bg-blue-50/30">{formatNumberWithDot(p.incomes?.timeSalary)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-bold text-indigo-700 bg-indigo-50/30">{formatNumberWithDot(p.incomes?.overtime)}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.meal)}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.transport)}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.phone)}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.clothing)}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-emerald-600">{formatNumberWithDot(allowances.housing)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/50">{formatNumberWithDot(totalAllw)}</td>
                  <td className="p-1 border-r border-slate-200 bg-amber-50/50">
                    <input
                      type="text"
                      disabled={isClosed}
                      className="w-full h-8 text-right font-bold text-amber-700 bg-transparent outline-none p-1 focus:bg-white border rounded border-transparent focus:border-amber-400 transition-colors"
                      value={formatNumberWithDot(edit.incomes?.bonus)}
                      onChange={(e) => handleInputChange(p._id, "bonus", e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-black text-emerald-700 bg-emerald-50">{formatNumberWithDot(p.incomes?.totalGross)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-medium text-rose-500 bg-rose-50/10">{formatNumberWithDot(p.deductions?.advance)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-medium text-rose-600 bg-rose-50/30">{formatNumberWithDot(p.deductions?.insurance?.total)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-medium text-rose-600 bg-rose-50/30">{formatNumberWithDot(p.deductions?.taxTNCN)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-bold text-rose-700 bg-rose-100/40">{formatNumberWithDot(p.deductions?.totalDeductions)}</td>
                  <td className="p-2 text-right font-black text-amber-900 bg-[#fef3c7] text-[13px] sticky right-[50px] z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">{formatNumberWithDot(p.netSalary)}</td>
                  <td className="p-1.5 sticky right-0 bg-slate-50 z-20 border-l border-slate-200">
                    {editingRecords[p._id] && !isClosed ? (
                      <Button size="sm" onClick={() => handleSaveRow(p._id)} className="w-full h-7 text-[9px] bg-blue-600 animate-pulse px-1">LƯU</Button>
                    ) : (
                      <div className="text-center opacity-30 text-[10px] font-bold">---</div>
                    )}
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
// 2. COMPONENT: TỔNG CỤC THỐNG KÊ (TAB 2)
// =========================================================================
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
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Biểu Đồ Thực Lĩnh</CardTitle>
            <CardDescription>Top 15 nhân sự có thu nhập cao nhất theo bộ lọc</CardDescription>
          </div>
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

// =========================================================================
// 3. COMPONENT: TỔNG HỢP KÊ KHAI THUẾ (TAB 3)
// =========================================================================
const TabTaxSummary = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [period, setPeriod] = useState<string>("ALL"); // 'ALL', 'Q1', 'Q2', 'Q3', 'Q4'
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy dữ liệu và cộng dồn theo khoảng thời gian được chọn
  const fetchAndAggregate = async () => {
    setIsLoading(true);
    try {
      let monthsToFetch: number[] = [];
      if (period === "ALL") monthsToFetch = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      else if (period === "Q1") monthsToFetch = [1, 2, 3];
      else if (period === "Q2") monthsToFetch = [4, 5, 6];
      else if (period === "Q3") monthsToFetch = [7, 8, 9];
      else if (period === "Q4") monthsToFetch = [10, 11, 12];

      const promises = monthsToFetch.map(m =>
        fetch(`${API_BASE_URL}?month=${m}&year=${year}`, { headers: getAuthHeaders() }).then(res => res.json())
      );

      const responses = await Promise.all(promises);
      const allRecords = responses.flatMap(res => res.records || []);

      // Cộng dồn (Aggregate) dữ liệu theo Mã Nhân Viên
      const summaryMap: Record<string, any> = {};
      allRecords.forEach((r: any) => {
        const code = r.employeeSnapshot.employeeCode;
        if (!summaryMap[code]) {
          summaryMap[code] = {
            employeeCode: code,
            fullName: r.employeeSnapshot.fullName,
            department: r.employeeSnapshot.department,
            totalGross: 0,
            totalTax: 0,
            totalInsurance: 0,
            totalNet: 0
          };
        }
        summaryMap[code].totalGross += (r.incomes?.totalGross || 0);
        summaryMap[code].totalTax += (r.deductions?.taxTNCN || 0);
        summaryMap[code].totalInsurance += (r.deductions?.insurance?.total || 0);
        summaryMap[code].totalNet += (r.netSalary || 0);
      });

      setAggregatedData(Object.values(summaryMap));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAndAggregate(); }, [year, period]);

  // Xuất Excel chuẩn cho bảng Kê khai thuế
  const handleExportTaxExcel = () => {
    if (aggregatedData.length === 0) return alert("Không có dữ liệu!");

    const title = period === "ALL" ? `NĂM ${year}` : `QUÝ ${period.replace('Q', '')} NĂM ${year}`;
    const FONT = { name: "Times New Roman", sz: 11 };
    const BORDER = {
      top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } },
    };

    const titleStyle = { font: { name: "Times New Roman", sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
    const headerStyle = { font: { ...FONT, bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: BORDER, fill: { fgColor: { rgb: "E2EFDA" } } };
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRight = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };

    const wsData: any[][] = [];
    wsData.push([{ v: `BẢNG TỔNG HỢP THU NHẬP NHÂN VIÊN ${title}`, s: titleStyle }, ...Array(7).fill({ v: "", s: titleStyle })]);
    wsData.push([]);
    
    wsData.push([
      { v: "STT", s: headerStyle }, { v: "Mã NV", s: headerStyle }, { v: "Họ và tên", s: headerStyle }, { v: "Bộ phận", s: headerStyle },
      { v: "Tổng Thu Nhập (Gross)", s: headerStyle }, { v: "Thuế TNCN Đã Khấu Trừ", s: headerStyle }, { v: "Bảo Hiểm (NLĐ)", s: headerStyle }, { v: "Tổng Thực Lĩnh", s: headerStyle }
    ]);

    aggregatedData.forEach((row, index) => {
      wsData.push([
        { v: index + 1, s: cellCenter },
        { v: row.employeeCode, s: cellCenter },
        { v: row.fullName, s: cellLeft },
        { v: row.department || "", s: cellCenter },
        { v: formatNumberWithDot(row.totalGross), s: cellRight },
        { v: formatNumberWithDot(row.totalTax), s: cellRight },
        { v: formatNumberWithDot(row.totalInsurance), s: cellRight },
        { v: formatNumberWithDot(row.totalNet), s: cellRight },
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TongHopThuNhap");
    XLSX.writeFile(wb, `TongHopThuNhap_${period}_${year}.xlsx`);
  };

  return (
    <div className="space-y-4 mt-4 animate-in fade-in-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-sm gap-4">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Chọn Năm</span>
            <select className="border rounded-xl px-3 py-2 text-sm bg-slate-50 font-bold outline-none cursor-pointer" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2025, 2026, 2027, 2028].map((y) => (<option key={y} value={y}>Năm {y}</option>))}
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Kỳ Báo Cáo</span>
            <select className="border rounded-xl px-3 py-2 text-sm bg-slate-50 font-bold outline-none cursor-pointer" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="ALL">Cả Năm</option>
              <option value="Q1">Quý 1</option>
              <option value="Q2">Quý 2</option>
              <option value="Q3">Quý 3</option>
              <option value="Q4">Quý 4</option>
            </select>
          </div>
        </div>
        <Button onClick={handleExportTaxExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel Khai Thuế
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : aggregatedData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 font-medium">Không có dữ liệu cho kỳ này.</div>
        ) : (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-[12px] border-collapse min-w-[1000px]">
              <thead className="bg-[#0f172a] text-white">
                <tr>
                  <th className="p-3 border-r border-slate-600 text-center w-[60px]">STT</th>
                  <th className="p-3 border-r border-slate-600 text-center w-[100px]">Mã NV</th>
                  <th className="p-3 border-r border-slate-600 text-left">Họ và tên</th>
                  <th className="p-3 border-r border-slate-600 text-center">Phòng ban</th>
                  <th className="p-3 border-r border-slate-600 text-right text-emerald-300">Tổng Thu Nhập (Gross)</th>
                  <th className="p-3 border-r border-slate-600 text-right text-rose-300">Thuế TNCN Đã Thu</th>
                  <th className="p-3 border-r border-slate-600 text-right text-rose-300">BHXH (NLĐ)</th>
                  <th className="p-3 text-right text-amber-400">Tổng Thực Lĩnh</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {aggregatedData.map((row, idx) => (
                  <tr key={row.employeeCode} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r border-slate-200 text-center font-medium">{idx + 1}</td>
                    <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-700">{row.employeeCode}</td>
                    <td className="p-3 border-r border-slate-200 font-bold">{row.fullName}</td>
                    <td className="p-3 border-r border-slate-200 text-center text-slate-600">{row.department}</td>
                    <td className="p-3 border-r border-slate-200 text-right font-bold text-emerald-700">{formatNumberWithDot(row.totalGross)}</td>
                    <td className="p-3 border-r border-slate-200 text-right font-bold text-rose-600">{formatNumberWithDot(row.totalTax)}</td>
                    <td className="p-3 border-r border-slate-200 text-right font-bold text-rose-600">{formatNumberWithDot(row.totalInsurance)}</td>
                    <td className="p-3 text-right font-black text-amber-700">{formatNumberWithDot(row.totalNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    if (!window.confirm("Bắt đầu Đồng Bộ Tự Động?\nHệ thống sẽ tự động bốc dữ liệu từ: Bảng Chấm Công, Bảng OT, Bảng Thuế TNCN và Bảng Bảo Hiểm.")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/init`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ month: newMonth, year: newYear, standardDays: 26 }) });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        await fetchMonthsList();
        setSelectedMonthDoc({ month: newMonth, year: newYear, status: "draft" });
      } else alert(result.message);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleToggleStatus = async (newStatus: "draft" | "approved" | "paid") => {
    const actionName = newStatus === "approved" ? "KHÓA SỔ BẢNG LƯƠNG" : newStatus === "paid" ? "ĐÁNH DẤU ĐÃ THANH TOÁN" : "MỞ KHÓA BẢNG LƯƠNG";
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
      const currentEdit = prev[recordId] || { ...payrolls.find((p) => p._id === recordId) };
      if (!currentEdit.incomes) currentEdit.incomes = {};
      currentEdit.incomes[field] = Number(numValue);
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
    if (filteredPayrolls.length === 0) return alert("Không có dữ liệu để xuất Excel");
    const m = selectedMonthDoc?.month || newMonth;
    const y = selectedMonthDoc?.year || newYear;
    const FONT = { name: "Times New Roman", sz: 11 };
    const BORDER = { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } }, left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } } };
    const titleStyle = { font: { name: "Times New Roman", sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
    const headerStyle = { font: { ...FONT, bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: BORDER, fill: { fgColor: { rgb: "E2EFDA" } } };
    const cellCenter = { font: FONT, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
    const cellLeft = { font: FONT, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
    const cellRight = { font: FONT, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };
    const cellRightBold = { font: { ...FONT, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };
    const wsData: any[][] = [];

    wsData.push([{ v: `BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${m} NĂM ${y}`, s: titleStyle }, ...Array(22).fill({ v: "", s: titleStyle }) ]);
    wsData.push([]); 
    wsData.push([
      { v: "STT", s: headerStyle }, { v: "Họ và tên", s: headerStyle }, { v: "Mã NV", s: headerStyle }, { v: "Chức vụ", s: headerStyle }, { v: "Bộ phận", s: headerStyle }, { v: "Lương CV", s: headerStyle }, { v: "Lương Thời Gian", s: headerStyle }, { v: "", s: headerStyle }, { v: "Làm Thêm Giờ", s: headerStyle }, { v: "Các Khoản Phụ Cấp", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "Thưởng", s: headerStyle }, { v: "TỔNG THU NHẬP", s: headerStyle }, { v: "Tạm Ứng", s: headerStyle }, { v: "Bảo Hiểm & Thuế", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "THỰC LĨNH", s: headerStyle }, { v: "Ký nhận", s: headerStyle }
    ]);
    wsData.push([
      { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "Ngày công", s: headerStyle }, { v: "Số tiền", s: headerStyle }, { v: "", s: headerStyle }, { v: "Tiền ăn ca", s: headerStyle }, { v: "Xăng xe", s: headerStyle }, { v: "Điện thoại", s: headerStyle }, { v: "Trang phục", s: headerStyle }, { v: "Nhà ở", s: headerStyle }, { v: "Tổng PC", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }, { v: "Bảo Hiểm", s: headerStyle }, { v: "Thuế TNCN", s: headerStyle }, { v: "Tổng Trừ", s: headerStyle }, { v: "", s: headerStyle }, { v: "", s: headerStyle }
    ]);
    const fmt = (val: any) => formatNumberWithDot(val || 0);

    filteredPayrolls.forEach((p, index) => {
      const snap = p.employeeSnapshot || {};
      const inc = p.incomes || {};
      const allw = inc.allowances || {};
      const ded = p.deductions || {};
      const ins = ded.insurance || {};
      const totalAllw = (allw.meal || 0) + (allw.transport || 0) + (allw.phone || 0) + (allw.clothing || 0) + (allw.housing || 0);

      wsData.push([
        { v: index + 1, s: cellCenter }, { v: snap.fullName || "", s: cellLeft }, { v: snap.employeeCode || "", s: cellCenter }, { v: snap.position || "", s: cellCenter }, { v: snap.department || "", s: cellCenter }, { v: fmt(p.baseSalary), s: cellRight }, { v: p.actualDays || 0, s: cellCenter }, { v: fmt(inc.timeSalary), s: cellRight }, { v: fmt(inc.overtime), s: cellRight }, { v: fmt(allw.meal), s: cellRight }, { v: fmt(allw.transport), s: cellRight }, { v: fmt(allw.phone), s: cellRight }, { v: fmt(allw.clothing), s: cellRight }, { v: fmt(allw.housing), s: cellRight }, { v: fmt(totalAllw), s: cellRightBold }, { v: fmt(inc.bonus), s: cellRight }, { v: fmt(inc.totalGross), s: cellRightBold }, { v: fmt(ded.advance), s: cellRight }, { v: fmt(ins.total), s: cellRight }, { v: fmt(ded.taxTNCN), s: cellRight }, { v: fmt(ded.totalDeductions), s: cellRightBold }, { v: fmt(p.netSalary), s: { ...cellRightBold, font: { ...FONT, bold: true, color: { rgb: "C00000" } } } }, { v: "", s: cellLeft }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 22 } }, { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } }, { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } }, { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } }, { s: { r: 2, c: 9 }, e: { r: 2, c: 14 } }, { s: { r: 2, c: 15 }, e: { r: 3, c: 15 } }, { s: { r: 2, c: 16 }, e: { r: 3, c: 16 } }, { s: { r: 2, c: 17 }, e: { r: 3, c: 17 } }, { s: { r: 2, c: 18 }, e: { r: 2, c: 20 } }, { s: { r: 2, c: 21 }, e: { r: 3, c: 21 } }, { s: { r: 2, c: 22 }, e: { r: 3, c: 22 } },
    ];
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BangLuong_T${m}_${y}`);
    XLSX.writeFile(wb, `BangLuong_TongHop_T${m}_${y}.xlsx`);
  };

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 pb-10 min-h-screen bg-slate-50 p-5">
      {/* ================= SIDEBAR ================= */}
      <div className="w-full xl:w-72 space-y-4 shrink-0">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" /> Đồng Bộ & Tính Lương</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex gap-2">
              <select className="border rounded-md p-2 text-xs w-full bg-slate-50 font-semibold outline-none" value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))}>
                {[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1}>Tháng {i + 1}</option>))}
              </select>
              <select className="border rounded-md p-2 text-xs w-full bg-slate-50 font-semibold outline-none" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))}>
                {[2025, 2026, 2027].map((y) => (<option key={y} value={y}>Năm {y}</option>))}
              </select>
            </div>
            <Button onClick={handleInitMonth} className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 font-bold"><PlayCircle className="w-4 h-4 mr-1" /> Gom Số Liệu Tự Động</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white h-[500px] flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Lịch sử kỳ lương
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
            {monthsList.map((m) => (
              <div key={`${m.month}-${m.year}`} className="relative group">
                <button
                  onClick={() => setSelectedMonthDoc(m)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${selectedMonthDoc?.month === m.month && selectedMonthDoc?.year === m.year ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-100 text-slate-700"}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Tháng {m.month}/{m.year}</span>
                    <span className="text-[10px] opacity-80 font-medium">{formatCurrency(m.totalNet)}</span>
                  </div>
                  <div className="flex items-center pr-1">
                    {m.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : m.status === "approved" ? <Lock className="w-3 h-3 text-blue-200" /> : <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  </div>
                </button>
                {m.status === "draft" && (
                  <button onClick={async (e) => { e.stopPropagation(); if (!window.confirm(`Xóa bảng lương tháng ${m.month}/${m.year}?`)) return; try { const res = await fetch(`${API_BASE_URL}?month=${m.month}&year=${m.year}`, { method: "DELETE", headers: getAuthHeaders() }); if (res.ok) { if (selectedMonthDoc?.month === m.month && selectedMonthDoc?.year === m.year) { setSelectedMonthDoc(null); setPayrolls([]); } fetchMonthsList(); } } catch (error) { console.error(error); } }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm" title="Xóa kỳ lương này">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 space-y-4">
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
                <TabsTrigger value="board" className="data-[state=active]:bg-slate-100 shadow-sm font-bold"><Calculator className="w-4 h-4 mr-2" /> Bảng Lương</TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-slate-100 shadow-sm font-bold"><TrendingUp className="w-4 h-4 mr-2" /> Tổng Cục</TabsTrigger>
                
                {/* TAB MỚI: KÊ KHAI THUẾ */}
                <TabsTrigger value="tax" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 shadow-sm font-bold">
                  <Landmark className="w-4 h-4 mr-2" /> Kê Khai Thuế & Quý
                </TabsTrigger>

              </TabsList>
            </div>

            <TabsContent value="board" className="mt-0">
              <div className="bg-white p-3 rounded-2xl border-none shadow-sm flex flex-wrap gap-4 items-center mb-4">
                <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select className="bg-transparent text-sm font-medium outline-none cursor-pointer" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="ALL">Tất cả phòng ban</option>
                    {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Tìm tên hoặc mã NV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-xl bg-slate-50 border-slate-200" />
                </div>
                <div className="flex gap-2 ml-auto items-center">
                  <Button variant="ghost" size="sm" onClick={() => fetchPayrollData(selectedMonthDoc.month, selectedMonthDoc.year)}><RefreshCcw className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"><FileDown className="w-4 h-4 mr-1" /> Xuất Excel Lương</Button>
                  {selectedMonthDoc.status === "draft" && <Button size="sm" onClick={() => handleToggleStatus("approved")} className="bg-[#0f172a] hover:bg-slate-800 rounded-xl"><Lock className="w-4 h-4 mr-1" /> Khóa Sổ</Button>}
                  {selectedMonthDoc.status === "approved" && <Button size="sm" variant="outline" onClick={() => handleToggleStatus("draft")} className="rounded-xl"><Unlock className="w-4 h-4 mr-1" /> Mở Khóa</Button>}
                  {selectedMonthDoc.status === "draft" && <Button size="sm" variant="destructive" onClick={handleDeleteMonth} className="rounded-xl"><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>

              {isDataLoading ? (
                <div className="bg-white h-64 rounded-2xl flex items-center justify-center"><Loader /></div>
              ) : (
                <TabPayrollTable filteredPayrolls={filteredPayrolls} editingRecords={editingRecords} isClosed={selectedMonthDoc.status !== "draft"} handleInputChange={handleInputChange} handleSaveRow={handleSaveRow} />
              )}
            </TabsContent>

            <TabsContent value="stats">
              <TabPayrollStats stats={stats} chartData={chartData} />
            </TabsContent>

            <TabsContent value="tax">
              <TabTaxSummary />
            </TabsContent>

          </Tabs>
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <Calculator className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-lg uppercase tracking-widest opacity-60">Vui lòng khởi tạo một bảng lương</p>
          </div>
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }`}</style>
    </div>
  );
}