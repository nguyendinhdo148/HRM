// router/dashboard/bar/guiruou.tsx
import React, { useState, useEffect, useMemo } from "react";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Search, RefreshCcw, Minus, Plus, Trash2, Edit3, User, FileText, Wine, Archive, PlusCircle, GlassWater, History, Clock, PieChart, AlertTriangle } from "lucide-react";

const MOCK_BOTTLES = [
  "AUSTIN HOPE", "Ballantines 30", "BALVENIE 12", "BALVENIE 14", "BALVENIE 21",
  "BOWMORE 30", "CHAMPAGNE DELAMOTTE", "CHAMPAGNE GH MUMM", "CHAMPAGNE TRIBAUT",
  "Chateau Mont Redon", "Cognac Kriknac XO", "Dom Perignon 2012 Vintage",
  "Dom Perignon Vintage 2010", "Glenfiddich 21", "Gordon & macphail", "HEAVEN HILL",
  "Hibiki Harmony", "HIBIKI blender choice", "Japanese Brandy The Kobe 20 Years",
  "Jose Cruevo Reposado", "LAGAVULIN 25", "LOUIS JADOT TRẮNG", "MAC Enigma (màu cam)",
  "Macallan 12", "Macallan 12 sherry cask", "Macallan 18", "The Macallan 18",
  "MACCALLAN 25", "Macallan No.6", "Macallan rare cask 2022", "Martell Blueswift",
  "Martell Chanteloup XO", "OLD & RARE 32", "Royal salute 32", "Rượu Mao Đài",
  "SAKE KUBOTA", "SAKE nhãn xám ko tem phụ", "Sake Dassai Future", "Sake Dassai Future with famers",
  "Sparkling wine FOGOSO", "TAITINGER ROSE", "Vang đỏ Brane Catenac", "VANG ĐỎ CAYMUS",
  "VANG ĐỎ CHATEAU CHEVAL BLANC", "VANG ĐỎ CHATEAU MOUTON ROTHCHILD",
  "Vang đỏ Croisse du Casse 2010 Pomerol", "Vang đỏ Goruverde", "Vang Đỏ La TOUR CARNET",
  "Vang đỏ Le Faite", "VANG ĐỎ MARGAUX 2006", "VANG ĐỎ Masso Antico",
  "Vang đỏ Overture by Opus One", "VANG ĐỎ QuinQuela", "Vang đỏ Vosne Romanese",
  "VANG F", "Vang Hồng BY OTT Cotes De Provence", "Vang trắng Corton- Charlemagne Grand cru, Louis Latour",
  "VANG TRẮNG RIMPAPERE", "Vang trắng Rimapere", "Whisky Caol Ila 12/1L", "Whisky Chacha", "Yamazaki 18"
];

const FRACTIONS = ["0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"];

interface PendingBottle {
  id: string;
  bottleName: string;
  qty: number | string; 
  expirationDate: string;
}

interface HistoryItem {
  _id: string;
  actionType: string;
  amountTaken?: number;
  amountChanged?: number;
  note?: string;
  date: string;
  performedBy?: { name: string };
}

interface Bottle {
  _id: string;
  customerName: string;
  bottleName: string;
  fullBottles: number;
  fraction: string;
  status: string;
  recordType: string;
  expirationDate?: string;
  importDate?: string;
  createdAt: string;
  history: HistoryItem[];
}

