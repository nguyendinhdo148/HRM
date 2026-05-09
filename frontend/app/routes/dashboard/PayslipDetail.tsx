/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import XLSX from "xlsx-js-style"; // THAY ĐỔI IMPORT THƯ VIỆN NÀY
import toast from "react-hot-toast";
import { FileSpreadsheet, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL;

const PayslipDetail = () => {
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/payroll/record/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setRecord(res.data.data || res.data.record);
        }
      } catch (error) {
        toast.error("Không thể tải phiếu lương này.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchPayslip();
  }, [id]);

  const formatMoney = (amount: number) => {
    if (!amount) return "-";
    return amount.toLocaleString("vi-VN");
  };

  const handleExportSingleExcel = () => {
    if (!record) return;
    const { employeeSnapshot, incomes, deductions, month, year, actualDays, netSalary } = record;
    const allw = incomes.allowances || {};
    const ins = deductions.insurance || {};

    // --- ĐỊNH NGHĨA STYLE CHO EXCEL ---
    const FONT_NAME = "Times New Roman";
    const BORDER_ALL = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } }
    };

    const titleStyle = { font: { name: FONT_NAME, sz: 14, bold: true }, alignment: { horizontal: "center" } };
    const headerStyle = { font: { name: FONT_NAME, sz: 16, bold: true }, alignment: { horizontal: "center" } };
    const dateStyle = { font: { name: FONT_NAME, sz: 12, italic: true }, alignment: { horizontal: "center" } };
    const rightBoldStyle = { font: { name: FONT_NAME, sz: 11, bold: true }, alignment: { horizontal: "right" } };
    
    // Style trong bảng (Bỏ numFmt vì giờ mình truyền chuỗi String đã format dấu chấm)
    const tblHeader = { font: { name: FONT_NAME, sz: 12, bold: true }, border: BORDER_ALL };
    const cellLeft = { font: { name: FONT_NAME, sz: 12 }, border: BORDER_ALL };
    const cellRight = { font: { name: FONT_NAME, sz: 12 }, alignment: { horizontal: "right" }, border: BORDER_ALL }; 
    
    const cellLeftBold = { font: { name: FONT_NAME, sz: 12, bold: true }, border: BORDER_ALL };
    const cellRightBold = { font: { name: FONT_NAME, sz: 12, bold: true }, alignment: { horizontal: "right" }, border: BORDER_ALL };

    // --- XÂY DỰNG DATA VÀ ÉP DẤU CHẤM BẰNG formatMoney() ---
    const wsData = [
      [{ v: "CÔNG TY CỔ PHẦN XYZ", s: titleStyle }, { v: "", s: titleStyle }],
      [{ v: "PHIẾU LƯƠNG NHÂN VIÊN", s: headerStyle }, { v: "", s: headerStyle }],
      [{ v: `Tháng ${month < 10 ? '0'+month : month} năm ${year}`, s: dateStyle }, { v: "", s: dateStyle }],
      [{ v: "", s: {} }, { v: `Phiếu số: ${month}${year}`, s: rightBoldStyle }],
      
      [{ v: "Thông tin người lĩnh", s: tblHeader }, { v: "", s: tblHeader }],
      [{ v: "Họ và tên:", s: cellLeft }, { v: employeeSnapshot.fullName, s: cellLeft }],
      [{ v: "Mã nhân viên:", s: cellLeft }, { v: employeeSnapshot.employeeCode, s: cellLeft }],
      
      [{ v: "Tiền lương chi tiết (1)", s: cellLeftBold }, { v: formatMoney(incomes.totalGross), s: cellRightBold }],
      [{ v: "Số công làm việc ngày thường", s: cellLeft }, { v: actualDays || 0, s: cellRight }],
      [{ v: "Tiền lương làm việc ngày thường", s: cellLeft }, { v: formatMoney(incomes.timeSalary), s: cellRight }],
      [{ v: "Tiền lương làm thêm giờ", s: cellLeft }, { v: formatMoney(incomes.overtime), s: cellRight }],
      [{ v: "Tiền ăn ca", s: cellLeft }, { v: formatMoney(allw.meal), s: cellRight }],
      [{ v: "Phụ cấp xăng xe", s: cellLeft }, { v: formatMoney(allw.transport), s: cellRight }],
      [{ v: "Phụ cấp điện thoại", s: cellLeft }, { v: formatMoney(allw.phone), s: cellRight }],
      [{ v: "Phụ cấp trang phục", s: cellLeft }, { v: formatMoney(allw.clothing), s: cellRight }],
      [{ v: "Phụ cấp nhà ở", s: cellLeft }, { v: formatMoney(allw.housing), s: cellRight }],
      
      [{ v: "Các khoản giảm trừ (2)", s: cellLeftBold }, { v: formatMoney(deductions.totalDeductions), s: cellRightBold }],
      [{ v: "Bảo hiểm", s: cellLeft }, { v: formatMoney(ins.total), s: cellRight }],
      [{ v: "Thuế TNCN", s: cellLeft }, { v: formatMoney(deductions.taxTNCN), s: cellRight }],
      [{ v: "Tạm ứng", s: cellLeft }, { v: formatMoney(deductions.advance), s: cellRight }],
      
      [{ v: "Tổng số thực lĩnh (3) = (1) - (2)", s: { ...cellLeftBold, font: { name: FONT_NAME, sz: 13, bold: true } } }, { v: formatMoney(netSalary), s: { ...cellRightBold, font: { name: FONT_NAME, sz: 13, bold: true } } }],
      
      [{ v: "Ghi chú:", s: { font: { name: FONT_NAME, sz: 12, bold: true, italic: true }, border: BORDER_ALL } }, { v: "", s: { border: BORDER_ALL } }],
      [{ v: "", s: { border: BORDER_ALL } }, { v: "", s: { border: BORDER_ALL } }]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: 21, c: 0 }, e: { r: 21, c: 1 } },
      { s: { r: 22, c: 0 }, e: { r: 22, c: 1 } }
    ];

    ws["!cols"] = [{ wch: 45 }, { wch: 25 }];
    ws["!rows"] = [];
    ws["!rows"][22] = { hpt: 40 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PhieuLuong");
    XLSX.writeFile(wb, `PhieuLuong_${employeeSnapshot.employeeCode}_T${month}_${year}.xlsx`);
  };
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
  }

  if (!record) return <div className="text-center p-10 text-xl font-bold">Không tìm thấy phiếu lương</div>;

  const emp = record.employeeSnapshot;
  const inc = record.incomes;
  const ded = record.deductions;
  const allw = inc.allowances || {};
  const ins = ded.insurance || {};

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-2xl p-6 sm:p-10 relative border border-gray-300">
        
        {/* Thanh công cụ */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Button variant="ghost" onClick={() => window.close()} className="text-gray-600 hover:text-gray-900 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Đóng tab
          </Button>
          <Button onClick={handleExportSingleExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel
          </Button>
        </div>

        {/* NỘI DUNG PHIẾU LƯƠNG - Ép font Times New Roman */}
        <div style={{ fontFamily: "'Times New Roman', Times, serif" }} className="text-black">
          <div className="uppercase text-lg font-bold">CÔNG TY CỔ PHẦN XYZ</div>
          
          <div className="text-center mt-6 mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-wider m-0">PHIẾU LƯƠNG NHÂN VIÊN</h1>
            <div className="text-md italic mt-1">
              Tháng {record.month < 10 ? '0'+record.month : record.month} năm {record.year}
            </div>
          </div>
          
          <div className="text-right font-bold mb-2">
            Phiếu số: {record.month}{record.year}
          </div>

          {/* Bảng */}
          <table className="w-full border-collapse border border-black text-[15px]">
            <tbody>
              {/* Info */}
              <tr className="border border-black font-bold">
                <td colSpan={2} className="p-2">Thông tin người lĩnh</td>
              </tr>
              <tr className="border-x border-black">
                <td colSpan={2} className="p-1.5 pl-2">Họ và tên: {emp.fullName}</td>
              </tr>
              <tr className="border border-black">
                <td colSpan={2} className="p-1.5 pl-2">Mã nhân viên: {emp.employeeCode}</td>
              </tr>

              {/* Incomes */}
              <tr className="border-b border-black font-bold bg-gray-50/50">
                <td className="p-2 border-r border-black">Tiền lương chi tiết (1)</td>
                <td className="p-2 text-right">{formatMoney(inc.totalGross)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Số công làm việc ngày thường</td>
                <td className="p-1.5 pr-2 text-right">{record.actualDays || 0}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Tiền lương làm việc ngày thường</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(inc.timeSalary)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Tiền lương làm thêm giờ</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(inc.overtime || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Tiền ăn ca.</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(allw.meal || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Phụ cấp xăng xe.</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(allw.transport || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Phụ cấp điện thoại.</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(allw.phone || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Phụ cấp trang phục.</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(allw.clothing || 0)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1.5 pl-2 border-r border-black">Phụ cấp nhà ở.</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(allw.housing || 0)}</td>
              </tr>

              {/* Deductions */}
              <tr className="border-b border-black font-bold bg-gray-50/50">
                <td className="p-2 border-r border-black">Các khoản giảm trừ (2)</td>
                <td className="p-2 text-right">{formatMoney(ded.totalDeductions || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Bảo hiểm</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(ins.total || 0)}</td>
              </tr>
              <tr>
                <td className="p-1.5 pl-2 border-r border-black">Thuế TNCN</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(ded.taxTNCN || 0)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1.5 pl-2 border-r border-black">Tạm ứng</td>
                <td className="p-1.5 pr-2 text-right">{formatMoney(ded.advance || 0)}</td>
              </tr>

              {/* Net Salary */}
              <tr className="border-b border-black font-bold text-[16px]">
                <td className="p-3 border-r border-black">Tổng số thực lĩnh (3) = (1) - (2)</td>
                <td className="p-3 text-right">{formatMoney(record.netSalary)}</td>
              </tr>

              {/* Note */}
              <tr className="border-b border-black font-bold italic">
                <td colSpan={2} className="p-2">Ghi chú:</td>
              </tr>
              <tr>
                <td colSpan={2} className="h-20"></td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 text-center text-xs text-gray-500 italic">
            (Phiếu lương được trích xuất tự động từ hệ thống)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;