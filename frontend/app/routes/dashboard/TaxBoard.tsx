import React, { useState, useEffect } from "react";
import { Calculator, Download, PlayCircle, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/loader";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/tax`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));

export default function TaxBoard() {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const currentDate = new Date();
  const [newMonth, setNewMonth] = useState(currentDate.getMonth() + 1);
  const [newYear, setNewYear] = useState(currentDate.getFullYear());

  const monthsListSorted = React.useMemo(() => {
    return [...monthsList].sort((a, b) => b.year - a.year || b.month - a.month);
  }, [monthsList]);

  const fetchMonthsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/months`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMonthsList(data);
        if (data.length > 0 && !selectedMonth) setSelectedMonth(data[0]);
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchTaxData = async (m: number, y: number) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?month=${m}&year=${y}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
  };

  const handleInitMonth = async () => {
    if (!window.confirm(`Khởi tạo Bảng Thuế TNCN? (Hệ thống sẽ kéo Lương Gross & Tiền BH từ các bảng đã tạo sang)`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ month: newMonth, year: newYear })
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        await fetchMonthsList();
        setSelectedMonth({ month: newMonth, year: newYear });
      } else alert(result.message);
    } catch (error) { alert("Lỗi khởi tạo"); }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonth) return;
    if (!window.confirm(`Xóa toàn bộ Bảng Thuế tháng ${selectedMonth.month}/${selectedMonth.year}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}?month=${selectedMonth.month}&year=${selectedMonth.year}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        alert("Đã xóa");
        setSelectedMonth(null);
        setRecords([]);
        fetchMonthsList();
      }
    } catch (error) { console.error(error); }
  };

  const handleExportExcel = () => { alert("Đang tải..."); };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { if (selectedMonth) fetchTaxData(selectedMonth.month, selectedMonth.year); }, [selectedMonth]);

  if (isLoading && monthsListSorted.length === 0) return <Loader />;

  return (
    <div className="w-full flex flex-col gap-6 p-5 min-h-screen bg-slate-50">
      
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e40af] uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-7 h-7" /> Bảng Tính Thuế TNCN
          </h1>
          <p className="text-slate-500 text-sm mt-1">Chuẩn thuế lũy tiến mới (Tổng Cục Thuế)</p>
        </div>
        
        <div className="flex items-center gap-3">
          {monthsListSorted.length > 0 && (
            <div className="flex bg-slate-100 p-1.5 rounded-lg border mr-4">
              <select className="bg-transparent font-bold outline-none px-2 text-[#1e40af]" value={selectedMonth ? `${selectedMonth.month}-${selectedMonth.year}` : ""} onChange={e => { const [m, y] = e.target.value.split('-'); setSelectedMonth({ month: Number(m), year: Number(y) }); }}>
                {monthsListSorted.map(m => <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>Kỳ {m.month}/{m.year}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>{[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newYear} onChange={e => setNewYear(Number(e.target.value))}>{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
            <Button size="sm" onClick={handleInitMonth} className="bg-blue-600 hover:bg-blue-700 ml-1"><PlayCircle className="w-4 h-4 mr-1"/> Tạo Bảng</Button>
          </div>
          <Button size="sm" variant="outline" onClick={handleExportExcel} className="text-emerald-700 border-emerald-600 hover:bg-emerald-50 ml-2"><Download className="w-4 h-4 mr-1"/> Xuất Excel</Button>
          {selectedMonth && <Button size="sm" variant="destructive" onClick={handleDeleteMonth} className="ml-1"><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </div>

      {/* NOTE MÀU VÀNG */}
      <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-sm font-medium text-yellow-900 leading-relaxed">
          <strong>Lưu ý: Bảng thuế cập nhật mới</strong><br/>
          + Mức Giảm Trừ Gia Cảnh bản thân Tăng Lên <strong>15,5 Triệu Đồng/ Tháng</strong>.<br/>
          + Mỗi Người Phụ Thuộc <strong>6,2 Triệu/ Tháng</strong>.<br/>
          + <strong>Công thức tính thuế:</strong> Thu nhập tính thuế = Thu nhập chịu thuế - Giảm trừ bản thân - NPT - Tiền ăn - BHXH
        </div>
      </div>

      {/* BẢNG TÍNH CHI TIẾT */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isDataLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader /></div>
          ) : (
            <table className="w-full text-xs border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-[#0f172a] text-white">
                  <th className="border border-slate-700 p-3 text-center">STT</th>
                  <th className="border border-slate-700 p-3 text-center">Mã NV</th>
                  <th className="border border-slate-700 p-3 text-left">Họ và tên</th>
                  <th className="border border-slate-700 p-3 text-left">Chức vụ</th>
                  <th className="border border-slate-700 p-3 text-right text-emerald-300">Thu nhập chịu thuế</th>
                  <th className="border border-slate-700 p-3 text-right text-emerald-300">Tiền ăn</th>
                  <th className="border border-slate-700 p-3 text-right">Giảm trừ bản thân</th>
                  <th className="border border-slate-700 p-3 text-center">Số NPT</th>
                  <th className="border border-slate-700 p-3 text-right">Giảm trừ NPT</th>
                  <th className="border border-slate-700 p-3 text-right">BH trừ vào lương</th>
                  <th className="border border-slate-700 p-3 text-right">Tổng giảm trừ</th>
                  <th className="border border-slate-700 p-3 text-right bg-blue-900/50">Thu nhập tính thuế</th>
                  <th className="border border-slate-700 p-3 text-right bg-rose-900/50 font-bold">Thuế TNCN</th>
                </tr>
                <tr className="bg-slate-800 text-slate-400 text-[10px] font-mono">
                  <th className="border border-slate-700 p-1">A</th><th className="border border-slate-700 p-1">B</th><th className="border border-slate-700 p-1">C</th><th className="border border-slate-700 p-1">D</th><th className="border border-slate-700 p-1">E</th><th className="border border-slate-700 p-1">F</th><th className="border border-slate-700 p-1">G</th><th className="border border-slate-700 p-1">H</th><th className="border border-slate-700 p-1">I</th><th className="border border-slate-700 p-1">J</th><th className="border border-slate-700 p-1">K</th><th className="border border-slate-700 p-1">L</th><th className="border border-slate-700 p-1">M</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {records.length === 0 ? (
                  <tr><td colSpan={13} className="text-center p-10 text-slate-400">Chưa có dữ liệu</td></tr>
                ) : records.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-slate-50 border-b">
                    <td className="p-2 border-r text-center">{idx + 1}</td>
                    <td className="p-2 border-r text-center font-medium">{r.employeeSnapshot?.employeeCode}</td>
                    <td className="p-2 border-r font-bold text-slate-800">{r.employeeSnapshot?.fullName}</td>
                    <td className="p-2 border-r text-slate-600">{r.employeeSnapshot?.position}</td>
                    
                    {/* E: Thu nhập chịu thuế (Bây giờ là read-only vì Backend tự kéo) */}
                    <td className="p-2 border-r text-right font-bold text-slate-800 bg-emerald-50/30">
                      {formatMoney(r.taxableIncome)}
                    </td>

                    <td className="p-2 border-r text-right font-bold text-emerald-700 bg-emerald-50/20">{formatMoney(r.allowances?.meal)}</td>
                    <td className="p-2 border-r text-right font-medium text-slate-600">{formatMoney(r.deductions?.personal)}</td>
                    
                    {/* G: Số người phụ thuộc (Tự động chia từ tiền giảm trừ) */}
                    <td className="p-2 border-r text-center font-bold text-slate-700">
                      {(r.deductions?.dependent || 0) / 6200000}
                    </td>

                    <td className="p-2 border-r text-right font-medium text-slate-600">{formatMoney(r.deductions?.dependent)}</td>
                    <td className="p-2 border-r text-right font-medium text-slate-600">{formatMoney(r.deductions?.insurance)}</td>
                    <td className="p-2 border-r text-right font-bold text-slate-700">{formatMoney(r.deductions?.total)}</td>
                    
                    <td className="p-2 border-r text-right font-bold text-blue-700 bg-blue-50/30">{r.assessableIncome > 0 ? formatMoney(r.assessableIncome) : "-"}</td>
                    <td className="p-2 border-r text-right font-black text-rose-600 bg-rose-50/50">{r.taxAmount > 0 ? formatMoney(r.taxAmount) : "-"}</td>
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