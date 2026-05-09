/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import XLSX from "xlsx-js-style"; // ĐỔI SANG DÙNG THƯ VIỆN CÓ STYLE
import { 
  Mail, 
  Mails, 
  Printer, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL;

interface PayrollRecordType {
  _id: string;
  month: number;
  year: number;
  employeeSnapshot: {
    fullName: string;
    employeeCode: string;
    department: string;
    position: string;
  };
  employee?: {
    email: string;
  };
  incomes: {
    totalGross: number;
  };
  netSalary: number;
  isEmailSent?: boolean; 
}

const PayrollManager = () => {
  const [records, setRecords] = useState<PayrollRecordType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const fetchPayrollRecords = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token"); 
      const res = await axios.get(`${API}/payroll?month=${filterMonth}&year=${filterYear}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRecords(res.data.records || res.data.data || []);
      }
    } catch (error: any) {
      console.error("Lỗi lấy dữ liệu lương:", error);
      toast.error(error.response?.data?.message || "Lỗi xác thực: Vui lòng đăng nhập lại!");
      setRecords([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // ==========================================
  // XỬ LÝ GỬI EMAIL CÁ NHÂN
  // ==========================================
  const handleSendEmail = async (recordId: string) => {
    setSendingId(recordId);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/payroll/send-email/${recordId}`, {}, { 
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Gửi email thành công!");
        setRecords(prev => prev.map(r => r._id === recordId ? { ...r, isEmailSent: true } : r));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi email");
    } finally {
      setSendingId(null);
    }
  };

  // ==========================================
  // XỬ LÝ GỬI EMAIL TẤT CẢ (Hàng loạt)
  // ==========================================
  const handleSendAllEmails = async () => {
    if (records.length === 0) return toast.error("Không có dữ liệu để gửi");
    
    const validRecords = records.filter(r => r.employee?.email && !r.isEmailSent);
    if (validRecords.length === 0) return toast.error("Tất cả nhân viên hợp lệ đều đã được gửi mail.");

    const confirm = window.confirm(`Bạn chuẩn bị gửi phiếu lương cho ${validRecords.length} nhân viên. Tiếp tục?`);
    if (!confirm) return;

    setIsSendingAll(true);
    let successCount = 0;
    const token = localStorage.getItem("token");

    for (const record of validRecords) {
      try {
        await axios.post(`${API}/payroll/send-email/${record._id}`, {}, { 
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
        setRecords(prev => prev.map(r => r._id === record._id ? { ...r, isEmailSent: true } : r));
      } catch (err) {
        console.error(`Lỗi gửi mail cho ID ${record._id}`, err);
      }
    }

    setIsSendingAll(false);
    toast.success(`Đã gửi thành công ${successCount}/${validRecords.length} email!`);
  };

  // ==========================================
  // XUẤT EXCEL DANH SÁCH BẢNG LƯƠNG (CÓ STYLE ĐẸP)
  // ==========================================
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      return toast.error("Không có dữ liệu để xuất Excel");
    }

    // Định dạng số thành chuỗi để giữ nguyên dấu chấm của VN
    const formatNumberToVND = (num: number) => {
      if (!num) return "0";
      return num.toLocaleString("vi-VN"); 
    };

    // --- 1. ĐỊNH NGHĨA STYLE ---
    const FONT_NAME = "Times New Roman";
    const BORDER_ALL = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    const titleStyle = { 
      font: { name: FONT_NAME, sz: 16, bold: true }, 
      alignment: { horizontal: "center", vertical: "center" } 
    };
    const headerStyle = { 
      font: { name: FONT_NAME, sz: 12, bold: true }, 
      fill: { fgColor: { rgb: "D1D5DB" } }, // Nền xám nhạt
      alignment: { horizontal: "center", vertical: "center" }, 
      border: BORDER_ALL 
    };
    
    const cellCenter = { font: { name: FONT_NAME, sz: 12 }, alignment: { horizontal: "center", vertical: "center" }, border: BORDER_ALL };
    const cellLeft = { font: { name: FONT_NAME, sz: 12 }, alignment: { horizontal: "left", vertical: "center" }, border: BORDER_ALL };
    const cellMoney = { font: { name: FONT_NAME, sz: 12, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER_ALL };

    // --- 2. TẠO DATA ARRAY 2 CHIỀU ---
    const wsData: any[] = [];
    
    // Dòng Tiêu đề
    wsData.push([{ v: `DANH SÁCH BẢNG LƯƠNG THÁNG ${filterMonth}/${filterYear}`, s: titleStyle }, {v:""}, {v:""}, {v:""}, {v:""}, {v:""}, {v:""}, {v:""}]);
    wsData.push([]); // Dòng trống

    // Dòng Header
    const headers = ["STT", "Mã NV", "Họ và tên", "Phòng ban", "Email", "Tổng thu nhập", "Thực lĩnh", "Trạng thái Mail"];
    wsData.push(headers.map(h => ({ v: h, s: headerStyle })));

    // Các dòng dữ liệu
    filteredRecords.forEach((r, index) => {
      wsData.push([
        { v: index + 1, s: cellCenter },
        { v: r.employeeSnapshot.employeeCode, s: cellCenter },
        { v: r.employeeSnapshot.fullName, s: cellLeft },
        { v: r.employeeSnapshot.department || "", s: cellCenter },
        { v: r.employee?.email || "Chưa có", s: cellLeft },
        { v: formatNumberToVND(r.incomes.totalGross), s: cellMoney },
        { v: formatNumberToVND(r.netSalary), s: cellMoney },
        { v: r.isEmailSent ? "Đã gửi" : "Chưa gửi", s: cellCenter }
      ]);
    });

    // --- 3. TẠO SHEET & TÙY CHỈNH KÍCH THƯỚC ---
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Gộp ô tiêu đề
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    // Mở rộng độ rộng cột
    worksheet["!cols"] = [
      { wch: 5 },  // STT
      { wch: 12 }, // Mã NV
      { wch: 25 }, // Họ tên
      { wch: 15 }, // Phòng ban
      { wch: 30 }, // Email
      { wch: 18 }, // Tổng thu nhập
      { wch: 18 }, // Thực lĩnh
      { wch: 18 }, // Trạng thái
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `BangLuong_T${filterMonth}_${filterYear}`);

    // --- 4. TẢI FILE XUỐNG ---
    XLSX.writeFile(workbook, `DanhSachBangLuong_T${filterMonth}_${filterYear}.xlsx`);
  };

  const filteredRecords = records.filter(r => 
    r.employeeSnapshot.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employeeSnapshot.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Bảng Lương</h1>
          <p className="text-gray-500 mt-1">Quản lý, xuất Excel và gửi phiếu lương tự động qua email</p>
        </div>

        <div className="flex gap-3">
          <Input 
            type="month" 
            value={`${filterYear}-${filterMonth < 10 ? '0'+filterMonth : filterMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              if(y && m) {
                setFilterYear(Number(y));
                setFilterMonth(Number(m));
              }
            }}
            className="w-40"
          />
          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất Excel
          </Button>

          <Button 
            onClick={handleSendAllEmails} 
            disabled={isSendingAll || records.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {isSendingAll ? (
              <span className="flex items-center gap-2"><Mails className="w-4 h-4 animate-bounce" /> Đang gửi...</span>
            ) : (
              <span className="flex items-center gap-2"><Mails className="w-4 h-4" /> Gửi mail tất cả</span>
            )}
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg text-gray-800">
            Danh sách lương tháng {filterMonth}/{filterYear}
          </CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm theo tên, mã NV..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã NV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead className="text-right">Tổng thu nhập</TableHead>
                  <TableHead className="text-right">Thực lĩnh</TableHead>
                  <TableHead className="text-center">Trạng thái Mail</TableHead>
                  <TableHead className="text-center w-[250px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      Không tìm thấy dữ liệu.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record._id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-600">
                        {record.employeeSnapshot.employeeCode}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{record.employeeSnapshot.fullName}</div>
                        <div className="text-xs text-gray-500">{record.employee?.email || "Chưa có email"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {record.employeeSnapshot.department || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-600">
                        {formatMoney(record.incomes.totalGross)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatMoney(record.netSalary)}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.isEmailSent ? (
                          <span className="flex justify-center items-center text-green-600 text-xs font-medium gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Đã gửi
                          </span>
                        ) : (
                          <span className="flex justify-center items-center text-gray-400 text-xs font-medium gap-1">
                            <AlertCircle className="w-4 h-4" /> Chưa gửi
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
                            onClick={() => window.open(`/payroll/slip/${record._id}`, '_blank')}
                          >
                            <FileText className="w-4 h-4 mr-1" /> Xem phiếu
                          </Button>
                          <Button 
                            size="sm"
                            disabled={!record.employee?.email || sendingId === record._id}
                            className={`h-8 ${record.isEmailSent ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'} text-white cursor-pointer`}
                            onClick={() => handleSendEmail(record._id)}
                          >
                            {sendingId === record._id ? (
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4 animate-pulse" /> Đang gửi...</span>
                            ) : (
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> Gửi mail</span>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollManager;