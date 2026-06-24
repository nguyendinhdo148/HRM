import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CreditCard, FileText, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Gọi trực tiếp đến route payroll
const API = import.meta.env.VITE_API_URL; 

interface PersonalPayroll {
  month: number;
  year: number;
  fullName: string;
  employeeCode: string;
  department: string;
  incomes: {
    baseSalary: number;
    allowances: number;
    totalGross: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    totalDeductions: number;
  };
  netSalary: number;
}

const EmployeePayrollViewer = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [idCardNumber, setIdCardNumber] = useState("");
  const [payrollData, setPayrollData] = useState<PersonalPayroll | null>(null);

  const handleFetchPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardNumber.trim()) return toast.error("Vui lòng nhập số CCCD!");

    setIsLoading(true);
    try {
      // Gửi request đến route public không cần token
      const res = await axios.post(`${API}/payroll/view-by-cccd`, { idCardNumber });
      if (res.data.success) {
        toast.success("Xác thực số CCCD thành công!");
        setPayrollData(res.data.data);
        setStep(2);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không tìm thấy dữ liệu lương khớp với số CCCD này.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-2xl overflow-hidden">
        
        {step === 1 && (
          <>
            <CardHeader className="bg-blue-600 text-white text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <CardTitle className="text-2xl">Tra cứu bảng lương</CardTitle>
              <CardDescription className="text-blue-100 mt-2">
                Nhập chính xác số CCCD/CMND của bạn để xem phiếu lương
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleFetchPayroll} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Số CCCD / CMND</label>
                  <Input 
                    type="text" 
                    placeholder="Nhập số CCCD gồm 12 số..." 
                    className="py-6 text-center text-xl font-semibold tracking-wider"
                    maxLength={12}
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value.replace(/\s/g, ''))}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 mt-4 cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xác thực..." : "Xem bảng lương"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === 2 && payrollData && (
          <>
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6 relative">
              <button 
                type="button"
                onClick={() => { setStep(1); setIdCardNumber(""); setPayrollData(null); }} 
                className="absolute right-4 top-4 text-sm font-medium text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-md bg-white shadow-sm"
              >
                Thoát
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Phiếu lương T{payrollData.month}/{payrollData.year}</CardTitle>
                  <CardDescription>Mã NV: {payrollData.employeeCode}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Họ và tên</span>
                  <span className="font-semibold text-gray-900">{payrollData.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Phòng ban</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">{payrollData.department}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                  <span className="text-gray-600 text-sm">Lương cơ bản</span>
                  <span className="font-medium text-gray-900">{formatMoney(payrollData.incomes.baseSalary)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                  <span className="text-gray-600 text-sm">Phụ cấp & Thưởng</span>
                  <span className="font-medium text-gray-900">{formatMoney(payrollData.incomes.allowances)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-900 font-medium">
                  <span className="text-sm">Tổng thu nhập (Gross)</span>
                  <span>{formatMoney(payrollData.incomes.totalGross)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50/60 rounded-lg text-red-700 text-sm">
                  <span>Khấu trừ (BH, Thuế...)</span>
                  <span className="font-medium">-{formatMoney(payrollData.deductions.totalDeductions)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-bold text-base tracking-wide">THỰC LĨNH</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatMoney(payrollData.netSalary)}
                  </span>
                </div>
              </div>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
};

export default EmployeePayrollViewer;