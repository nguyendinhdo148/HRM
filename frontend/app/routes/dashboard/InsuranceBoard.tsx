import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, RefreshCcw, PlayCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import * as XLSX from "xlsx";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/insurance`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));

export default function InsuranceBoard() {
  const [monthsList, setMonthsList] = useState<{month: number, year: number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{month: number, year: number} | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        if (data.length > 0 && !selectedMonth) {
          setSelectedMonth(data[0]);
        }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchInsuranceData = async (m: number, y: number) => {
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
    if (!window.confirm(`Khởi tạo Bảng Bảo hiểm tháng ${newMonth}/${newYear}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ month: newMonth, year: newYear })
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        await fetchMonthsList();
        setSelectedMonth({ month: newMonth, year: newYear });
      } else alert(result.message);
    } catch (error) { console.error(error); alert("Lỗi khởi tạo"); }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonth) return;
    if (!window.confirm(`Bạn CÓ CHẮC CHẮN muốn xóa bảng bảo hiểm tháng ${selectedMonth.month}/${selectedMonth.year}? Dữ liệu sẽ không thể khôi phục!`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}?month=${selectedMonth.month}&year=${selectedMonth.year}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedMonth(null);
        setRecords([]);
        fetchMonthsList();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa bảng bảo hiểm!");
    }
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
        [`BẢNG TÍNH BẢO HIỂM THÁNG ${selectedMonth.month}/${selectedMonth.year}`], [],
        [`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, "", "", "", "", "", "", "", "", "", "", "", ""], []
      ];

      const header1 = [
        "STT", "Mã NV", "Tên", "Chức vụ", "Lương đóng BH", 
        "BHXH (18%)", "BHYT (3%)", "BHTN (0.5%)", "KPCĐ (2%)", "Tổng BH tính vào CP (DN)",
        "BHXH (8%)", "BHYT (1.5%)", "BHTN (1%)", "Tiền BH trừ vào lương (NLĐ)"
      ];
      tableData.push(header1);

      records.forEach((r, idx) => {
        tableData.push([
          idx + 1,
          r.employeeSnapshot?.employeeCode || "",
          r.employeeSnapshot?.fullName || "",
          r.employeeSnapshot?.position || "",
          r.insuranceSalary || 0,
          r.companyPays?.bhxh || 0,
          r.companyPays?.bhyt || 0,
          r.companyPays?.bhtn || 0,
          r.companyPays?.kpcd || 0,
          r.companyPays?.total || 0,
          r.employeePays?.bhxh || 0,
          r.employeePays?.bhyt || 0,
          r.employeePays?.bhtn || 0,
          r.employeePays?.total || 0
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(tableData);
      ws["!cols"] = [
        { wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 18 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
      ];
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];

      applyStyle(ws, "A1", { font: { bold: true, sz: 16, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "center", vertical: "center" }});
      
      for (let c = 0; c < header1.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 4, c });
        applyStyle(ws, cellRef, { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E40AF" } }, alignment: { horizontal: "center", vertical: "center" }});
      }

      XLSX.utils.book_append_sheet(wb, ws, "Bảng Bảo Hiểm");
      XLSX.writeFile(wb, `Bang_Bao_Hiem_T${selectedMonth.month}_${selectedMonth.year}.xlsx`);
    } catch (error) { console.error(error); alert("Lỗi khi xuất Excel."); } 
    finally { setIsExporting(false); }
  };

  useEffect(() => { fetchMonthsList(); }, []);
  useEffect(() => { 
    if (selectedMonth) fetchInsuranceData(selectedMonth.month, selectedMonth.year); 
  }, [selectedMonth]);

  if (isLoading && monthsList.length === 0) return <Loader />;

  return (
    <div className="w-full flex flex-col gap-6 p-5 min-h-screen bg-slate-50">
      
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e40af] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-7 h-7" /> Bảng Tính Bảo Hiểm
          </h1>
          <p className="text-slate-500 text-sm mt-1">Đóng full trên lương thực tế (Không áp dụng trần bảo hiểm)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc Tháng / Năm */}
          {monthsList.length > 0 && (
            <div className="flex bg-slate-100 p-1.5 rounded-lg border mr-2">
              <select 
                className="bg-transparent font-bold outline-none px-2 text-[#1e40af]" 
                value={selectedMonth ? `${selectedMonth.month}-${selectedMonth.year}` : ""} 
                onChange={e => {
                  const [m, y] = e.target.value.split('-');
                  setSelectedMonth({ month: Number(m), year: Number(y) });
                }}
              >
                {monthsList.map(m => (
                  <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>Kỳ {m.month}/{m.year}</option>
                ))}
              </select>
            </div>
          )}

          {/* Vùng Khởi tạo tháng mới */}
          <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1.5 text-sm outline-none" value={newYear} onChange={e => setNewYear(Number(e.target.value))}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button size="sm" onClick={handleInitMonth} className="bg-emerald-600 hover:bg-emerald-700 ml-1"><PlayCircle className="w-4 h-4 mr-1"/> Tạo Bảng</Button>
          </div>
          
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isExporting} className="text-emerald-700 border-emerald-600 hover:bg-emerald-50 ml-2">
            {isExporting ? <RefreshCcw className="w-4 h-4 mr-1 animate-spin"/> : <Download className="w-4 h-4 mr-1"/>}
            Xuất Excel
          </Button>
          
          {/* Nút Xóa */}
          {selectedMonth && (
            <Button size="sm" variant="destructive" onClick={handleDeleteMonth} className="ml-1 shadow-sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* BẢNG CẤU HÌNH TỶ LỆ */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full lg:w-[60%] text-sm border-collapse bg-white">
            <thead className="bg-[#0f172a] text-white">
              <tr>
                <th className="border border-slate-700 p-2">LOẠI BẢO HIỂM</th>
                <th className="border border-slate-700 p-2">DN Đóng (%)</th>
                <th className="border border-slate-700 p-2">NLĐ Đóng (%)</th>
                <th className="border border-slate-700 p-2">Tổng Cộng (%)</th>
              </tr>
            </thead>
            <tbody className="text-center font-medium">
              <tr><td className="border p-2 text-left font-bold text-slate-700">1. BHXH (Hưu trí, Tử tuất, TNLĐ)</td><td className="border p-2 text-blue-600 font-bold">18,0%</td><td className="border p-2">8,0%</td><td className="border p-2 text-[#1e40af] font-bold">26,0%</td></tr>
              <tr><td className="border p-2 text-left font-bold text-slate-700">2. BHYT</td><td className="border p-2">3,0%</td><td className="border p-2">1,5%</td><td className="border p-2 text-[#1e40af] font-bold">4,5%</td></tr>
              <tr><td className="border p-2 text-left font-bold text-slate-700">3. BHTN</td><td className="border p-2 text-blue-600 font-bold">0,5%</td><td className="border p-2">1,0%</td><td className="border p-2 text-[#1e40af] font-bold">1,5%</td></tr>
              <tr className="bg-slate-50 font-black text-rose-700"><td className="border p-2 text-left text-slate-800">Cộng Bảo Hiểm (32%)</td><td className="border p-2">21,5%</td><td className="border p-2">10,5%</td><td className="border p-2">32,0%</td></tr>
              <tr><td className="border p-2 text-left font-bold text-slate-700">4. KPCĐ (Kinh phí công đoàn)</td><td className="border p-2">2,0%</td><td className="border p-2">-</td><td className="border p-2 font-bold">2,0%</td></tr>
              <tr className="bg-[#eff6ff] font-black text-[#1e3a8a]"><td className="border p-2 text-left">TỔNG TOÀN BỘ CHI PHÍ</td><td className="border p-2">23,5%</td><td className="border p-2">10,5%</td><td className="border p-2">34,0%</td></tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* BẢNG TÍNH CHI TIẾT */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {isDataLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader /></div>
          ) : (
            <table className="w-full text-[11px] border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#0f172a] text-white">
                  <th rowSpan={2} className="border border-slate-700 p-3 text-center min-w-[50px]">STT</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-center min-w-[80px]">Mã NV</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-left min-w-[180px]">Tên</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-left min-w-[150px]">Chức vụ</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-right min-w-[120px]">Lương đóng BH</th>
                  
                  <th colSpan={4} className="border border-slate-700 p-2 text-center bg-[#1e3a8a]">BHXH, BHYT, BHTN tính vào chi phí DN</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-center bg-[#1e40af] font-bold">Tổng CP Doanh Nghiệp</th>
                  
                  <th colSpan={3} className="border border-slate-700 p-2 text-center bg-[#b91c1c]">Các khoản giảm trừ (NLĐ)</th>
                  <th rowSpan={2} className="border border-slate-700 p-3 text-center bg-[#9f1239] font-bold">Tiền BH trừ vào lương</th>
                </tr>
                <tr className="bg-[#1e293b] text-white text-[11px]">
                  <th className="border border-slate-700 p-2 text-center text-blue-200">BHXH (18%)</th>
                  <th className="border border-slate-700 p-2 text-center text-blue-200">BHYT (3%)</th>
                  <th className="border border-slate-700 p-2 text-center text-blue-200">BHTN (0.5%)</th>
                  <th className="border border-slate-700 p-2 text-center text-blue-200">KPCĐ (2%)</th>
                  
                  <th className="border border-slate-700 p-2 text-center text-rose-200">BHXH (8%)</th>
                  <th className="border border-slate-700 p-2 text-center text-rose-200">BHYT (1.5%)</th>
                  <th className="border border-slate-700 p-2 text-center text-rose-200">BHTN (1%)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {records.length === 0 ? (
                  <tr><td colSpan={14} className="text-center p-10 text-slate-400 font-medium">Chưa có dữ liệu bảo hiểm tháng này. Vui lòng nhấn Tạo Bảng.</td></tr>
                ) : records.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-slate-50 border-b">
                    <td className="p-2 border-r text-center">{idx + 1}</td>
                    <td className="p-2 border-r text-center font-medium">{r.employeeSnapshot?.employeeCode}</td>
                    <td className="p-2 border-r font-bold text-slate-800">{r.employeeSnapshot?.fullName}</td>
                    <td className="p-2 border-r text-slate-600">{r.employeeSnapshot?.position}</td>
                    <td className="p-2 border-r text-right font-bold text-slate-800 bg-slate-50">
                      {formatMoney(r.insuranceSalary)}
                    </td>
                    
                    {/* DOANH NGHIỆP TRẢ */}
                    <td className="p-2 border-r text-right text-blue-800">{formatMoney(r.companyPays?.bhxh)}</td>
                    <td className="p-2 border-r text-right text-blue-800">{formatMoney(r.companyPays?.bhyt)}</td>
                    <td className="p-2 border-r text-right text-blue-800">{formatMoney(r.companyPays?.bhtn)}</td>
                    <td className="p-2 border-r text-right text-blue-800">{formatMoney(r.companyPays?.kpcd)}</td>
                    <td className="p-2 border-r text-right font-black text-blue-700 bg-blue-50/50">{formatMoney(r.companyPays?.total)}</td>

                    {/* NLĐ TRẢ */}
                    <td className="p-2 border-r text-right text-rose-700">{formatMoney(r.employeePays?.bhxh)}</td>
                    <td className="p-2 border-r text-right text-rose-700">{formatMoney(r.employeePays?.bhyt)}</td>
                    <td className="p-2 border-r text-right text-rose-700">{formatMoney(r.employeePays?.bhtn)}</td>
                    <td className="p-2 border-r text-right font-black text-rose-700 bg-rose-50/50">{formatMoney(r.employeePays?.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
    </div>
  );
}