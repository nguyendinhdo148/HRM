import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { PlusCircle, CheckCircle2, Clock, CalendarDays, ArrowUpDown, Search } from "lucide-react";

import { fetchData } from "@/lib/fetch-util";

import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CreateWorkspace from "@/components/workspace/create-workspace";

const Dashboard = () => {
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho Lọc và Sắp xếp
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("date-desc");

  // Lấy dữ liệu API
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        setIsLoading(true);
        const response: any = await fetchData("/tasks/my-tasks");
        setTasks(response?.data || response || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách công nợ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllTasks();
  }, []);

  // Tiền xử lý dữ liệu: Tính toán tổng tiền, phần trăm, và trạng thái cho TỪNG công nợ
  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      const debtAmount = Number(task.title) || 0;
      const totalSubtasks = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
      const completedSubtasks = Array.isArray(task.subtasks)
        ? task.subtasks.filter((st: any) => st.completed).length
        : 0;

      const completedAmount = Array.isArray(task.subtasks)
        ? task.subtasks
            .filter((st: any) => st.completed)
            .reduce((sum: number, st: any) => {
              const amount = typeof st.title === "string"
                ? Number(st.title.replace(/[^\d.-]/g, ""))
                : Number(st.title);
              return sum + (Number.isFinite(amount) ? amount : 0);
            }, 0)
        : 0;

      // Tính phần trăm dựa trên số khoản trả / tổng khoản trả
      const progressPercent = totalSubtasks > 0
        ? Math.min(100, Math.round((completedSubtasks / totalSubtasks) * 100))
        : task.status === "Done"
        ? 100
        : 0;

      const statusText = progressPercent >= 100 || task.status === "Done"
        ? "Đã xong"
        : task.status;

      // Nếu đã hoàn thành nhưng không có subtask tính thành tiền thì hiển thị full nợ
      const collectedAmount = progressPercent >= 100 && completedAmount === 0
        ? debtAmount
        : completedAmount;

      const isFullyPaid = progressPercent >= 100;

      // Xử lý ngày tháng để làm bộ lọc
      const dateObj = new Date(task.createdAt || Date.now());
      const monthStr = format(dateObj, "MM/yyyy");

      return {
        ...task,
        debtAmount,
        collectedAmount,
        progressPercent,
        isFullyPaid,
        statusText,
        dateObj,
        monthStr,
      };
    });
  }, [tasks]);

  // Lấy danh sách các Tháng hiện có để làm Filter Dropdown
  const availableMonths = useMemo(() => {
    const months = new Set(enrichedTasks.map(t => t.monthStr));
    return Array.from(months).sort((a, b) => {
      // Sắp xếp tháng mới nhất lên đầu
      const [mA, yA] = a.split("/");
      const [mB, yB] = b.split("/");
      return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
    });
  }, [enrichedTasks]);

  // Áp dụng Lọc và Sắp xếp
  const processedData = useMemo(() => {
    let result = [...enrichedTasks];

    // 1. Lọc theo chữ (Search Query)
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.description && t.description.toLowerCase().includes(lowerQuery)) || 
        (t.project?.title && t.project.title.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Lọc theo tháng
    if (monthFilter !== "all") {
      result = result.filter(t => t.monthStr === monthFilter);
    }

    // 3. Sắp xếp
    result.sort((a, b) => {
      switch (sortOption) {
        case "date-desc": return b.dateObj.getTime() - a.dateObj.getTime();
        case "date-asc": return a.dateObj.getTime() - b.dateObj.getTime();
        case "amount-desc": return b.debtAmount - a.debtAmount;
        case "amount-asc": return a.debtAmount - b.debtAmount;
        case "status-done": return (a.isFullyPaid === b.isFullyPaid) ? 0 : a.isFullyPaid ? -1 : 1;
        case "status-pending": return (a.isFullyPaid === b.isFullyPaid) ? 0 : a.isFullyPaid ? 1 : -1;
        default: return 0;
      }
    });

    return result;
  }, [enrichedTasks, monthFilter, sortOption, searchQuery]);

  // TÍNH TOÁN ĐỘNG: Tổng tiền của những dòng đang được hiển thị
  const { currentTotalDebt, currentTotalCollected } = useMemo(() => {
    return processedData.reduce(
      (acc, task) => {
        acc.currentTotalDebt += task.debtAmount;
        acc.currentTotalCollected += task.collectedAmount;
        return acc;
      },
      { currentTotalDebt: 0, currentTotalCollected: 0 }
    );
  }, [processedData]);

  if (isLoading) return <Loader />;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      {/* Tiêu đề */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Danh Sách Công Nợ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý chi tiết và tiến độ thu hồi công nợ theo danh sách.
          </p>
        </div>
        <Button onClick={() => setIsCreatingWorkspace(true)} className="bg-primary hover:bg-primary/90 shadow-sm whitespace-nowrap">
          <PlusCircle className="size-4 mr-2" />
          Thêm tháng công nợ
        </Button>
      </div>

      {/* THANH CÔNG CỤ: Bộ Lọc & Sắp xếp */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          {/* Ô Tìm kiếm theo tên / ghi chú */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo tên thành viên" 
              className="pl-9 bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Lọc theo Tháng */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-slate-50">
                <CalendarDays className="w-4 h-4 mr-2 text-slate-500" />
                {monthFilter === "all" ? "Tất cả các tháng" : `Tháng ${monthFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setMonthFilter("all")} className="font-medium">
                Tất cả các tháng
              </DropdownMenuItem>
              {availableMonths.map(month => (
                <DropdownMenuItem key={month} onClick={() => setMonthFilter(month)}>
                  Tháng {month}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sắp xếp */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-slate-50">
                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
                Sắp xếp
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setSortOption("date-desc")}>Mới nhất lên trước</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("date-asc")}>Cũ nhất lên trước</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("amount-desc")}>Số nợ cao nhất</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("amount-asc")}>Số nợ thấp nhất</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("status-done")}>Ưu tiên "Đã xong"</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("status-pending")}>Ưu tiên "Chưa thu đủ"</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md w-full sm:w-auto text-center">
          Đang hiển thị <span className="text-primary font-bold">{processedData.length}</span> công nợ
        </div>
      </div>

      {/* HIỂN THỊ DẠNG LIST (TABLE) */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700 w-[120px]">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Tổng Nợ (VNĐ)</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Đã Thu Hồi</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[150px]">Tiến độ</TableHead>
                <TableHead className="font-semibold text-slate-700">Ghi chú</TableHead>
                <TableHead className="font-semibold text-slate-700">Tên thành viên</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {processedData.length > 0 ? (
                processedData.map((task) => (
                  <TableRow key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* 1. Trạng Thái - DỰA VÀO TIẾN ĐỘ */}
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${task.isFullyPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {task.isFullyPaid ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                        {task.statusText}
                      </div>
                    </TableCell>

                    {/* 2. Tổng nợ */}
                    <TableCell className="text-right font-bold text-slate-800 text-base whitespace-nowrap">
                      {formatCurrency(task.debtAmount)}
                    </TableCell>

                    {/* 3. Đã thu */}
                    <TableCell className="text-right font-medium text-emerald-600 whitespace-nowrap">
                      {formatCurrency(task.collectedAmount)}
                    </TableCell>

                    {/* 4. Tiến độ (Thanh % ) */}
                    <TableCell>
                      <div className="flex flex-col gap-1.5 w-full min-w-[100px]">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600">{task.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${task.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                            style={{ width: `${task.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>

                    {/* 5. Ghi chú */}
                    <TableCell>
                      <span className="text-sm text-slate-600 line-clamp-2 min-w-[150px]">
                        {task.description || "-"}
                      </span>
                    </TableCell>

                    {/* 6. Dự án/Tháng */}
                    <TableCell>
                      <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md whitespace-nowrap">
                        {task.project?.title || "Không xác định"}
                      </span>
                    </TableCell>

                    {/* 7. Ngày tạo */}
                    <TableCell className="text-center text-sm font-medium text-slate-500 whitespace-nowrap">
                      {format(task.dateObj, "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <NoDataFound 
                        title="Không tìm thấy công nợ"
                        description="Không có dữ liệu phù hợp với bộ lọc hiện tại." buttonText={""} buttonAction={function (): void {
                          throw new Error("Function not implemented.");
                        } }                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            {/* THANH TỔNG CỘNG ĐỘNG (TABLE FOOTER) */}
            {processedData.length > 0 && (
              <TableFooter className="bg-primary/5 sticky bottom-0 z-10 border-t-2 border-primary/20">
                <TableRow className="hover:bg-primary/5">
                  <TableCell className="text-center font-extrabold text-primary text-base whitespace-nowrap uppercase">
                    TỔNG CỘNG ({processedData.length})
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-800 text-[1.05rem] whitespace-nowrap">
                    {formatCurrency(currentTotalDebt)}
                  </TableCell>
                  <TableCell className="text-right font-black text-emerald-600 text-[1.05rem] whitespace-nowrap">
                    {formatCurrency(currentTotalCollected)}
                  </TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              </TableFooter>
            )}

          </Table>
        </div>
      </Card>

      <CreateWorkspace isCreatingWorkspace={isCreatingWorkspace} setIsCreatingWorkspace={setIsCreatingWorkspace} />
    </div>
  );
};

export default Dashboard;