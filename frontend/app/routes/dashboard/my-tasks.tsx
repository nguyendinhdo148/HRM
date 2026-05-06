import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Receipt, Plus, Trash2, List, ArrowUpRight, ArrowDownRight, TrendingUp, CalendarDays } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 
import { fetchData, postData, deleteData } from "@/lib/fetch-util";
// Thêm thư viện vẽ biểu đồ
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MonthlyReport {
  _id: string;
  monthKey: string;
  title: string;
  totalGross: number;
  preTaxRevenue: number;
  guestCount: number;
  billCount: number;
  daysCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

const MyTasks = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  
  // Tự động lấy mặc định là tháng hiện tại (VD: "2026-04")
  const [newMonth, setNewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = (await fetchData("/monthly-reports")) as ApiResponse<MonthlyReport[]>;
      if (res.success) setReports(res.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tháng:", error);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

  const handleCreateMonth = async () => {
    if (!newMonth) return alert("Vui lòng chọn tháng!");
    const parts = newMonth.split("-");
    const title = `Tháng ${parts[1]}/${parts[0]}`;

    const res = (await postData("/monthly-reports", { monthKey: newMonth, title })) as ApiResponse<MonthlyReport>;
    if (res.success) {
      loadReports();
      // Chuyển thẳng vào chi tiết tháng vừa tạo cho tiện
      navigate(`/daily-report/${res.data._id}`);
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CẢNH BÁO: Xoá tháng này sẽ XOÁ SẠCH TOÀN BỘ dữ liệu báo cáo từng ngày bên trong. Bạn chắc chắn chứ?")) return;
    const res = (await deleteData(`/monthly-reports/${id}`)) as ApiResponse<any>;
    if (res.success) loadReports();
    else alert(res.message);
  };

  // =================================================================
  // LOGIC PHÂN TÍCH SO SÁNH (MOM) VÀ BIỂU ĐỒ
  // =================================================================
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [reports]);

  // Lấy dữ liệu 2 tháng gần nhất để so sánh
  const currentMonth = sortedReports[0];
  const previousMonth = sortedReports[1];

  const calculateGrowth = (current?: number, previous?: number) => {
    if (!current) return 0;
    if (!previous || previous === 0) return 100; // Tăng trưởng 100% nếu tháng trước = 0
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(currentMonth?.totalGross, previousMonth?.totalGross);
  const guestGrowth = calculateGrowth(currentMonth?.guestCount, previousMonth?.guestCount);

  const renderGrowthBadge = (growth: number) => {
    if (growth > 0) return <span className="text-emerald-500 flex items-center text-sm font-medium"><ArrowUpRight className="w-4 h-4 mr-1"/>+{growth.toFixed(1)}%</span>;
    if (growth < 0) return <span className="text-red-500 flex items-center text-sm font-medium"><ArrowDownRight className="w-4 h-4 mr-1"/>{growth.toFixed(1)}%</span>;
    return <span className="text-slate-400 text-sm font-medium">0%</span>;
  };

  // Chuẩn bị data cho biểu đồ (Lấy tối đa 6 tháng gần nhất, đảo ngược mảng để vẽ từ trái sang phải)
  const chartData = useMemo(() => {
    return sortedReports.slice(0, 6).reverse().map(r => ({
      name: r.monthKey.split("-")[1] + "/" + r.monthKey.split("-")[0], // VD: "04/2026"
      total: r.totalGross
    }));
  }, [sortedReports]);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER & TẠO MỚI */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Tổng Quan Báo Cáo</h1>
          <p className="text-muted-foreground text-sm mt-1">Phân tích hiệu quả kinh doanh và xu hướng các tháng.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              type="month" 
              value={newMonth} 
              onChange={(e) => setNewMonth(e.target.value)} 
              className="w-44 pl-10 bg-white"
            />
          </div>
          <Button onClick={handleCreateMonth} className="gap-2"><Plus className="w-4 h-4"/> Tạo & Nhập liệu</Button>
        </div>
      </div>

      {/* THỐNG KÊ SO SÁNH (MOM) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Doanh Thu {currentMonth ? `(${currentMonth.title})` : ""}</CardTitle>
            <DollarSign className="w-4 h-4 text-primary absolute top-4 right-4"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{formatCurrency(currentMonth?.totalGross || 0)}</div>
            <div className="flex items-center mt-2 gap-2">
              {renderGrowthBadge(revenueGrowth)}
              <span className="text-xs text-muted-foreground">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Lượng Khách Phục Vụ</CardTitle>
            <Users className="w-4 h-4 text-blue-500 absolute top-4 right-4"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{currentMonth?.guestCount || 0}</div>
            <div className="flex items-center mt-2 gap-2">
              {renderGrowthBadge(guestGrowth)}
              <span className="text-xs text-muted-foreground">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Trung Bình / Khách</CardTitle>
            <Receipt className="w-4 h-4 text-orange-500 absolute top-4 right-4"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {formatCurrency((currentMonth?.guestCount || 0) > 0 ? (currentMonth!.totalGross / currentMonth!.guestCount) : 0)}
            </div>
            <div className="flex items-center mt-2 gap-2">
              <span className="text-xs text-muted-foreground">Chi tiêu trung bình tháng này</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BIỂU ĐỒ XU HƯỚNG */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Biểu Đồ Doanh Thu 6 Tháng Gần Nhất</CardTitle>
            <CardDescription>Biến động tổng doanh thu (đã bao gồm VAT & PPV)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13}} dy={10} />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 13}} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                    labelStyle={{color: '#111827', fontWeight: 'bold'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="total" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BẢNG DANH SÁCH CÁC THÁNG */}
      <Card>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 whitespace-nowrap">
                <TableHead>Kỳ Báo Cáo</TableHead>
                <TableHead className="text-right">DT trước PPV/VAT</TableHead>
                <TableHead className="text-right text-primary font-bold">Tổng DT (VAT)</TableHead>
                <TableHead className="text-center">Số khách</TableHead>
                <TableHead className="text-right">DT / Khách</TableHead>
                <TableHead className="text-center">Số bill</TableHead>
                <TableHead className="text-center">Đã ghi nhận</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReports.length > 0 ? sortedReports.map(r => (
                <TableRow key={r._id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-base text-slate-800">{r.title}</TableCell>
                  <TableCell className="text-right text-orange-600 font-medium">{formatCurrency(r.preTaxRevenue)}</TableCell>
                  <TableCell className="text-right font-bold text-primary text-base">{formatCurrency(r.totalGross)}</TableCell>
                  <TableCell className="text-center font-medium">{r.guestCount}</TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(r.guestCount > 0 ? r.totalGross / r.guestCount : 0)}</TableCell>
                  <TableCell className="text-center font-medium">{r.billCount}</TableCell>
                  <TableCell className="text-center text-slate-500 font-medium">{r.daysCount} ngày</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => navigate(`/daily-report/${r._id}`)} variant="default" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20"><List className="w-4 h-4"/> Chi tiết</Button>
                      <Button onClick={() => handleDelete(r._id)} variant="ghost" className="text-red-500 hover:bg-red-50 px-2"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Chưa có dữ liệu tháng nào.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default MyTasks;