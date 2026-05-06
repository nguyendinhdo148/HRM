import { useState, useEffect } from "react";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";

export default function BacklogPage() {
  const [monthData, setMonthData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("2026-03"); 
  const [isLoading, setIsLoading] = useState(false);
  
  // States cho Tab & Lọc
  const [activeTab, setActiveTab] = useState<"UNPOSTED" | "POSTED">("UNPOSTED");

  // States cho Form Tháng
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [monthNote, setMonthNote] = useState("");

  // States cho Form Hóa đơn
  const [editId, setEditId] = useState<string | null>(null);
  const defaultForm = {
    date: "", customerName: "", table: "", note: "",
    goodsAmount: "", discountAmount: "", beforeServiceCharge: "", totalAmount: "",
    status: "UNPOSTED", invoiceNumber: ""
  };
  const [formData, setFormData] = useState<any>(defaultForm);

  // =================== CRUD THÁNG ===================
  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const res: any = await fetchData(`/invoice-months/${selectedMonth}`);
      setMonthData(res);
      setMonthNote(res.note);
      setInvoices(res.invoices || []);
      setIsEditingMonth(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMonthData(null);
        setInvoices([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMonthData(); }, [selectedMonth]);

  const handleCreateMonth = async () => {
    try {
      await postData("/invoice-months", { monthStr: selectedMonth, note: "" });
      fetchMonthData();
    } catch (error) {
      alert("Không thể tạo tháng này!");
    }
  };

  const handleUpdateMonth = async () => {
    try {
      await updateData(`/invoice-months/${selectedMonth}`, { note: monthNote });
      fetchMonthData();
    } catch (error) {
      alert("Lỗi cập nhật ghi chú tháng!");
    }
  };

  const handleDeleteMonth = async () => {
    if (window.confirm(`NGUY HIỂM: Bạn có chắc muốn xóa TOÀN BỘ dữ liệu tháng ${selectedMonth}? Tất cả hóa đơn sẽ bị xóa sạch!`)) {
      try {
        await deleteData(`/invoice-months/${selectedMonth}`);
        fetchMonthData();
      } catch (error) {
        alert("Lỗi xóa tháng!");
      }
    }
  };

  // =================== CRUD HÓA ĐƠN ===================
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const newData = { ...prev, [name]: value };
      
      // Tự động tính TRƯỚC PPV = Tiền hàng - Tiền KM
      if (name === "goodsAmount" || name === "discountAmount") {
        if (newData.goodsAmount === "" && newData.discountAmount === "") {
          newData.beforeServiceCharge = ""; 
        } else {
          const goods = parseFloat(newData.goodsAmount as any) || 0;
          const discount = parseFloat(newData.discountAmount as any) || 0;
          newData.beforeServiceCharge = goods - discount;
        }
      }
      
      return newData;
    });
  };

  const handleSubmitInvoice = async (e: any) => {
    e.preventDefault();
    if (!monthData) return alert("Vui lòng tạo tháng trước!");

    const payload = {
      ...formData,
      goodsAmount: Number(formData.goodsAmount) || 0,
      discountAmount: Number(formData.discountAmount) || 0,
      beforeServiceCharge: Number(formData.beforeServiceCharge) || 0,
      totalAmount: Number(formData.totalAmount) || 0,
    };

    try {
      if (editId) {
        await updateData(`/invoices/${editId}`, payload);
        setEditId(null);
      } else {
        await postData("/invoices", { ...payload, monthBoard: monthData._id });
      }
      fetchMonthData();
      setFormData(defaultForm);
    } catch (error) {
      alert("Có lỗi xảy ra khi lưu hóa đơn!");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa hóa đơn này?")) {
      try {
        await deleteData(`/invoices/${id}`);
        fetchMonthData();
      } catch (error) {
        alert("Lỗi xóa hóa đơn!");
      }
    }
  };

  // =================== TÍNH TOÁN & LỌC ===================
  const filteredInvoices = invoices.filter(inv => inv.status === activeTab);

  // 1. Thống kê TỔNG TIỀN
  const totalUnposted = invoices.filter(i => i.status === "UNPOSTED").reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalPosted = invoices.filter(i => i.status === "POSTED").reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const diffTotal = totalUnposted - totalPosted; 

  // 2. Thống kê TRƯỚC PPV
  const ppvUnposted = invoices.filter(i => i.status === "UNPOSTED").reduce((sum, i) => sum + (Number(i.beforeServiceCharge) || 0), 0);
  const ppvPosted = invoices.filter(i => i.status === "POSTED").reduce((sum, i) => sum + (Number(i.beforeServiceCharge) || 0), 0);
  const diffPpv = ppvUnposted - ppvPosted;

  const formatCurrency = (num: number) => new Intl.NumberFormat('vi-VN').format(num || 0);

  const openPicker = (e: any) => {
    try {
      e.target.showPicker();
    } catch (error) {}
  };

  // =================== RENDER GIAO DIỆN ===================
  return (
    <div className="h-full overflow-auto bg-gray-50 p-6 text-sm">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* HEADER & FILTER THÁNG */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quản Lý Hóa Đơn Tạm Tính</h1>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <label className="font-medium text-gray-700">Chọn Tháng:</label>
            <div className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 text-gray-500 pointer-events-none">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="21" y1="10" y2="10"></line>
              </svg>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                onClick={openPicker}
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded font-medium outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* NẾU CHƯA CÓ THÁNG */}
        {!isLoading && !monthData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center mt-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Chưa có sổ dữ liệu tháng {selectedMonth}</h2>
            <button onClick={handleCreateMonth} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded shadow">
              + Tạo sổ Tháng {selectedMonth}
            </button>
          </div>
        )}

        {/* NẾU ĐÃ CÓ THÁNG */}
        {monthData && (
          <>
            <div className="flex gap-4">
              {/* CỘT TRÁI: FORM NHẬP LIỆU */}
              <div className="w-[35%] bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-fit">
                <h2 className="font-semibold text-base mb-3 text-gray-800 border-b pb-2 flex justify-between items-center">
                  <span>{editId ? "Sửa Hóa Đơn" : "Nhập Hóa Đơn"}</span>
                  {editId && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Đang sửa</span>}
                </h2>
                
                <form onSubmit={handleSubmitInvoice} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Ngày *</label>
                      <div className="relative flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 text-gray-500 pointer-events-none">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                          <line x1="16" x2="16" y1="2" y2="6"></line>
                          <line x1="8" x2="8" y1="2" y2="6"></line>
                          <line x1="3" x2="21" y1="10" y2="10"></line>
                        </svg>
                        <input 
                          type="date" 
                          name="date" 
                          value={formData.date} 
                          onChange={handleChange} 
                          onClick={openPicker}
                          required 
                          className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                        />
                      </div>
                    </div>
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Trạng thái</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded text-sm bg-gray-50 font-medium">
                        <option value="UNPOSTED">Chưa Post</option>
                        <option value="POSTED">Đã Post</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Khách hàng</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="VD: Anh A..." className="w-full border p-1.5 rounded text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Bàn</label><input type="text" name="table" value={formData.table} onChange={handleChange} placeholder="VD: VIP 1" className="w-full border p-1.5 rounded text-sm"/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2 rounded border border-gray-100">
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Số tiền hàng</label><input type="number" name="goodsAmount" value={formData.goodsAmount} onChange={handleChange} className="w-full border p-1.5 rounded text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Số tiền KM</label><input type="number" name="discountAmount" value={formData.discountAmount} onChange={handleChange} className="w-full border p-1.5 rounded text-sm"/></div>
                    <div className="col-span-2"><label className="text-xs font-medium text-blue-700 block mb-1">TRƯỚC PPV (Tự động)</label><input type="number" name="beforeServiceCharge" value={formData.beforeServiceCharge} readOnly className="w-full border p-1.5 rounded text-sm bg-blue-50 text-blue-700 font-semibold outline-none cursor-not-allowed"/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-red-600 block mb-1">TỔNG TIỀN (Số tiền) *</label><input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} required className="w-full border border-red-300 p-1.5 rounded text-sm font-bold text-red-600 outline-none focus:border-red-500"/></div>
                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Số Hóa Đơn</label><input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} disabled={formData.status === "UNPOSTED"} placeholder={formData.status === "UNPOSTED" ? "Chỉ nhập khi Đã Post" : "Nhập mã HĐ..."} className={`w-full border p-1.5 rounded text-sm ${formData.status === 'UNPOSTED' ? 'bg-gray-100' : ''}`}/></div>
                  </div>

                  <div><label className="text-xs font-medium text-gray-600 block mb-1">Ghi chú</label><input type="text" name="note" value={formData.note} onChange={handleChange} className="w-full border p-1.5 rounded text-sm"/></div>

                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition-colors">
                      {editId ? "Lưu Chỉnh Sửa" : "+ Thêm Vào Bảng"}
                    </button>
                    {editId && (
                      <button type="button" onClick={() => { setEditId(null); setFormData(defaultForm); }} className="bg-gray-200 px-4 py-2 rounded text-gray-700">Hủy</button>
                    )}
                  </div>
                </form>
              </div>

              {/* CỘT PHẢI: BẢNG DỮ LIỆU & THỐNG KÊ (Rộng 65%) */}
              <div className="w-[65%] flex flex-col gap-4">
                
                {/* KHỐI THỐNG KÊ */}
                <div className="flex flex-col gap-3">
                  
                  {/* Dòng 1: THỐNG KÊ TỔNG TIỀN */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">1. Thống kê Tổng Tiền (Thực thu)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col justify-center items-center bg-gray-50 rounded py-2 border border-gray-100">
                        <span className="text-[11px] text-gray-500 font-medium">Chưa Post (Cộng dồn)</span>
                        <span className="text-base font-bold text-gray-800">{formatCurrency(totalUnposted)}</span>
                      </div>
                      <div className="flex flex-col justify-center items-center bg-green-50 rounded py-2 border border-green-100">
                        <span className="text-[11px] text-green-600 font-medium">Đã Post</span>
                        <span className="text-base font-bold text-green-700">{formatCurrency(totalPosted)}</span>
                      </div>
                      <div className="flex flex-col justify-center items-center bg-red-50 rounded py-2 border border-red-100">
                        <span className="text-[11px] text-red-600 font-medium">Độ Lệch (Chưa - Đã)</span>
                        <span className="text-base font-bold text-red-600">{formatCurrency(diffTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dòng 2: THỐNG KÊ TRƯỚC PPV */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">2. Thống kê Trước PPV</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col justify-center items-center bg-blue-50 rounded py-2 border border-blue-100">
                        <span className="text-[11px] text-blue-600 font-medium">Chưa Post (Cộng dồn)</span>
                        <span className="text-base font-bold text-blue-800">{formatCurrency(ppvUnposted)}</span>
                      </div>
                      <div className="flex flex-col justify-center items-center bg-teal-50 rounded py-2 border border-teal-100">
                        <span className="text-[11px] text-teal-600 font-medium">Đã Post</span>
                        <span className="text-base font-bold text-teal-700">{formatCurrency(ppvPosted)}</span>
                      </div>
                      <div className="flex flex-col justify-center items-center bg-orange-50 rounded py-2 border border-orange-100">
                        <span className="text-[11px] text-orange-600 font-medium">Độ Lệch (Chưa - Đã)</span>
                        <span className="text-base font-bold text-orange-600">{formatCurrency(diffPpv)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BẢNG DỮ LIỆU CÓ TABS */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                  {/* TABS */}
                  <div className="flex border-b">
                    <button 
                      className={`flex-1 py-2.5 font-medium text-sm text-center transition-colors ${activeTab === 'UNPOSTED' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('UNPOSTED')}
                    >
                      CHƯA POST ({invoices.filter(i => i.status === 'UNPOSTED').length})
                    </button>
                    <button 
                      className={`flex-1 py-2.5 font-medium text-sm text-center transition-colors ${activeTab === 'POSTED' ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('POSTED')}
                    >
                      ĐÃ POST ({invoices.filter(i => i.status === 'POSTED').length})
                    </button>
                  </div>

                  {/* BẢNG THEO FORMAT ẢNH CỦA BẠN */}
                  <div className="overflow-x-auto h-[350px] relative">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 shadow-sm">
                        <tr>
                          <th className="p-2 border-b border-r">Ngày</th>
                          <th className="p-2 border-b border-r">Số hóa đơn</th>
                          <th className="p-2 border-b border-r">Khách hàng</th>
                          <th className="p-2 border-b border-r text-right">Số tiền</th>
                          <th className="p-2 border-b border-r">Bàn</th>
                          <th className="p-2 border-b border-r">Ghi chú</th>
                          <th className="p-2 border-b border-r text-right">Số tiền hàng</th>
                          <th className="p-2 border-b border-r text-right">Số tiền KM</th>
                          <th className="p-2 border-b border-r text-right font-bold">TRƯỚC PPV</th>
                          <th className="p-2 border-b text-center">Sửa / Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.length === 0 ? (
                          <tr><td colSpan={10} className="p-8 text-center text-gray-400">Không có hóa đơn nào ở trạng thái này.</td></tr>
                        ) : (
                          filteredInvoices.map((inv: any) => (
                            <tr key={inv._id} className={`border-b hover:bg-gray-50 ${editId === inv._id ? 'bg-yellow-50' : ''}`}>
                              <td className="p-2 border-r">{new Date(inv.date).toLocaleDateString('vi-VN')}</td>
                              <td className="p-2 border-r font-medium text-blue-600">{inv.invoiceNumber || ""}</td>
                              <td className="p-2 border-r">{inv.customerName}</td>
                              <td className="p-2 border-r text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                              <td className="p-2 border-r">{inv.table}</td>
                              <td className="p-2 border-r truncate max-w-[120px]" title={inv.note}>{inv.note}</td>
                              <td className="p-2 border-r text-right">{formatCurrency(inv.goodsAmount)}</td>
                              <td className="p-2 border-r text-right">{formatCurrency(inv.discountAmount)}</td>
                              <td className="p-2 border-r text-right font-bold text-gray-800">{formatCurrency(inv.beforeServiceCharge)}</td>
                              <td className="p-2 text-center">
                                <button onClick={() => { 
                                  setEditId(inv._id); 
                                  setFormData({
                                    ...inv, 
                                    date: inv.date.split('T')[0],
                                    goodsAmount: inv.goodsAmount === 0 ? "" : inv.goodsAmount,
                                    discountAmount: inv.discountAmount === 0 ? "" : inv.discountAmount,
                                    beforeServiceCharge: inv.beforeServiceCharge === 0 ? "" : inv.beforeServiceCharge,
                                    totalAmount: inv.totalAmount === 0 ? "" : inv.totalAmount,
                                  }); 
                                }} className="text-blue-500 hover:text-blue-700 mx-1">✏️</button>
                                <button onClick={() => handleDeleteInvoice(inv._id)} className="text-red-500 hover:text-red-700 mx-1">❌</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}