import React, { useState, useEffect } from "react";
import { Clock, Download, PlayCircle, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import * as XLSX from "xlsx";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/overtime-pay`;

const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));

export default function OvertimePayBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());
  const [standardDays, setStandardDays] = useState(26); 

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchMonthsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/months`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMonthsList(data);
      if (data.length > 0 && !selectedMonth) setSelectedMonth(data[0]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchOTData = async (m: number, y: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${m}&year=${y}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setRecords(data);
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  const handleInit = async () => {
    if (!window.confirm(`Tính lương OT tháng ${newMonth}/${newYear} với công chuẩn ${standardDays} ngày?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ month: newMonth, year: newYear, standardDays }) 
      });
      const data = await res.json();
      if (res.ok) { 
        fetchMonthsList(); 
        setSelectedMonth({ month: newMonth, year: newYear });
        alert(data.message); 
      } else { alert("❌ Lỗi: " + data.message); }
    } catch (error) { alert("Lỗi kết nối máy chủ"); }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonth) return;
    if (!window.confirm(`Xóa toàn bộ Bảng tính OT tháng ${selectedMonth.month}/${selectedMonth.year}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}?month=${selectedMonth.month}&year=${selectedMonth.year}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        setSelectedMonth(null);
        setRecords([]);
        fetchMonthsList();
      }
    } catch (error) { console.error(error); }
  };

  const handleExportExcel = async () => {
    if (!selectedMonth || records.length === 0) return alert("Không có dữ liệu để xuất!");
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const wb = XLSX.utils.book_new();

      const applyStyle = (sheet: any, cell: string, style: any) => {
        if (!sheet[cell]) sheet[cell] = { t: "s", v: "" };
        sheet[cell].s = { ...(sheet[cell].s || {}), ...style };
      };

      const tableData = [
        [`BẢNG TÍNH LƯƠNG LÀM THÊM GIỜ THÁNG ${selectedMonth.month}/${selectedMonth.year}`], [],
        [`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], []
      ];

      const header1 = ["STT", "Mã NV", "Họ và tên", "Chức vụ", "Lương gốc", "Lương Ngày", "Lương Giờ", "Làm thêm GIỜ (100%)", "", "Làm Đêm/Thường [X] (150%)", "", "Ngày nghỉ [N] (200%)", "", "Lễ tết [T] (300%)", "", "Tổng Tiền"];
      const header2 = ["", "", "", "", "", "", "", "Số Giờ", "Thành tiền", "Số Ngày", "Thành tiền", "Số Ngày", "Thành tiền", "Số Ngày", "Thành tiền", ""];
      tableData.push(header1); tableData.push(header2);

      records.forEach((r, idx) => {
        tableData.push([
          idx + 1, r.employeeSnapshot?.employeeCode, r.employeeSnapshot?.fullName, r.employeeSnapshot?.position,
          r.baseSalary, r.dailyRate, r.hourlyRate,
          r.otData?.hours || 0, r.amounts?.hoursMoney || 0,
          r.otData?.normalDays || 0, r.amounts?.normalMoney || 0,
          r.otData?.weekendDays || 0, r.amounts?.weekendMoney || 0,
          r.otData?.holidayDays || 0, r.amounts?.holidayMoney || 0,
          r.amounts?.totalMoney || 0
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(tableData);
      ws["!cols"] = [{wch: 5}, {wch: 10}, {wch: 25}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 8}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 20}];
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
        { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
        { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } },
        { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } },
        { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } },
        { s: { r: 4, c: 9 }, e: { r: 4, c: 10 } },
        { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } },
        { s: { r: 4, c: 13 }, e: { r: 4, c: 14 } },
        { s: { r: 4, c: 15 }, e: { r: 5, c: 15 } }
      ];

      applyStyle(ws, "A1", { font: { bold: true, sz: 16, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "center", vertical: "center" }});
      
      for (let c = 0; c < header1.length; c++) {
        applyStyle(ws, XLSX.utils.encode_cell({ r: 4, c }), { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E40AF" } }, alignment: { horizontal: "center", vertical: "center" }});
        applyStyle(ws, XLSX.utils.encode_cell({ r: 5, c }), { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 }, fill: { fgColor: { rgb: "2563EB" } }, alignment: { horizontal: "center", vertical: "center" }});
      }

      XLSX.utils.book_append_sheet(wb, ws, "Lương OT");
      XLSX.writeFile(wb, `Bang_OT_T${selectedMonth.month}_${selectedMonth.year}.xlsx`);
    } catch (error) { console.error(error); alert("Lỗi xuất Excel"); } finally { setIsExporting(false); }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { if (selectedMonth) fetchOTData(selectedMonth.month, selectedMonth.year); }, [selectedMonth]);

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="w-full flex flex-col gap-6 p-5 min-h-screen bg-slate-50">
      
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
        <h1 className="text-2xl font-black text-[#1e3a8a] uppercase flex items-center gap-2">
          <Clock className="w-7 h-7" /> Bảng Tính Lương OT
        </h1>
        
        <div className="flex items-center gap-3">
          {monthsList.length > 0 && (
            <div className="flex bg-slate-100 p-1.5 rounded-lg border mr-2">
              <select className="bg-transparent font-bold outline-none px-2 text-[#1e3a8a]" value={selectedMonth ? `${selectedMonth.month}-${selectedMonth.year}` : ""} onChange={e => { const [m, y] = e.target.value.split('-'); setSelectedMonth({ month: Number(m), year: Number(y) }); }}>
                {monthsList.map(m => <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>Kỳ {m.month}/{m.year}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>{[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newYear} onChange={e => setNewYear(Number(e.target.value))}>{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
            
            <div className="flex items-center bg-slate-50 border rounded-md px-2 py-1.5 text-sm">
              <Settings2 className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 mr-1 text-xs">Công chia:</span>
              <input type="number" className="w-10 bg-transparent outline-none font-bold text-blue-700" value={standardDays} onChange={e => setStandardDays(Number(e.target.value))} />
            </div>

            <Button size="sm" onClick={handleInit} className="bg-[#1e3a8a] hover:bg-blue-900 ml-1"><PlayCircle className="w-4 h-4 mr-1"/> Tính Lương OT</Button>
          </div>
          
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isExporting} className="text-emerald-700 border-emerald-600 hover:bg-emerald-50 ml-1">
            {isExporting ? "Đang tải..." : <><Download className="w-4 h-4 mr-1"/> Xuất Excel</>}
          </Button>
          {selectedMonth && <Button size="sm" variant="destructive" onClick={handleDeleteMonth} className="ml-1"><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {isDataLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader /></div>
          ) : (
            <table className="w-full text-[11px] border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#1e3a8a] text-white">
                  <th rowSpan={2} className="border border-blue-800 p-2">STT</th>
                  <th rowSpan={2} className="border border-blue-800 p-2">Mã NV</th>
                  <th rowSpan={2} className="border border-blue-800 p-2 text-left">Họ và tên</th>
                  <th rowSpan={2} className="border border-blue-800 p-2 text-left">Chức vụ</th>
                  <th rowSpan={2} className="border border-blue-800 p-2 text-right">Lương gốc</th>
                  <th rowSpan={2} className="border border-blue-800 p-2 text-right">Lương ngày<br/><span className="text-[9px] font-normal opacity-70">(/ {records[0]?.standardDays || standardDays})</span></th>
                  <th rowSpan={2} className="border border-blue-800 p-2 text-right">Lương giờ<br/><span className="text-[9px] font-normal opacity-70">(/ 8)</span></th>
                  
                  <th colSpan={2} className="border border-blue-800 p-2 bg-emerald-700">Làm thêm GIỜ (100%)</th>
                  <th colSpan={2} className="border border-blue-800 p-2 bg-blue-700">Đêm/Thường [X] (150%)</th>
                  <th colSpan={2} className="border border-blue-800 p-2 bg-blue-800">Ngày nghỉ [N] (200%)</th>
                  <th colSpan={2} className="border border-blue-800 p-2 bg-blue-700">Lễ tết [T] (300%)</th>
                  
                  <th rowSpan={2} className="border border-blue-800 p-2 bg-[#0f172a] font-black text-sm">Thành tiền OT</th>
                </tr>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-blue-800 p-1 w-12 bg-emerald-800 text-emerald-200">Giờ</th><th className="border border-blue-800 p-1 bg-emerald-800">Số tiền</th>
                  <th className="border border-blue-800 p-1 w-12 text-slate-300">Ngày</th><th className="border border-blue-800 p-1 text-blue-200">Số tiền</th>
                  <th className="border border-blue-800 p-1 w-12 text-amber-300">Ngày</th><th className="border border-blue-800 p-1 text-blue-200">Số tiền</th>
                  <th className="border border-blue-800 p-1 w-12 text-rose-300">Ngày</th><th className="border border-blue-800 p-1 text-blue-200">Số tiền</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {records.length === 0 ? (
                  <tr><td colSpan={16} className="text-center p-10 text-slate-400">Chưa có dữ liệu. Vui lòng bấm Tính Lương OT.</td></tr>
                ) : records.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-blue-50 border-b transition-colors">
                    <td className="p-2 border-r text-center">{idx + 1}</td>
                    <td className="p-2 border-r text-center font-bold text-blue-700">{r.employeeSnapshot?.employeeCode}</td>
                    <td className="p-2 border-r font-bold text-slate-800">{r.employeeSnapshot?.fullName}</td>
                    <td className="p-2 border-r text-slate-500">{r.employeeSnapshot?.position}</td>
                    
                    <td className="p-2 border-r text-right font-medium">{formatMoney(r.baseSalary)}</td>
                    <td className="p-2 border-r text-right text-emerald-600 font-bold bg-emerald-50/50">{formatMoney(r.dailyRate)}</td>
                    <td className="p-2 border-r text-right text-emerald-700 bg-emerald-50/30">{formatMoney(r.hourlyRate)}</td>
                    
                    {/* Giờ OT */}
                    <td className="p-2 border-r text-center font-bold bg-emerald-50/50">{r.otData?.hours || 0}</td>
                    <td className="p-2 border-r text-right font-bold text-emerald-700 bg-emerald-50/30">{formatMoney(r.amounts?.hoursMoney || 0)}</td>

                    {/* Ngày OT */}
                    <td className="p-2 border-r text-center font-bold">{r.otData?.normalDays || 0}</td>
                    <td className="p-2 border-r text-right text-blue-700">{formatMoney(r.amounts?.normalMoney || 0)}</td>
                    
                    <td className="p-2 border-r text-center font-bold text-amber-600">{r.otData?.weekendDays || 0}</td>
                    <td className="p-2 border-r text-right text-blue-700">{formatMoney(r.amounts?.weekendMoney || 0)}</td>
                    
                    <td className="p-2 border-r text-center font-bold text-rose-600">{r.otData?.holidayDays || 0}</td>
                    <td className="p-2 border-r text-right text-blue-700">{formatMoney(r.amounts?.holidayMoney || 0)}</td>
                    
                    {/* Tổng cộng */}
                    <td className="p-2 text-right font-black text-rose-600 bg-slate-50 text-[13px]">{formatMoney(r.amounts?.totalMoney || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}