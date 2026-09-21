/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import XLSX from "xlsx-js-style";
import toast from "react-hot-toast";
import { FileSpreadsheet, Loader2, ArrowLeft, Printer } from "lucide-react";
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
    if (!amount || Number(amount) === 0) return "-";
    return Number(amount).toLocaleString("vi-VN");
  };

  const hasValue = (value: any) => {
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return Number(value) > 0;
    return Boolean(value);
  };

  const getPayslipCode = (employeeCode: string, monthValue: number, yearValue: number) => {
    const safeCode = String(employeeCode || "").trim();
    return `${yearValue}${String(monthValue).padStart(2, "0")}${safeCode}`;
  };

  // ===== XUẤT EXCEL (giữ nguyên logic, chỉ đổi style cho đẹp) =====
  const handleExportSingleExcel = () => {
    if (!record) return;
    const { employeeSnapshot, incomes, deductions, month, year, actualDays, netSalary } = record;
    const allw = incomes.allowances || {};
    const ins = deductions.insurance || {};
    const housingValue = Number(allw.housingAllowance ?? allw.housing ?? 0);
    const payslipCode = getPayslipCode(employeeSnapshot?.employeeCode || "", month, year);

    const incomeRows = [
      ["Số công làm việc ngày thường", actualDays],
      ["Tiền lương làm việc ngày thường", incomes.timeSalary],
      ["Tiền lương làm thêm giờ", incomes.overtime],
      ["Tiền ăn ca", allw.meal],
      ["Phụ cấp xăng xe", allw.transport],
      ["Phụ cấp điện thoại", allw.phone],
      ["Phụ cấp trang phục", allw.clothing],
      ["Phụ cấp nhà ở", housingValue],
    ].filter(([_, value]) => hasValue(value));

    const deductionRows = [
      ["Bảo hiểm", ins.total],
      ["Thuế TNCN", deductions.taxTNCN],
      ["Tạm ứng", deductions.advance],
    ].filter(([_, value]) => hasValue(value));

    // --- STYLE ---
    const FONT_NAME = "Times New Roman";
    const BORDER_ALL = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } }
    };

    const titleStyle = { font: { name: FONT_NAME, sz: 14, bold: true }, alignment: { horizontal: "center" } };
    const headerStyle = { font: { name: FONT_NAME, sz: 16, bold: true, color: { rgb: "1E40AF" } }, alignment: { horizontal: "center" } };
    const dateStyle = { font: { name: FONT_NAME, sz: 12, italic: true }, alignment: { horizontal: "center" } };
    const rightBoldStyle = { font: { name: FONT_NAME, sz: 11, bold: true }, alignment: { horizontal: "right" } };

    const tblHeader = {
      font: { name: FONT_NAME, sz: 12, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E40AF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_ALL
    };
    const cellLeft = { font: { name: FONT_NAME, sz: 12 }, border: BORDER_ALL };
    const cellRight = { font: { name: FONT_NAME, sz: 12 }, alignment: { horizontal: "right" }, border: BORDER_ALL };

    // Dòng Tổng thu nhập - nền vàng nhạt
    const cellLeftBoldAmber = {
      font: { name: FONT_NAME, sz: 12, bold: true, color: { rgb: "92400E" } },
      fill: { fgColor: { rgb: "FEF3C7" } },
      border: BORDER_ALL
    };
    const cellRightBoldAmber = {
      font: { name: FONT_NAME, sz: 12, bold: true, color: { rgb: "92400E" } },
      alignment: { horizontal: "right" },
      fill: { fgColor: { rgb: "FEF3C7" } },
      border: BORDER_ALL
    };

    // Dòng Thực lĩnh - nền xanh lá nhạt
    const cellLeftBoldGreen = {
      font: { name: FONT_NAME, sz: 13, bold: true, color: { rgb: "065F46" } },
      fill: { fgColor: { rgb: "D1FAE5" } },
      border: BORDER_ALL
    };
    const cellRightBoldGreen = {
      font: { name: FONT_NAME, sz: 13, bold: true, color: { rgb: "065F46" } },
      alignment: { horizontal: "right" },
      fill: { fgColor: { rgb: "D1FAE5" } },
      border: BORDER_ALL
    };

    // --- BUILD DATA ---
    const wsData: any[] = [
      [{ v: "CÔNG TY CỔ PHẦN XYZ", s: titleStyle }, { v: "", s: titleStyle }],
      [{ v: "PHIẾU LƯƠNG NHÂN VIÊN", s: headerStyle }, { v: "", s: headerStyle }],
      [{ v: `Tháng ${month < 10 ? '0' + month : month} năm ${year}`, s: dateStyle }, { v: "", s: dateStyle }],
      [{ v: "", s: {} }, { v: `Phiếu số: ${payslipCode}`, s: rightBoldStyle }],

      [{ v: "Thông tin người lĩnh", s: tblHeader }, { v: "", s: tblHeader }],
      [{ v: "Họ và tên:", s: cellLeft }, { v: employeeSnapshot.fullName || "-", s: cellLeft }],
      [{ v: "Mã nhân viên:", s: cellLeft }, { v: employeeSnapshot.employeeCode || "-", s: cellLeft }],

      // Header bảng thu nhập
      [{ v: "Khoản thu nhập", s: tblHeader }, { v: "Số tiền (VNĐ)", s: tblHeader }],
      ...incomeRows.map(([label, value]) => [
        { v: label, s: cellLeft },
        { v: typeof value === "number" ? formatMoney(value) : value, s: cellRight }
      ]),

      // Header bảng giảm trừ
      [{ v: "Các khoản giảm trừ", s: tblHeader }, { v: "Số tiền (VNĐ)", s: tblHeader }],
      ...deductionRows.map(([label, value]) => [
        { v: label, s: cellLeft },
        { v: typeof value === "number" ? formatMoney(value) : value, s: cellRight }
      ]),

      [{ v: "TỔNG THU NHẬP (1)", s: cellLeftBoldAmber }, { v: formatMoney(incomes.totalGross || 0), s: cellRightBoldAmber }],
      [{ v: "TỔNG GIẢM TRỪ (2)", s: cellLeftBoldAmber }, { v: formatMoney(deductions.totalDeductions || 0), s: cellRightBoldAmber }],
      [{ v: "TỔNG THỰC LĨNH (3) = (1) - (2)", s: cellLeftBoldGreen }, { v: formatMoney(netSalary), s: cellRightBoldGreen }],

      [{ v: "Ghi chú:", s: { font: { name: FONT_NAME, sz: 12, bold: true, italic: true }, border: BORDER_ALL } }, { v: "", s: { border: BORDER_ALL } }],
      [{ v: "", s: { border: BORDER_ALL } }, { v: "", s: { border: BORDER_ALL } }]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Số dòng cần merge
    const lastRow = wsData.length - 1;
    const noteRowIdx = lastRow - 1;

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: noteRowIdx, c: 0 }, e: { r: noteRowIdx, c: 1 } },
      { s: { r: lastRow, c: 0 }, e: { r: lastRow, c: 1 } }
    ];

    ws["!cols"] = [{ wch: 45 }, { wch: 25 }];
    ws["!rows"] = [];
    ws["!rows"][lastRow] = { hpt: 40 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PhieuLuong");
    XLSX.writeFile(wb, `PhieuLuong_${payslipCode}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!record) return <div className="text-center p-10 text-xl font-bold">Không tìm thấy phiếu lương</div>;

  const emp = record.employeeSnapshot;
  const inc = record.incomes;
  const ded = record.deductions;
  const allw = inc.allowances || {};
  const ins = ded.insurance || {};
  const housingValue = Number(allw.housingAllowance ?? allw.housing ?? 0);
  const payslipCode = getPayslipCode(emp?.employeeCode || "", record.month, record.year);

  const incomeRows = [
    { label: "Số công làm việc ngày thường", value: record.actualDays },
    { label: "Tiền lương làm việc ngày thường", value: inc.timeSalary },
    { label: "Tiền lương làm thêm giờ", value: inc.overtime },
    { label: "Tiền ăn ca", value: allw.meal },
    { label: "Phụ cấp xăng xe", value: allw.transport },
    { label: "Phụ cấp điện thoại", value: allw.phone },
    { label: "Phụ cấp trang phục", value: allw.clothing },
    { label: "Phụ cấp nhà ở", value: housingValue },
  ].filter((row) => hasValue(row.value));

  const deductionRows = [
    { label: "Bảo hiểm", value: ins.total },
    { label: "Thuế TNCN", value: ded.taxTNCN },
    { label: "Tạm ứng", value: ded.advance },
  ].filter((row) => hasValue(row.value));

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8 flex justify-center print:bg-white print:p-0">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-0">

        {/* Toolbar */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <Button variant="ghost" onClick={() => window.close()} className="text-slate-600 hover:text-slate-900 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Đóng tab
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} className="border-slate-300 cursor-pointer">
              <Printer className="w-4 h-4 mr-2" /> In phiếu
            </Button>
            <Button onClick={handleExportSingleExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Phiếu lương */}
        <div
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
          className="text-black px-10 py-8 print:px-8 print:py-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-lg font-bold uppercase tracking-wide">CÔNG TY CỔ PHẦN XYZ</div>
              <div className="text-xs text-slate-500 italic mt-1">Hệ thống quản lý nhân sự &amp; tiền lương</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-semibold">Phiếu số</div>
              <div className="text-sm font-bold text-blue-700">{payslipCode}</div>
            </div>
          </div>

          {/* Tiêu đề */}
          <div className="text-center my-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider m-0 text-blue-800">
              PHIẾU LƯƠNG NHÂN VIÊN
            </h1>
            <div className="text-sm italic mt-2 text-slate-600">
              Tháng {record.month < 10 ? '0' + record.month : record.month} năm {record.year}
            </div>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
          </div>

          {/* Thông tin nhân viên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-[15px]">
            <div className="flex">
              <span className="font-bold w-32 shrink-0">Họ và tên:</span>
              <span className="flex-1">{emp.fullName || "-"}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32 shrink-0">Mã nhân viên:</span>
              <span className="flex-1">{emp.employeeCode || "-"}</span>
            </div>
            {emp?.workInfo?.department && (
              <div className="flex">
                <span className="font-bold w-32 shrink-0">Phòng ban:</span>
                <span className="flex-1">{emp.workInfo.department}</span>
              </div>
            )}
            {emp?.workInfo?.position && (
              <div className="flex">
                <span className="font-bold w-32 shrink-0">Chức vụ:</span>
                <span className="flex-1">{emp.workInfo.position}</span>
              </div>
            )}
          </div>

          {/* Bảng lương */}
          <div className="overflow-hidden rounded-lg border border-slate-300">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-left px-4 py-3 font-bold uppercase text-sm tracking-wide">
                    Khoản thu nhập
                  </th>
                  <th className="text-right px-4 py-3 font-bold uppercase text-sm tracking-wide w-1/3">
                    Số tiền (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Tổng thu nhập */}
                {incomeRows.length > 0 && (
                  <tr className="bg-amber-50">
                    <td className="px-4 py-3 font-bold text-amber-800 border-b border-amber-200">
                      Tổng thu nhập (1)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-800 border-b border-amber-200">
                      {formatMoney(inc.totalGross || 0)}
                    </td>
                  </tr>
                )}

                {/* Chi tiết thu nhập */}
                {incomeRows.map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-2.5 border-b border-slate-200 text-slate-800 pl-8">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-right border-b border-slate-200 font-medium">
                      {typeof row.value === "number" ? formatMoney(row.value) : row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bảng giảm trừ */}
          {deductionRows.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-300 mt-4">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="bg-rose-700 text-white">
                    <th className="text-left px-4 py-3 font-bold uppercase text-sm tracking-wide">
                      Các khoản giảm trừ
                    </th>
                    <th className="text-right px-4 py-3 font-bold uppercase text-sm tracking-wide w-1/3">
                      Số tiền (VNĐ)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Tổng giảm trừ */}
                  <tr className="bg-rose-50">
                    <td className="px-4 py-3 font-bold text-rose-800 border-b border-rose-200">
                      Tổng giảm trừ (2)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-800 border-b border-rose-200">
                      {formatMoney(ded.totalDeductions || 0)}
                    </td>
                  </tr>

                  {/* Chi tiết giảm trừ */}
                  {deductionRows.map((row, idx) => (
                    <tr key={row.label} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-2.5 border-b border-slate-200 text-slate-800 pl-8">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-right border-b border-slate-200 font-medium">
                        {typeof row.value === "number" ? formatMoney(row.value) : row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Thực lĩnh */}
          <div className="mt-4 overflow-hidden rounded-lg border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 to-emerald-100">
            <table className="w-full text-[16px]">
              <tbody>
                <tr>
                  <td className="px-4 py-4 font-bold text-emerald-900">
                    TỔNG THỰC LĨNH (3) = (1) - (2)
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700 text-lg">
                    {formatMoney(record.netSalary)} VNĐ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bằng chữ */}
          <div className="mt-4 text-[15px] italic text-slate-700">
            <span className="font-bold not-italic">Số tiền bằng chữ: </span>
            ................................................
          </div>

          {/* Chữ ký */}
          <div className="grid grid-cols-2 gap-8 mt-10 text-center text-[15px]">
            <div>
              <div className="font-bold uppercase">Người lập phiếu</div>
              <div className="text-xs italic text-slate-500 mb-16">(Ký, ghi rõ họ tên)</div>
              <div className="border-t border-slate-300 w-40 mx-auto pt-1" />
            </div>
            <div>
              <div className="font-bold uppercase">Người nhận</div>
              <div className="text-xs italic text-slate-500 mb-16">(Ký, ghi rõ họ tên)</div>
              <div className="border-t border-slate-300 w-40 mx-auto pt-1" />
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400 italic">
            (Phiếu lương được trích xuất tự động từ hệ thống)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;