export default function GuiRuou() {
  const { user } = useAuth();
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"Gửi" | "Mượn" | "ThốngKê" | "ThốngKêMượn">("Gửi");

  const [filterName, setFilterName] = useState("");
  const [filterBottle, setFilterBottle] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [pendingBottles, setPendingBottles] = useState<PendingBottle[]>([]);
  const [bottleSearch, setBottleSearch] = useState("");
  const [showBottleDropdown, setShowBottleDropdown] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");

  const [withdrawModal, setWithdrawModal] = useState<{ isOpen: boolean; bottleId: string | null; }>({ isOpen: false, bottleId: null });
  const [amountTaken, setAmountTaken] = useState("");
  const [newFullBottles, setNewFullBottles] = useState<number>(0);
  const [newFraction, setNewFraction] = useState("0");
  const [withdrawNote, setWithdrawNote] = useState("");

  const [editHistoryModal, setEditHistoryModal] = useState({
    isOpen: false, bottleId: null as string | null, historyId: null as string | null,
    actionType: "", amountChanged: "", note: "", newFullBottles: 0, newFraction: "0"
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false, bottleId: null as string | null, historyId: null as string | null,
    logText: "", newFullBottles: 0, newFraction: "0"
  });

  useEffect(() => {
    if (user && user.role !== "bar" && user.role !== "admin") {
      alert("Bạn không có quyền truy cập trang này!");
      window.history.back();
    } else {
      loadBottles();
    }
  }, [user]);

  const loadBottles = async () => {
    try {
      setLoading(true);
      const data = await fetchData<Bottle[]>("/bottle-keep"); 
      setBottles(data || []); 
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWine = (name: string) => {
    const existing = pendingBottles.findIndex(i => i.bottleName === name && i.expirationDate === expirationDate);
    if (existing >= 0) {
      const newItems = [...pendingBottles];
      newItems[existing].qty = Number(newItems[existing].qty) + 1;
      setPendingBottles(newItems);
    } else {
      setPendingBottles([...pendingBottles, { id: Math.random().toString(36).substr(2, 9), bottleName: name, qty: 1, expirationDate }]);
    }
    setBottleSearch(""); setShowBottleDropdown(false);
  };

  const handleAddCustomWine = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && bottleSearch.trim()) handleSelectWine(bottleSearch.trim());
  };

  const handleChangeItemQty = (index: number, delta: number) => {
    const newItems = [...pendingBottles];
    let currentQty = Number(newItems[index].qty) || 0;
    let newQty = currentQty + delta;
    newQty = Math.round(newQty * 10) / 10; 
    if (newQty <= 0) newItems.splice(index, 1);
    else newItems[index].qty = newQty;
    setPendingBottles(newItems);
  };

  const handleTypeItemQty = (index: number, val: string) => {
    const newItems = [...pendingBottles];
    newItems[index].qty = val;
    setPendingBottles(newItems);
  };

  const handleBlurItemQty = (index: number) => {
    const newItems = [...pendingBottles];
    let parsed = Number(newItems[index].qty);
    if (isNaN(parsed) || parsed <= 0) newItems.splice(index, 1);
    else newItems[index].qty = parsed;
    setPendingBottles(newItems);
  };

  const handleSaveAll = async () => {
    if (!customerName.trim()) return alert("Vui lòng nhập tên khách hàng");
    if (pendingBottles.length === 0) return alert("Vui lòng thêm rượu vào phiếu");

    try {
      setLoading(true);
      for (const item of pendingBottles) {
        await postData("/bottle-keep", {
          customerName: customerName.trim(), 
          bottleName: item.bottleName, 
          recordType: activeTab, 
          expirationDate: item.expirationDate || null,
          qty: Number(item.qty)
        });
      }
      await loadBottles();
      setCustomerName(""); setPendingBottles([]); setExpirationDate("");
      alert("Đã lưu thành công!");
    } catch (error) {
      alert("Lỗi khi lưu! Vui lòng kiểm tra lại Backend.");
    } finally {
      setLoading(false);
    }
  };

  const openWithdrawModal = (item: Bottle) => {
    setWithdrawModal({ isOpen: true, bottleId: item._id });
    setNewFullBottles(item.fullBottles);
    setNewFraction(item.fraction || "0");
    setAmountTaken(""); setWithdrawNote("");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedBottle = await postData<Bottle>(`/bottle-keep/${withdrawModal.bottleId}/withdraw`, { amountTaken, newFullBottles, newFraction, note: withdrawNote });
      setBottles(prev => prev.map(b => b._id === updatedBottle._id ? updatedBottle : b));
      setWithdrawModal({ isOpen: false, bottleId: null });
    } catch (error) {
      alert("Lỗi server khi cập nhật trạng thái rượu.");
    }
  };

  const handleDeleteBottle = async (bottleId: string) => {
    if (!window.confirm("BẠN CÓ CHẮC MUỐN XÓA TOÀN BỘ PHIẾU NÀY KHÔNG?\n(Hành động này sẽ xóa sạch chai rượu và lịch sử, không thể hoàn tác!)")) return;
    try {
      await deleteData(`/bottle-keep/${bottleId}`);
      setBottles(prev => prev.filter(b => b._id !== bottleId));
    } catch (error) {
      alert("Lỗi khi xóa phiếu rượu.");
    }
  };

  const openEditHistory = (bottle: Bottle, historyItem: HistoryItem) => {
    setEditHistoryModal({
      isOpen: true, 
      bottleId: bottle._id, 
      historyId: historyItem._id,
      actionType: historyItem.actionType || "",
      amountChanged: (historyItem.amountTaken || historyItem.amountChanged || "").toString(),
      note: historyItem.note || "",
      newFullBottles: bottle.fullBottles,
      newFraction: bottle.fraction || "0"
    });
  };

  const handleUpdateHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedBottle: Bottle = await updateData(`/bottle-keep/${editHistoryModal.bottleId}/history/${editHistoryModal.historyId}`, {
        actionType: editHistoryModal.actionType,
        amountChanged: editHistoryModal.amountChanged,
        note: editHistoryModal.note,
        newFullBottles: editHistoryModal.newFullBottles,
        newFraction: editHistoryModal.newFraction
      });
      setBottles(prev => prev.map(b => b._id === updatedBottle._id ? updatedBottle : b));
      setEditHistoryModal(prev => ({ ...prev, isOpen: false }));
      alert("Đã cập nhật lịch sử và số lượng kho!");
    } catch (error) {
      alert("Lỗi khi cập nhật lịch sử.");
    }
  };

  const openDeleteConfirm = (bottle: Bottle, historyItem: HistoryItem) => {
    setDeleteConfirmModal({
      isOpen: true,
      bottleId: bottle._id,
      historyId: historyItem._id,
      logText: `[${historyItem.actionType}] ${historyItem.amountTaken || historyItem.amountChanged}`,
      newFullBottles: bottle.fullBottles,
      newFraction: bottle.fraction || "0"
    });
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedBottle = await postData<Bottle>(`/bottle-keep/${deleteConfirmModal.bottleId}/history/${deleteConfirmModal.historyId}/delete`, {
        newFullBottles: deleteConfirmModal.newFullBottles,
        newFraction: deleteConfirmModal.newFraction
      });
      setBottles(prev => prev.map(b => b._id === updatedBottle._id ? updatedBottle : b));
      setDeleteConfirmModal({ isOpen: false, bottleId: null, historyId: null, logText: "", newFullBottles: 0, newFraction: "0" });
      alert("Đã xóa lịch sử và cập nhật tồn kho!");
    } catch (error) {
      alert("Lỗi khi xóa lịch sử. Vui lòng kiểm tra API.");
    }
  };

  const displayedBottles = useMemo(() => {
    return bottles
      .filter(b => {
        const matchTab = (b.recordType || "Gửi") === activeTab;
        if (!matchTab) return false;

        const matchCustomer = b.customerName.toLowerCase().includes(filterName.toLowerCase());
        const matchWine = b.bottleName.toLowerCase().includes(filterBottle.toLowerCase());
        const dateObj = new Date(b.importDate || b.createdAt);
        const matchMonth = filterMonth ? !isNaN(dateObj.getTime()) && dateObj.toISOString().slice(0, 7) === filterMonth : true;

        return matchCustomer && matchWine && matchMonth;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bottles, filterName, filterBottle, filterMonth, activeTab]);

  const uniqueCustomers = useMemo(() => Array.from(new Set(bottles.filter(b => (b.recordType || "Gửi") === activeTab).map(b => b.customerName))), [bottles, activeTab]);

  const customerStatsGui = useMemo(() => {
    const groups: Record<string, Bottle[]> = {};
    bottles.forEach(b => {
      if ((b.recordType || "Gửi") === "Gửi" && (b.fullBottles > 0 || (b.fraction && b.fraction !== "0" && b.fraction !== "0.0"))) {
        if (!groups[b.customerName]) groups[b.customerName] = [];
        groups[b.customerName].push(b);
      }
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [bottles]);

  const customerStatsMuon = useMemo(() => {
    const groups: Record<string, Bottle[]> = {};
    bottles.forEach(b => {
      if (b.recordType === "Mượn" && (b.fullBottles > 0 || (b.fraction && b.fraction !== "0" && b.fraction !== "0.0"))) {
        if (!groups[b.customerName]) groups[b.customerName] = [];
        groups[b.customerName].push(b);
      }
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [bottles]);

  const renderStock = (full: number, fraction: string) => {
    if (full === 0 && (fraction === "0" || fraction === "0.0")) return <span className="text-red-500 font-bold text-[10px] sm:text-[11px] uppercase">Đã Hết</span>;
    const parts = [];
    if (full > 0) parts.push(`${full} nguyên`);
    if (fraction !== "0" && fraction !== "0.0") parts.push(`${fraction} dở`);
    return parts.join(" + ");
  };

  const getTotalPending = () => {
    let total = 0;
    pendingBottles.forEach(p => total += (Number(p.qty) || 0));
    return Math.round(total * 10) / 10;
  };

  return (
    <div className="h-full overflow-auto bg-slate-50 p-2 sm:p-6 text-sm font-sans">
      <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4 pb-10">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-xl shadow-xs border border-slate-200 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Archive className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Quản Lý Tủ Rượu</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Theo dõi rượu gửi, mượn & thống kê</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadBottles} className="w-full sm:w-auto h-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/> <span className="sm:hidden text-xs">Làm mới dữ liệu</span>
          </Button>
        </div>

        {/* TAB NAVIGATION - Mượt mà trên Mobile */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="mb-3 sm:mb-4 h-auto sm:h-10 bg-white border border-slate-200 shadow-xs w-full p-1.5 rounded-lg flex flex-nowrap overflow-x-auto scrollbar-hide justify-start">
            <TabsTrigger value="Gửi" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 whitespace-nowrap rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-medium">Gửi Rượu</TabsTrigger>
            <TabsTrigger value="Mượn" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 whitespace-nowrap rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-medium">Cho Mượn</TabsTrigger>
            <TabsTrigger value="ThốngKê" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 whitespace-nowrap rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all font-medium flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5"/> Thống Kê Gửi</TabsTrigger>
            <TabsTrigger value="ThốngKêMượn" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 whitespace-nowrap rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all font-medium flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5"/> Thống Kê Mượn</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          
          {/* TAB: THỐNG KÊ (RƯỢU GỬI) */}
          {activeTab === "ThốngKê" && (
            <div className="lg:col-span-12">
              <Card className="shadow-md border-0 ring-1 ring-slate-200 bg-white overflow-hidden rounded-xl">
                <div className="bg-emerald-50/80 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-emerald-100 flex items-center gap-2">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"/>
                  <span className="font-black text-emerald-800 uppercase tracking-widest text-[11px] sm:text-sm">Rượu GỬI còn theo khách</span>
                </div>
                <CardContent className="p-0">
                  {customerStatsGui.length === 0 ? (
                    <div className="text-center py-10 sm:py-20 text-slate-400"><Wine className="w-8 h-8 mx-auto opacity-20 mb-2"/><p className="text-xs sm:text-sm">Hiện không có khách nào gửi rượu.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50">
                      {customerStatsGui.map(([customer, userBottles]) => (
                        <div key={customer} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                          <div className="bg-slate-100/50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm"><User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500"/> {customer}</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">{userBottles.length} chai</Badge>
                          </div>
                          <div className="p-2 sm:p-3 space-y-2">
                            {userBottles.map((b: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-1.5 sm:pb-2 last:pb-0">
                                <div className="pr-2">
                                  <div className="font-semibold text-slate-700 leading-tight">{b.bottleName}</div>
                                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Gửi: {new Date(b.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-blue-50/50 text-blue-700 border-blue-200">
                                    {renderStock(b.fullBottles, b.fraction)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: THỐNG KÊ (RƯỢU MƯỢN) */}
          {activeTab === "ThốngKêMượn" && (
            <div className="lg:col-span-12">
              <Card className="shadow-md border-0 ring-1 ring-slate-200 bg-white overflow-hidden rounded-xl">
                <div className="bg-amber-50/80 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-amber-100 flex items-center gap-2">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600"/>
                  <span className="font-black text-amber-800 uppercase tracking-widest text-[11px] sm:text-sm">Rượu ĐANG CHO MƯỢN</span>
                </div>
                <CardContent className="p-0">
                  {customerStatsMuon.length === 0 ? (
                    <div className="text-center py-10 sm:py-20 text-slate-400"><Wine className="w-8 h-8 mx-auto opacity-20 mb-2"/><p className="text-xs sm:text-sm">Hiện không có khách nào đang mượn rượu.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50">
                      {customerStatsMuon.map(([customer, userBottles]) => (
                        <div key={customer} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                          <div className="bg-slate-100/50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm"><User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500"/> {customer}</span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs">{userBottles.length} chai</Badge>
                          </div>
                          <div className="p-2 sm:p-3 space-y-2">
                            {userBottles.map((b: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-1.5 sm:pb-2 last:pb-0">
                                <div className="pr-2">
                                  <div className="font-semibold text-slate-700 leading-tight">{b.bottleName}</div>
                                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Mượn: {new Date(b.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-amber-50/50 text-amber-700 border-amber-200">
                                    {renderStock(b.fullBottles, b.fraction)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TABS: GỬI / MƯỢN */}
          {(activeTab === "Gửi" || activeTab === "Mượn") && (
            <>
              {/* CỘT TRÁI: FORM */}
              <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
                <Card className="shadow-md border-0 ring-1 ring-slate-200 bg-white transition-all">
                  <CardHeader className="py-2.5 sm:py-3 px-3 sm:px-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-1.5 sm:gap-2 text-slate-800 uppercase tracking-wider">
                      <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600"/> Phiếu {activeTab}
                    </CardTitle>
                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-600 font-bold text-[10px] sm:text-xs">{getTotalPending()} Chai</Badge>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-4 sm:space-y-5">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> Tên Người {activeTab}</label>
                      <Input placeholder="Gõ tên khách..." value={customerName} onChange={e => { setCustomerName(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} className="h-9 sm:h-10 text-xs sm:text-sm" />
                      {showCustomerDropdown && (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
                          {uniqueCustomers.filter(c => c.toLowerCase().includes(customerName.toLowerCase())).map(name => (
                            <div key={name} onMouseDown={(e) => { e.preventDefault(); setCustomerName(name); setShowCustomerDropdown(false); }} className="p-2 hover:bg-blue-50 cursor-pointer"><span className="font-semibold text-slate-700 text-[11px] sm:text-xs">{name}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Hạn Sử Dụng <span className="normal-case font-normal text-slate-400 text-[9px] sm:text-[10px]">(Tuỳ chọn)</span></label>
                      <Input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm font-medium" />
                    </div>
                    <div className="bg-blue-50/40 p-2.5 sm:p-3.5 rounded-xl border border-blue-100 space-y-2.5 relative">
                      <label className="text-[10px] sm:text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 mb-1"><Wine className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> Chọn rượu vào phiếu</label>
                      <div className="relative w-full">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                        <Input placeholder="Gõ tên rượu..." value={bottleSearch} onFocus={() => setShowBottleDropdown(true)} onBlur={() => setTimeout(() => setShowBottleDropdown(false), 200)} onChange={e => setBottleSearch(e.target.value)} onKeyDown={handleAddCustomWine} className="h-9 sm:h-10 pl-8 sm:pl-9 text-xs sm:text-sm bg-white" />
                        {showBottleDropdown && (
                          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {MOCK_BOTTLES.filter(w => w.toLowerCase().includes(bottleSearch.toLowerCase())).map(w => (
                              <div key={w} onMouseDown={(e) => { e.preventDefault(); handleSelectWine(w); }} className="p-2 sm:p-2.5 hover:bg-blue-50 cursor-pointer"><span className="font-semibold text-slate-700 text-[10px] sm:text-xs">{w}</span></div>
                            ))}
                            {bottleSearch && !MOCK_BOTTLES.some(w => w.toLowerCase() === bottleSearch.toLowerCase()) && (
                              <div onMouseDown={(e) => { e.preventDefault(); handleSelectWine(bottleSearch); }} className="p-2 sm:p-2.5 hover:bg-blue-50 cursor-pointer bg-slate-50 border-t border-blue-100"><span className="font-semibold text-blue-600 text-[10px] sm:text-xs">+ Thêm mới: "{bottleSearch}"</span></div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 sm:mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold text-slate-500 flex justify-between border-b border-slate-100 uppercase tracking-widest">
                          <span>Tên Rượu</span>
                          <span className="w-[80px] sm:w-[100px] text-center">Số lượng</span>
                        </div>
                        <div className="p-1 sm:p-1.5 flex-1 min-h-[100px] max-h-[200px] overflow-y-auto">
                          {pendingBottles.length === 0 ? (
                            <div className="text-center text-slate-400 py-4 sm:py-6"><Wine className="w-5 h-5 sm:w-6 sm:h-6 mx-auto opacity-40 mb-1"/><p className="text-[10px] sm:text-xs">Chưa có rượu</p></div>
                          ) : (
                            <div className="space-y-1.5 p-0.5 sm:p-1">
                              {pendingBottles.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200">
                                  <div className="flex-1 overflow-hidden pr-1.5 sm:pr-2">
                                    <div className="font-bold text-slate-700 truncate text-[11px] sm:text-[13px]">{item.bottleName}</div>
                                  </div>
                                  <div className="flex items-center bg-slate-100 rounded border border-slate-200 shrink-0">
                                    <button onClick={() => handleChangeItemQty(idx, -0.5)} className="w-5 sm:w-6 h-6 sm:h-7 bg-white rounded-l flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50"><Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
                                    <input 
                                      type="number" step="0.1" min="0.1"
                                      value={item.qty}
                                      onChange={(e) => handleTypeItemQty(idx, e.target.value)}
                                      onBlur={() => handleBlurItemQty(idx)}
                                      className="w-8 sm:w-10 h-6 sm:h-7 text-center font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 text-[11px] sm:text-[13px]"
                                    />
                                    <button onClick={() => handleChangeItemQty(idx, 0.5)} className="w-5 sm:w-6 h-6 sm:h-7 bg-white rounded-r flex items-center justify-center text-slate-600 hover:text-green-600 hover:bg-green-50"><Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSaveAll} className="w-full bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 font-black text-xs sm:text-sm uppercase text-white"><Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"/> Xác Nhận Lưu</Button>
                  </CardContent>
                </Card>
              </div>

              {/* CỘT PHẢI: LIST */}
              <div className="lg:col-span-8 flex flex-col">
                <Card className="shadow-md border-0 ring-1 ring-slate-200 bg-white overflow-hidden rounded-xl h-full flex flex-col">
                  <div className="bg-slate-50/80 px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black text-slate-500 uppercase flex flex-col md:flex-row gap-2 sm:gap-3 justify-between border-b border-slate-100 md:items-center">
                    <span className="flex items-center gap-1.5 sm:gap-2 text-blue-700 shrink-0"><GlassWater className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> DANH SÁCH {activeTab}</span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      {/* BỘ LỌC DÀN HÀNG NGANG TRÊN MOBILE */}
                      <div className="flex gap-2 w-full">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          <Input placeholder="Tên khách..." value={filterName} onChange={e => setFilterName(e.target.value)} className="h-7 sm:h-8 pl-6 sm:pl-8 text-[10px] sm:text-xs w-full" />
                        </div>
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          <Input placeholder="Tên rượu..." value={filterBottle} onChange={e => setFilterBottle(e.target.value)} className="h-7 sm:h-8 pl-6 sm:pl-8 text-[10px] sm:text-xs w-full" />
                        </div>
                      </div>
                      {/* Lọc tháng */}
                      <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="h-7 sm:h-8 text-[10px] sm:text-xs w-full sm:w-32 shrink-0" />
                    </div>
                  </div>
                  
                  {/* WRAPPER BẢNG CÓ THANH CUỘN NGANG KHI TRÊN MOBILE */}
                  <div className="w-full overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300">
                    <Table className="w-full min-w-[550px]">
                      <TableHeader className="bg-slate-50/90 sticky top-0 z-10 shadow-xs">
                        <TableRow>
                          <TableHead className="w-[120px] sm:w-[150px] p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Khách Hàng</TableHead>
                          <TableHead className="p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Tên Rượu</TableHead>
                          <TableHead className="text-center p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Tồn Kho</TableHead>
                          <TableHead className="text-center p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Trạng Thái</TableHead>
                          <TableHead className="text-right p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 sm:py-10 text-slate-400 text-xs">Đang tải...</TableCell></TableRow>
                        ) : displayedBottles.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 sm:py-10 text-slate-400 text-xs">Không có dữ liệu.</TableCell></TableRow>
                        ) : (
                          displayedBottles.map(item => (
                            <React.Fragment key={item._id}>
                              <TableRow className="hover:bg-slate-50 group border-b-slate-100">
                                <TableCell className="p-2 sm:p-3 align-top">
                                  <div className="font-bold text-blue-700 text-[11px] sm:text-sm flex items-start sm:items-center gap-1 sm:gap-1.5"><User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 mt-0.5 sm:mt-0 shrink-0"/> <span className="leading-tight">{item.customerName}</span></div>
                                  <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 pl-4 sm:pl-5">{new Date(item.importDate || item.createdAt).toLocaleDateString('vi-VN')}</div>
                                </TableCell>
                                <TableCell className="p-2 sm:p-3 align-top">
                                  <div className="font-semibold text-slate-700 text-[11px] sm:text-xs leading-tight">{item.bottleName}</div>
                                  {item.expirationDate && <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">HSD: {new Date(item.expirationDate).toLocaleDateString('vi-VN')}</div>}
                                </TableCell>
                                <TableCell className="p-2 sm:p-3 text-center align-top"><Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] whitespace-nowrap">{renderStock(item.fullBottles, item.fraction)}</Badge></TableCell>
                                <TableCell className="p-2 sm:p-3 text-center align-top">
                                  <Badge className={`text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap ${['Đang giữ', 'Đang mượn'].includes(item.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} variant="outline">{item.status}</Badge>
                                </TableCell>
                                <TableCell className="p-2 sm:p-3 align-top">
                                  <div className="flex flex-col sm:flex-row items-end justify-end gap-1.5 sm:gap-2">
                                    {['Đang giữ', 'Đang mượn'].includes(item.status) && (
                                      <Button variant="outline" size="sm" onClick={() => openWithdrawModal(item)} className="h-6 sm:h-7 px-2 text-[9px] sm:text-[10px] border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white uppercase font-bold w-full sm:w-auto">
                                        {activeTab === "Gửi" ? "Suất" : "Trả"}
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBottle(item._id)} className="h-6 w-6 sm:w-7 sm:h-7 text-red-400 hover:bg-red-50 hover:text-red-600 shrink-0 bg-red-50/50 sm:bg-transparent" title="Xóa toàn bộ phiếu">
                                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              
                              <TableRow className="bg-slate-50/50 border-b-slate-100">
                                <TableCell colSpan={5} className="p-1.5 sm:p-2 pl-3 sm:pl-12">
                                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><History className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> Lịch sử:</div>
                                  <div className="space-y-1 sm:space-y-1.5">
                                    {(!item.history || item.history.length === 0) ? (
                                      <div className="text-[10px] sm:text-[11px] text-slate-400 italic bg-white p-1.5 rounded border border-dashed border-slate-200 inline-block">
                                        Chưa có lịch sử.
                                      </div>
                                    ) : (
                                      item.history.map((h: any, i: number) => (
                                        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center text-[10px] sm:text-[11px] text-slate-600 group/hist p-1.5 sm:p-1 rounded bg-white sm:bg-transparent border sm:border-0 border-slate-200 sm:hover:bg-slate-100 transition-colors">
                                          <span className="w-16 sm:w-20 opacity-70 shrink-0">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
                                          <span className="font-bold text-blue-600 sm:w-20 shrink-0">[{h.actionType}]</span>
                                          <span className="font-semibold text-slate-700">{h.amountTaken || h.amountChanged}</span>
                                          {h.note && <span className="italic text-slate-400 truncate max-w-[80px] sm:max-w-xs">({h.note})</span>}
                                          <div className="ml-auto flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0 justify-end sm:justify-start border-t sm:border-0 border-slate-100 pt-1 sm:pt-0">
                                            {h.performedBy && <span className="opacity-50 text-[9px] sm:text-[11px]">- {h.performedBy.name}</span>}
                                            {/* Nút Sửa/Xóa hiển thị luôn trên Mobile */}
                                            <div className="flex gap-1 sm:opacity-0 group-hover/hist:opacity-100 transition-opacity">
                                              <button onClick={() => openEditHistory(item, h)} className="p-1 sm:p-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100" title="Sửa log"><Edit3 size={10} className="sm:w-3 sm:h-3"/></button>
                                              <button onClick={() => openDeleteConfirm(item, h)} className="p-1 sm:p-1.5 bg-red-50 border border-red-200 text-red-500 rounded hover:bg-red-100" title="Xóa log"><Trash2 size={10} className="sm:w-3 sm:h-3"/></button>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CÁC MODAL - Thêm padding và max-width chuẩn Mobile */}

      {/* Modal Rót / Trả Rượu */}
      {withdrawModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-md shadow-2xl border-0 ring-1 ring-slate-200 relative overflow-hidden">
            <div className="bg-blue-600 h-1.5 w-full absolute top-0 left-0"></div>
            <CardHeader className="border-b border-slate-100 pb-3 sm:pb-4 pt-4 sm:pt-6"><CardTitle className="text-base sm:text-lg font-bold text-slate-800 uppercase flex items-center gap-2"><GlassWater className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"/>{activeTab === "Gửi" ? "Suất Rượu" : "Trả Rượu"}</CardTitle></CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              <form onSubmit={handleWithdraw} className="space-y-4 sm:space-y-5">
                <div><label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-slate-500 uppercase">Ghi log (VD: Rót 2 ly)</label><Input type="text" value={amountTaken} onChange={e => setAmountTaken(e.target.value)} required className="h-9 sm:h-10 text-xs sm:text-sm"/></div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
                  <div><label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-blue-700 uppercase">Số Chai Nguyên MỚI</label><Input type="number" min="0" value={newFullBottles} onChange={e => setNewFullBottles(parseInt(e.target.value) || 0)} className="text-center font-bold h-9 sm:h-10 text-xs sm:text-sm" /></div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-blue-700 uppercase">Tỉ Lệ Chai Dở MỚI</label>
                    <SelectUI value={newFraction} onValueChange={setNewFraction}><SelectTrigger className="font-bold text-center h-9 sm:h-10 text-xs sm:text-sm"><SelectValue placeholder="Tỉ lệ" /></SelectTrigger><SelectContent>{FRACTIONS.map(f => (<SelectItem key={f} value={f} className="font-bold text-xs sm:text-sm">{f === "0" ? "0 (Hết)" : f}</SelectItem>))}</SelectContent></SelectUI>
                  </div>
                </div>
                <div><label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-slate-500 uppercase">Ghi Chú</label><Input type="text" value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm"/></div>
                <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setWithdrawModal({ isOpen: false, bottleId: null })} className="h-9 text-xs sm:text-sm">Hủy</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase h-9 text-xs sm:text-sm">Cập Nhật Kho</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal SỬA LỊCH SỬ VÀ SỬA KHO */}
      {editHistoryModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-md shadow-2xl border-0 ring-1 ring-slate-200 relative overflow-hidden">
            <div className="bg-amber-500 h-1.5 w-full absolute top-0 left-0"></div>
            <CardHeader className="border-b border-slate-100 pb-3 sm:pb-4 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500"/> Sửa Log & Kho
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleUpdateHistory} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-slate-500 uppercase">Hành động (Gửi thêm / Rót rượu)</label>
                  <Input type="text" value={editHistoryModal.actionType} onChange={e => setEditHistoryModal(prev => ({...prev, actionType: e.target.value}))} required className="h-9 sm:h-10 text-xs sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-slate-500 uppercase">Số lượng thay đổi</label>
                  <Input type="text" value={editHistoryModal.amountChanged} onChange={e => setEditHistoryModal(prev => ({...prev, amountChanged: e.target.value}))} required className="h-9 sm:h-10 text-xs sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-slate-500 uppercase">Ghi chú thêm</label>
                  <Input type="text" value={editHistoryModal.note} onChange={e => setEditHistoryModal(prev => ({...prev, note: e.target.value}))} className="h-9 sm:h-10 text-xs sm:text-sm"/>
                </div>
                
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-3 sm:mt-4 mb-1 sm:mb-2 uppercase font-bold tracking-widest text-center border-t border-slate-100 pt-2 sm:pt-3">Nhập lại Tồn Kho (Nếu Cần)</div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-100">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-amber-700 uppercase">Chai Nguyên (Mới)</label>
                    <Input 
                      type="number" min="0" 
                      value={editHistoryModal.newFullBottles} 
                      onChange={e => setEditHistoryModal(prev => ({...prev, newFullBottles: parseInt(e.target.value) || 0}))} 
                      className="text-center font-bold border-amber-200 focus:border-amber-500 bg-white h-9 sm:h-10 text-xs sm:text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-amber-700 uppercase">Chai Dở (Mới)</label>
                    <SelectUI value={editHistoryModal.newFraction} onValueChange={val => setEditHistoryModal(prev => ({...prev, newFraction: val}))}>
                      <SelectTrigger className="font-bold text-center border-amber-200 focus:ring-amber-500/20 bg-white h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Tỉ lệ" />
                      </SelectTrigger>
                      <SelectContent>
                        {FRACTIONS.map(f => (<SelectItem key={f} value={f} className="font-bold text-xs sm:text-sm">{f === "0" ? "0 (Hết)" : f}</SelectItem>))}
                      </SelectContent>
                    </SelectUI>
                  </div>
                </div>

                <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setEditHistoryModal(prev => ({...prev, isOpen: false}))} className="h-9 text-xs sm:text-sm">Hủy</Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider h-9 text-xs sm:text-sm">Lưu Thay Đổi</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal XÓA LỊCH SỬ & CẬP NHẬT TỒN KHO */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-md shadow-2xl border-0 ring-1 ring-red-200 relative overflow-hidden">
            <div className="bg-red-500 h-1.5 w-full absolute top-0 left-0"></div>
            <CardHeader className="border-b border-red-100 pb-3 sm:pb-4 pt-4 sm:pt-6 bg-red-50/50">
              <CardTitle className="text-base sm:text-lg font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5"/> Xóa Log & Cập Nhật Kho
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleConfirmDelete} className="space-y-3 sm:space-y-4">
                <div className="bg-slate-100 p-2 sm:p-3 rounded border border-slate-200 text-xs sm:text-sm">
                  <span className="font-bold text-slate-600 text-[10px] sm:text-[11px] uppercase block mb-1">Log sẽ bị xóa:</span>
                  <div className="font-semibold text-slate-800">{deleteConfirmModal.logText}</div>
                </div>
                
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-3 sm:mt-4 mb-1 sm:mb-2 uppercase font-bold tracking-widest text-center">Hãy nhập lại Tồn Kho thực tế</div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-blue-50/50 p-3 sm:p-4 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-blue-700 uppercase">Chai Nguyên (Mới)</label>
                    <Input 
                      type="number" min="0" 
                      value={deleteConfirmModal.newFullBottles} 
                      onChange={e => setDeleteConfirmModal(prev => ({...prev, newFullBottles: parseInt(e.target.value) || 0}))} 
                      className="text-center font-bold border-blue-200 focus:border-blue-500 bg-white h-9 sm:h-10 text-xs sm:text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold mb-1 sm:mb-1.5 text-blue-700 uppercase">Chai Dở (Mới)</label>
                    <SelectUI value={deleteConfirmModal.newFraction} onValueChange={val => setDeleteConfirmModal(prev => ({...prev, newFraction: val}))}>
                      <SelectTrigger className="font-bold text-center border-blue-200 focus:ring-blue-500/20 bg-white h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Tỉ lệ" />
                      </SelectTrigger>
                      <SelectContent>
                        {FRACTIONS.map(f => (<SelectItem key={f} value={f} className="font-bold text-xs sm:text-sm">{f === "0" ? "0 (Hết)" : f}</SelectItem>))}
                      </SelectContent>
                    </SelectUI>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setDeleteConfirmModal(prev => ({...prev, isOpen: false}))} className="h-9 text-xs sm:text-sm">Hủy</Button>
                  <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider shadow-md h-9 text-[10px] sm:text-xs">Xác Nhận Xóa & Lưu Kho</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}