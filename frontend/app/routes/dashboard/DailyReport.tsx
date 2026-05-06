import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, ArrowUp, ArrowDown, CreditCard, DollarSign, Download, Receipt, Search, Users, Edit2, Save, X, Plus, Trash2, EyeOff, Eye, CalendarDays, Check } from "lucide-react";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { fetchData, updateData, postData, deleteData } from "@/lib/fetch-util";
import * as XLSX from "xlsx";

export interface DailyRevenue {
  _id?: string;
  reportId: string; 
  date: string;
  dayOfWeek: string;
  cash: number;
  transfer: number;
  card: number;
  debt: number;
  preTaxRevenue: number; 
  totalGross: number; 
  guestCount: number;
  billCount: number;
  note?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

const DailyReport = () => {
  const { reportId } = useParams<{ reportId: string }>(); 
  const navigate = useNavigate();

  const [data, setData] = useState<DailyRevenue[]>([]);
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DailyRevenue>>({});
  const [isNewRow, setIsNewRow] = useState(false); 

  const editRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (reportId) {
      const fetchRevenues = async () => {
        try {
          const result = (await fetchData(`/daily-revenues?reportId=${reportId}`)) as ApiResponse<DailyRevenue[]>; 
          if (result.success) setData(result.data);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        }
      };
      fetchRevenues();
    }
  }, [reportId]); 

  useEffect(() => {
    if (editingId && editRowRef.current) {
      editRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingId]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleEditClick = (row: DailyRevenue) => {
    const rowId = row._id;
    if (rowId) {
      setEditingId(rowId);
      setIsNewRow(false); 
      setEditFormData({ 
        ...row,
        cash: row.cash === 0 ? ("" as any) : row.cash,
        transfer: row.transfer === 0 ? ("" as any) : row.transfer,
        card: row.card === 0 ? ("" as any) : row.card,
        debt: row.debt === 0 ? ("" as any) : row.debt,
        preTaxRevenue: row.preTaxRevenue === 0 ? ("" as any) : row.preTaxRevenue,
        guestCount: row.guestCount === 0 ? ("" as any) : row.guestCount,
        billCount: row.billCount === 0 ? ("" as any) : row.billCount,
      });
    }
  };

  const handleCancelEdit = async () => {
    if (isNewRow && editingId) {
      await deleteData(`/daily-revenues/${editingId}`);
      setData(data.filter(item => item._id !== editingId));
    }
    setEditingId(null);
    setEditFormData({});
    setIsNewRow(false);
  };

  const handleDeleteRow = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá báo cáo của ngày này? Hành động này không thể hoàn tác!")) return;
    try {
      const result = await deleteData(`/daily-revenues/${id}`) as ApiResponse<any>;
      if (result.success) setData(data.filter(item => item._id !== id));
      else alert("Lỗi khi xoá: " + result.message);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    }
  };

  const executeSave = async () => {
    if (!editingId) return;
    
    const cash = Number(editFormData.cash) || 0;
    const transfer = Number(editFormData.transfer) || 0;
    const card = Number(editFormData.card) || 0;
    const debt = Number(editFormData.debt) || 0;
    const preTaxRevenue = Number(editFormData.preTaxRevenue) || 0;
    const guestCount = Number(editFormData.guestCount) || 0;
    const billCount = Number(editFormData.billCount) || 0;

    const totalGross = cash + transfer + card + debt;
    const payload = { ...editFormData, cash, transfer, card, debt, preTaxRevenue, guestCount, billCount, totalGross };

    try {
      const result = (await updateData(`/daily-revenues/${editingId}`, payload)) as ApiResponse<DailyRevenue>;
      if (result.success) {
        setData(prev => prev.map((item) => item._id === editingId ? result.data : item));
        setIsNewRow(false); 
      }
    } catch (error) {
      console.error("Lỗi auto-save:", error);
    }
  };

  const handleBlur = () => {
    executeSave();
  };

  const handleCloseEdit = () => {
    executeSave(); 
    setEditingId(null);
    setEditFormData({});
    setIsNewRow(false);
  };

  const handleFormChange = (field: keyof DailyRevenue, value: string | number) => {
    setEditFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      if (field === "date" && typeof value === "string") {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
          updated.dayOfWeek = daysOfWeek[d.getDay()];
        }
      }
      return updated;
    });
  };

  const handleAddRow = async () => {
    if (!reportId) return alert("Không tìm thấy ID của tháng!");

    let nextDate = new Date(); 
    
    if (data.length > 0) {
      const timestamps = data.map(d => new Date(d.date).getTime());
      const maxTimestamp = Math.max(...timestamps);
      const latestDate = new Date(maxTimestamp);
      
      nextDate = new Date(latestDate);
      nextDate.setDate(latestDate.getDate() + 1);
    }
    
    const isoDate = nextDate.toISOString().split("T")[0];
    const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const currentDayOfWeek = daysOfWeek[nextDate.getDay()];

    const newRow = {
      reportId: reportId, 
      date: isoDate,
      dayOfWeek: currentDayOfWeek,
      cash: 0, transfer: 0, card: 0, debt: 0, preTaxRevenue: 0, totalGross: 0, guestCount: 0, billCount: 0, note: "",
    };

    try {
      const result = (await postData("/daily-revenues", newRow)) as ApiResponse<DailyRevenue>;
      if (result.success) {
        setData([...data, result.data]);
        setIsNewRow(true);
        handleEditClick(result.data); 
      } else alert("Lỗi khi tạo mới: " + result.message);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    }
  };

  const processedData = useMemo(() => {
    let filtered = [...data];
    if (search) {
      filtered = filtered.filter(i => i.date.includes(search) || i.note?.toLowerCase().includes(search.toLowerCase()) || i.dayOfWeek.toLowerCase().includes(search.toLowerCase()));
    }
    filtered.sort((a, b) => sortDirection === "asc" ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime());
    return filtered;
  }, [data, search, sortDirection]);

  const liveProcessedData = useMemo(() => {
    return processedData.map(row => {
      if (row._id === editingId) {
        const editTotalGross = (Number(editFormData.cash)||0) + (Number(editFormData.transfer)||0) + (Number(editFormData.card)||0) + (Number(editFormData.debt)||0);
        return { ...row, ...editFormData, totalGross: editTotalGross } as DailyRevenue;
      }
      return row;
    });
  }, [processedData, editingId, editFormData]);

  const groupedData = useMemo(() => {
    const groupMap = new Map<string, any>();
    liveProcessedData.forEach((row) => {
      const d = new Date(row.date);
      const year = d.getFullYear(), month = d.getMonth() + 1;
      const firstDay = new Date(year, month - 1, 1).getDay() || 7; 
      const weekNum = Math.ceil((d.getDate() + firstDay - 1) / 7);
      const key = `${year}-${month.toString().padStart(2, "0")}-W${weekNum}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key, monthStr: `${month.toString().padStart(2, "0")}/${year}`, weekNum, records: [],
          totals: { cash: 0, transfer: 0, card: 0, debt: 0, preTax: 0, totalGross: 0, guestCount: 0, billCount: 0 },
        });
      }
      const group = groupMap.get(key);
      group.records.push(row);
      group.totals.cash += Number(row.cash)||0; group.totals.transfer += Number(row.transfer)||0; group.totals.card += Number(row.card)||0; group.totals.debt += Number(row.debt)||0;
      group.totals.preTax += Number(row.preTaxRevenue)||0; group.totals.totalGross += Number(row.totalGross)||0; group.totals.guestCount += Number(row.guestCount)||0; group.totals.billCount += Number(row.billCount)||0;
    });
    return Array.from(groupMap.values()).sort((a, b) => sortDirection === "asc" ? a.weekNum - b.weekNum : b.weekNum - a.weekNum);
  }, [liveProcessedData, sortDirection]);

  const availableWeeks = useMemo(() => Array.from(new Set(groupedData.map(g => g.weekNum))).sort((a, b) => a - b), [groupedData]);
  const filteredGroupedData = useMemo(() => weekFilter === "all" ? groupedData : groupedData.filter(g => g.weekNum.toString() === weekFilter), [groupedData, weekFilter]);

  const { totals, totalDays } = useMemo(() => {
    let days = 0;
    const t = groupedData.reduce((acc, group) => {
      days += group.records.length;
      return {
        cash: acc.cash + group.totals.cash, transfer: acc.transfer + group.totals.transfer, card: acc.card + group.totals.card, debt: acc.debt + group.totals.debt,
        preTax: acc.preTax + group.totals.preTax, totalGross: acc.totalGross + group.totals.totalGross, guest: acc.guest + group.totals.guestCount, bill: acc.bill + group.totals.billCount,
      };
    }, { cash: 0, transfer: 0, card: 0, debt: 0, preTax: 0, totalGross: 0, guest: 0, bill: 0 });
    return { totals: t, totalDays: days };
  }, [groupedData]);

  const avgPerGuest = totals.guest > 0 ? totals.totalGross / totals.guest : 0;

  const handleExportExcel = () => {
    if (data.length === 0) return alert("Chưa có dữ liệu để xuất Excel!");

    const exportData = processedData.map((row) => ({
      "Ngày": formatDate(row.date),
      "Thứ": row.dayOfWeek,
      "Tiền mặt": row.cash || 0,
      "Chuyển khoản": row.transfer || 0,
      "Cà thẻ": row.card || 0,
      "Công nợ": row.debt || 0,
      "DT trước PPV/VAT": row.preTaxRevenue || 0,
      "Tổng DT (VAT)": row.totalGross || 0,
      "Số khách": row.guestCount || 0,
      "DT / Khách": row.guestCount > 0 ? Math.round(row.totalGross / row.guestCount) : 0,
      "Số bill": row.billCount || 0,
      "Ghi chú": row.note || ""
    }));

    exportData.push({
      "Ngày": "", "Thứ": "", "Tiền mặt": "" as any, "Chuyển khoản": "" as any, "Cà thẻ": "" as any, "Công nợ": "" as any, "DT trước PPV/VAT": "" as any, "Tổng DT (VAT)": "" as any, "Số khách": "" as any, "DT / Khách": "" as any, "Số bill": "" as any, "Ghi chú": ""
    });

    exportData.push({
      "Ngày": "TỔNG CỘNG",
      "Thứ": `(${totalDays} ngày)`,
      "Tiền mặt": totals.cash,
      "Chuyển khoản": totals.transfer,
      "Cà thẻ": totals.card,
      "Công nợ": totals.debt,
      "DT trước PPV/VAT": totals.preTax,
      "Tổng DT (VAT)": totals.totalGross,
      "Số khách": totals.guest,
      "DT / Khách": avgPerGuest,
      "Số bill": totals.bill,
      "Ghi chú": ""
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoDoanhThu");

    const wscols = [
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 30 }
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `Bao_Cao_Doanh_Thu_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300">
            <ArrowLeft className="w-5 h-5"/>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Chi Tiết Báo Cáo Tháng</h1>
            <p className="text-muted-foreground text-sm mt-1">Dữ liệu sẽ <span className="text-emerald-600 font-semibold">Tự động Lưu</span> khi bạn nhập.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsCompactMode(!isCompactMode)} className="gap-2 bg-slate-50 text-slate-700 border-slate-300">
            {isCompactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {isCompactMode ? "Hiện chi tiết" : "Thu gọn bảng"}
          </Button>
          <Button variant="outline" className="gap-2 border-slate-300" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Xuất Excel
          </Button>
          
          <Button 
            className={`gap-2 ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={handleAddRow}
            disabled={!!editingId}
          >
            <Plus className="w-4 h-4" /> Thêm doanh thu ngày
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-300"><CardHeader><CardTitle className="text-sm">Tổng Doanh Thu (VAT)</CardTitle><DollarSign className="w-4 h-4 text-emerald-500 absolute top-4 right-4"/></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totals.totalGross)}</div></CardContent></Card>
        <Card className="border-slate-300"><CardHeader><CardTitle className="text-sm">Tổng Lượng Khách</CardTitle><Users className="w-4 h-4 text-blue-500 absolute top-4 right-4"/></CardHeader><CardContent><div className="text-2xl font-bold">{totals.guest}</div></CardContent></Card>
        <Card className="border-slate-300"><CardHeader><CardTitle className="text-sm">Trung Bình / Khách</CardTitle><CreditCard className="w-4 h-4 text-orange-500 absolute top-4 right-4"/></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(avgPerGuest)}</div></CardContent></Card>
        <Card className="border-slate-300"><CardHeader><CardTitle className="text-sm">Tổng Số Bill</CardTitle><Receipt className="w-4 h-4 text-purple-500 absolute top-4 right-4"/></CardHeader><CardContent><div className="text-2xl font-bold">{totals.bill}</div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><Input placeholder="Tìm kiếm theo ngày, thứ, ghi chú" value={search} onChange={(e)=>setSearch(e.target.value)} className="pl-10 border-slate-300"/>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")} className="gap-2 border-slate-300">
            {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />} 
            Sắp xếp {sortDirection === 'asc' ? '(Từ Ngày 1)' : '(Từ Ngày 31)'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-primary text-primary"><CalendarDays className="w-4 h-4 mr-2"/> {weekFilter === "all" ? "Tất cả các tuần" : `Tuần ${weekFilter}`}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setWeekFilter("all")}>Tất cả các tuần</DropdownMenuItem>
              {availableWeeks.map(w => <DropdownMenuItem key={w} onClick={() => setWeekFilter(w.toString())}>Tuần {w}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="border-slate-300">
        <div className="rounded-md overflow-x-auto">
          {/* SỬ DỤNG BORDER-COLLAPSE ĐỂ ĐƯỜNG KẺ KHÔNG BỊ NHÂN ĐÔI */}
          <Table className="border-collapse w-full">
            <TableHeader>
              {/* THÊM MÀU NỀN VÀ VIỀN CHO HEADER */}
              <TableRow className="bg-slate-200">
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-center">Ngày</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-center">Thứ</TableHead>
                {!isCompactMode && (
                  <>
                    <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">Tiền mặt</TableHead>
                    <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">Chuyển khoản</TableHead>
                    <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">Cà thẻ</TableHead>
                    <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">Công nợ</TableHead>
                  </>
                )}
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">DT trước PPV/VAT</TableHead>
                <TableHead className="border border-slate-300 text-primary font-extrabold whitespace-nowrap text-right">Tổng DT (VAT)</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-center w-20">Khách</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-right">DT / Khách</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-center w-20">Bill</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap min-w-[200px]">Ghi chú</TableHead>
                <TableHead className="border border-slate-300 text-slate-800 font-bold whitespace-nowrap text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredGroupedData.length > 0 ? filteredGroupedData.map((group) => (
                <React.Fragment key={group.key}>
                  {/* DÒNG TIÊU ĐỀ TUẦN */}
                  <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                    <TableCell colSpan={2} className="border border-slate-300 font-bold text-center text-slate-700 whitespace-nowrap bg-slate-200/50">TUẦN {group.weekNum}</TableCell>
                    {!isCompactMode && (
                      <>
                        <TableCell className="border border-slate-300 text-right font-semibold text-slate-500 whitespace-nowrap bg-slate-50">{formatCurrency(group.totals.cash)}</TableCell>
                        <TableCell className="border border-slate-300 text-right font-semibold text-slate-500 whitespace-nowrap bg-slate-50">{formatCurrency(group.totals.transfer)}</TableCell>
                        <TableCell className="border border-slate-300 text-right font-semibold text-slate-500 whitespace-nowrap bg-slate-50">{formatCurrency(group.totals.card)}</TableCell>
                        <TableCell className="border border-slate-300 text-right font-semibold text-slate-500 whitespace-nowrap bg-slate-50">{formatCurrency(group.totals.debt)}</TableCell>
                      </>
                    )}
                    <TableCell className="border border-slate-300 text-right font-bold text-orange-600 whitespace-nowrap bg-orange-50/50">{formatCurrency(group.totals.preTax)}</TableCell>
                    <TableCell className="border border-slate-300 text-right font-extrabold text-primary whitespace-nowrap bg-primary/5">{formatCurrency(group.totals.totalGross)}</TableCell>
                    <TableCell className="border border-slate-300 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-50">{group.totals.guestCount}</TableCell>
                    <TableCell className="border border-slate-300 text-right font-bold text-blue-600 whitespace-nowrap bg-blue-50/50">{formatCurrency(group.totals.guestCount > 0 ? group.totals.totalGross / group.totals.guestCount : 0)}</TableCell>
                    <TableCell className="border border-slate-300 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-50">{group.totals.billCount}</TableCell>
                    <TableCell className="border border-slate-300 bg-slate-50"></TableCell>
                    <TableCell className="border border-slate-300 bg-slate-50"></TableCell>
                  </TableRow>

                  {group.records.map((row: DailyRevenue) => {
                    const isEditing = editingId === row._id;
                    const rd = isEditing ? { ...row, ...editFormData } : row;
                    const rGross = isEditing ? (Number(editFormData.cash)||0)+(Number(editFormData.transfer)||0)+(Number(editFormData.card)||0)+(Number(editFormData.debt)||0) : rd.totalGross;
                    
                    return (
                      <TableRow 
                        key={row._id} 
                        ref={isEditing ? editRowRef : null}
                        className={isEditing ? "bg-emerald-50/60 outline outline-2 outline-emerald-400 outline-offset-[-2px] relative z-10 shadow-sm" : "hover:bg-slate-50 transition-colors"}
                      >
                        {isEditing ? (
                          <>
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="date" value={editFormData.date} onChange={(e) => handleFormChange("date", e.target.value)} onBlur={handleBlur} className="w-36 h-9 text-sm border-emerald-300 focus-visible:ring-emerald-500" /></TableCell>
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input value={editFormData.dayOfWeek || ""} disabled className="w-24 h-9 text-sm font-bold bg-slate-200 text-center cursor-not-allowed border-slate-300 text-slate-700" /></TableCell>
                            {!isCompactMode && (
                              <>
                                <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.cash??""} onChange={e=>handleFormChange("cash",e.target.value)} onBlur={handleBlur} className="w-28 text-right h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                                <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.transfer??""} onChange={e=>handleFormChange("transfer",e.target.value)} onBlur={handleBlur} className="w-28 text-right h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                                <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.card??""} onChange={e=>handleFormChange("card",e.target.value)} onBlur={handleBlur} className="w-28 text-right h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                                <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.debt??""} onChange={e=>handleFormChange("debt",e.target.value)} onBlur={handleBlur} className="w-28 text-right h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                              </>
                            )}
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.preTaxRevenue??""} onChange={e=>handleFormChange("preTaxRevenue",e.target.value)} onBlur={handleBlur} className="w-32 text-right h-9 bg-orange-50 border-orange-300 focus-visible:ring-orange-500 font-bold text-orange-700" /></TableCell>
                            <TableCell className="border border-slate-300 p-2 text-right font-extrabold text-primary whitespace-nowrap bg-primary/5">{formatCurrency(rGross)}</TableCell>
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.guestCount??""} onChange={e=>handleFormChange("guestCount",e.target.value)} onBlur={handleBlur} className="w-16 text-center h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                            <TableCell className="border border-slate-300 p-2 text-right font-bold text-blue-600 whitespace-nowrap bg-blue-50/30">{formatCurrency(Number(editFormData.guestCount)>0 ? rGross/Number(editFormData.guestCount) : 0)}</TableCell>
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap"><Input type="number" value={editFormData.billCount??""} onChange={e=>handleFormChange("billCount",e.target.value)} onBlur={handleBlur} className="w-16 text-center h-9 border-emerald-300 focus-visible:ring-emerald-500 font-medium" /></TableCell>
                            <TableCell className="border border-slate-300 p-2 min-w-[200px]"><textarea value={editFormData.note||""} onChange={e=>handleFormChange("note",e.target.value)} onBlur={handleBlur} className="flex min-h-[36px] w-full rounded-md border border-emerald-300 p-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500" placeholder="Ghi chú (Ctrl+Space)..." onKeyDown={(e)=>{if(e.ctrlKey&&(e.key===' '||e.code==='Space')){e.preventDefault(); const t=e.target as HTMLTextAreaElement; handleFormChange("note", (editFormData.note||"").substring(0,t.selectionStart)+"\n"+(editFormData.note||"").substring(t.selectionEnd)); setTimeout(()=>{t.selectionStart=t.selectionEnd=t.selectionStart+1;},0);}}}/></TableCell>
                            <TableCell className="border border-slate-300 p-2 whitespace-nowrap">
                              <div className="flex justify-center gap-1">
                                <Button size="sm" variant="default" onClick={handleCloseEdit} className="h-9 bg-emerald-600 hover:bg-emerald-700 font-bold px-3 shadow-sm"><Check className="w-4 h-4 mr-1"/> Lưu</Button>
                                <Button size="icon" variant="outline" onClick={handleCancelEdit} className="h-9 w-9 text-red-600 border-red-200 hover:bg-red-50" title={isNewRow ? "Hủy & Xóa" : "Hủy sửa"}><X className="w-4 h-4"/></Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="border border-slate-300 font-semibold text-center whitespace-nowrap bg-slate-50">{formatDate(row.date)}</TableCell>
                            <TableCell className="border border-slate-300 text-center whitespace-nowrap font-medium text-slate-700 bg-slate-50">{row.dayOfWeek}</TableCell>
                            {!isCompactMode && (
                              <>
                                <TableCell className="border border-slate-300 text-right whitespace-nowrap font-medium text-slate-700">{formatCurrency(row.cash)}</TableCell>
                                <TableCell className="border border-slate-300 text-right whitespace-nowrap font-medium text-slate-700">{formatCurrency(row.transfer)}</TableCell>
                                <TableCell className="border border-slate-300 text-right whitespace-nowrap font-medium text-slate-700">{formatCurrency(row.card)}</TableCell>
                                <TableCell className="border border-slate-300 text-right whitespace-nowrap font-medium text-slate-700">{formatCurrency(row.debt||0)}</TableCell>
                              </>
                            )}
                            <TableCell className="border border-slate-300 text-right font-bold text-orange-600 whitespace-nowrap bg-orange-50/30">{formatCurrency(row.preTaxRevenue||0)}</TableCell>
                            <TableCell className="border border-slate-300 text-right font-extrabold text-primary whitespace-nowrap bg-primary/5">{formatCurrency(row.totalGross)}</TableCell>
                            <TableCell className="border border-slate-300 text-center whitespace-nowrap font-semibold text-slate-700">{row.guestCount}</TableCell>
                            <TableCell className="border border-slate-300 text-right font-bold text-blue-600 whitespace-nowrap bg-blue-50/30">{formatCurrency(row.guestCount>0?row.totalGross/row.guestCount:0)}</TableCell>
                            <TableCell className="border border-slate-300 text-center whitespace-nowrap font-semibold text-slate-700">{row.billCount}</TableCell>
                            <TableCell className="border border-slate-300 text-sm whitespace-normal min-w-[200px] break-words leading-relaxed">{row.note||""}</TableCell>
                            <TableCell className="border border-slate-300 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" onClick={()=>handleEditClick(row)} disabled={!!editingId} className={`hover:bg-blue-100 hover:text-blue-600 h-8 w-8 ${editingId ? 'opacity-50' : ''}`}><Edit2 className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={()=>row._id && handleDeleteRow(row._id)} disabled={!!editingId} className={`text-red-500 hover:bg-red-100 h-8 w-8 ${editingId ? 'opacity-50' : ''}`}><Trash2 className="w-4 h-4"/></Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              )) : (<TableRow><TableCell colSpan={isCompactMode?11:13} className="border border-slate-300 h-32 text-center text-muted-foreground font-medium">Chưa có dữ liệu. Hãy thêm doanh thu ngày.</TableCell></TableRow>)}
            </TableBody>
            
            <TableFooter className="bg-primary/10 sticky bottom-0 z-10 border-t-4 border-primary/30 shadow-md">
              <TableRow className="hover:bg-primary/10">
                <TableCell colSpan={2} className="border border-slate-300 text-center font-extrabold text-primary text-base whitespace-nowrap">TỔNG CỘNG ({totalDays} Ngày)</TableCell>
                {!isCompactMode && (
                  <>
                    <TableCell className="border border-slate-300 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(totals.cash)}</TableCell>
                    <TableCell className="border border-slate-300 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(totals.transfer)}</TableCell>
                    <TableCell className="border border-slate-300 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(totals.card)}</TableCell>
                    <TableCell className="border border-slate-300 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(totals.debt)}</TableCell>
                  </>
                )}
                <TableCell className="border border-slate-300 text-right font-extrabold text-orange-600 whitespace-nowrap">{formatCurrency(totals.preTax)}</TableCell>
                <TableCell className="border border-slate-300 text-right font-black text-primary text-[1.05rem] whitespace-nowrap">{formatCurrency(totals.totalGross)}</TableCell>
                <TableCell className="border border-slate-300 text-center font-extrabold text-slate-800 whitespace-nowrap">{totals.guest}</TableCell>
                <TableCell className="border border-slate-300 text-right font-extrabold text-blue-600 whitespace-nowrap">{formatCurrency(avgPerGuest)}</TableCell>
                <TableCell className="border border-slate-300 text-center font-extrabold text-slate-800 whitespace-nowrap">{totals.bill}</TableCell>
                <TableCell className="border border-slate-300"></TableCell>
                <TableCell className="border border-slate-300"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default DailyReport;