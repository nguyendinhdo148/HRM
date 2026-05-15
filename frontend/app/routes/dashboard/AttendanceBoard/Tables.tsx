import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { Users, Building2, Wallet, Hash, CheckCircle2, Save } from "lucide-react";
import { getDayOfWeek, formatNumberWithDot } from "./utils";

interface SharedProps {
  isDataLoading: boolean;
  filteredAttendances: any[];
  editingRecords: any;
  selectedMonthDoc: any;
  daysArray: number[];
  setSearchQuery: (q: string) => void;
  setSelectedDept: (d: string) => void;
  handleSaveRow: (id: string) => void;
}

// Hàm UX: CHỈ tự động cuộn ra giữa khi nhấn phím TAB
const scrollOnTab = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key === "Tab") {
    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
};

// ======================== 1. BẢNG HÀNH CHÍNH & SHOW ========================
export const BoardTable: React.FC<SharedProps & { 
  toggleAttendance: any, 
  handleAdvanceChange: any,
  handleKpiChange: any
}> = ({ isDataLoading, filteredAttendances, editingRecords, selectedMonthDoc, daysArray, setSearchQuery, setSelectedDept, handleSaveRow, toggleAttendance, handleAdvanceChange, handleKpiChange }) => {
  
  const sortedAttendances = React.useMemo(() => {
    return [...filteredAttendances].sort((a, b) => {
      const codeA = String(a.employee?.employeeCode || "");
      const codeB = String(b.employee?.employeeCode || "");
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredAttendances]);

  return (
    <TabsContent value="board" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full">
          <Loader />
        </div>
      ) : sortedAttendances.length === 0 ? (
        <NoDataFound title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" buttonText="Xóa bộ lọc" buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }} />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm border-collapse min-w-[2000px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-slate-900 text-white">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-slate-900 z-40 min-w-[220px] border-r border-slate-700 text-left font-semibold">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Nhân sự</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-slate-700 min-w-[140px] text-left font-semibold">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" /> Phòng ban</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-slate-700 min-w-[130px] text-right font-semibold text-emerald-300">
                    <div className="flex items-center justify-end gap-2"><Wallet className="w-4 h-4" /> Tạm ứng</div>
                  </th>
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={d} className={`p-2 text-center min-w-[90px] border-r border-slate-700 font-bold ${dayInfo.isSunday ? "bg-red-900/80 text-red-100" : dayInfo.isWeekend ? "bg-slate-800 text-slate-200" : ""}`}>
                        {d}
                      </th>
                    );
                  })}
                  <th colSpan={5} className="p-2.5 bg-slate-800 text-center border-b border-slate-600 font-bold text-xs uppercase tracking-wider text-slate-200">Tổng hợp</th>
                  <th rowSpan={2} className="p-2.5 bg-blue-900 sticky right-0 z-40 min-w-[90px] font-semibold text-center">Thao tác</th>
                </tr>
                <tr className="bg-slate-800 text-xs">
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={`sub-${d}`} className={`p-1.5 text-center border-r border-slate-700 font-medium ${dayInfo.isSunday ? "text-red-300 bg-red-900/40" : dayInfo.isWeekend ? "text-slate-300 bg-slate-800" : "text-slate-400"}`}>
                        {dayInfo.name}
                      </th>
                    );
                  })}
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-blue-300 bg-slate-800">CÔNG</th>
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-amber-300 bg-slate-800">NỬA</th>
                  <th className="p-2 border-r border-slate-600 text-center font-black text-white bg-amber-600/90">TỔNG</th>
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-cyan-300 bg-slate-800">MINI</th>
                  <th className="p-2 text-center font-bold text-purple-300 bg-slate-800">BIG</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sortedAttendances.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];
                  const isClosed = selectedMonthDoc.status === "closed";

                  let calcFull = 0, calcHalf = 0, calcMini = 0, calcBig = 0;
                  daysArray.forEach(d => {
                    const rawVal = rowData.records?.[d];
                    const val = (!rawVal || rawVal === "Chạm" || rawVal === "x") ? "X" : rawVal;
                    
                    if (val === "X") calcFull++;
                    else if (val === "0.5") calcHalf++;
                    
                    calcMini += Number(rowData.kpiRecords?.[d]?.minishow) || 0;
                    calcBig += Number(rowData.kpiRecords?.[d]?.bigshow) || 0;
                  });
                  const calcPaid = calcFull + (calcHalf * 0.5);

                  return (
                    <tr key={att._id} className={`group transition-colors duration-150 ${idx % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-slate-50 hover:bg-blue-50"}`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-blue-50" : "bg-slate-50 group-hover:bg-blue-50"}`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1"><Hash className="inline w-3 h-3 mr-0.5" />{att.employee?.employeeCode}</div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">{att.employee?.workInfo?.department || "N/A"}</Badge>
                      </td>
                      <td className="p-2 border-r border-slate-200/60">
                        <div className={`relative rounded-lg overflow-hidden ${isClosed ? "bg-slate-100" : "bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm"}`}>
                          <input
                            type="text"
                            disabled={isClosed}
                            className="w-full text-right font-semibold text-emerald-700 bg-transparent outline-none p-2.5 text-sm placeholder-slate-300"
                            value={formatNumberWithDot(rowData.advancePayment)}
                            onChange={(e) => handleAdvanceChange(att._id, e.target.value)}
                            placeholder=""
                          />
                        </div>
                      </td>
                      {daysArray.map((d) => {
                        const rawVal = rowData.records?.[d];
                        const val = (!rawVal || rawVal === "Chạm" || rawVal === "x") ? "X" : rawVal;
                        const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                        
                        let cellStyle = "text-slate-400 font-normal", bgStyle = "bg-white hover:bg-slate-100 border-slate-200";
                        if (val === "X") { cellStyle = "text-blue-700 font-bold"; bgStyle = "bg-blue-100 hover:bg-blue-200 border-blue-300"; }
                        else if (val === "0.5") { cellStyle = "text-amber-600 font-bold"; bgStyle = "bg-amber-100 hover:bg-amber-200 border-amber-300"; }
                        else if (val === "OFF") { cellStyle = "text-red-600 font-bold"; bgStyle = "bg-red-100 hover:bg-red-200 border-red-300"; }
                        
                        if (dayInfo.isSunday) bgStyle += " bg-red-50/40";

                        return (
                          <td key={d} className={`p-1.5 border-r border-slate-200/60 align-top transition-colors ${dayInfo.isSunday ? "bg-red-50/20" : ""}`}>
                            <div className="flex flex-col gap-1.5 w-full h-full">
                              <button 
                                disabled={isClosed} 
                                onClick={() => toggleAttendance(att._id, d.toString(), val)} 
                                onKeyUp={scrollOnTab} // Sửa thành onKeyUp
                                title="Đổi trạng thái: X → 0.5 → OFF" 
                                className={`w-full h-9 flex items-center justify-center text-sm transition-all duration-200 rounded-md border ${cellStyle} ${bgStyle} ${isClosed ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-sm active:scale-95"}`}
                              >
                                {val}
                              </button>
                              
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="text"
                                  maxLength={2}
                                  title="Mini Show"
                                  className="w-full h-8 text-xs font-semibold text-center border rounded-md outline-none transition-all duration-200 border-slate-200 hover:border-cyan-400 focus:bg-cyan-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-700 bg-white"
                                  placeholder=""
                                  value={rowData.kpiRecords?.[d]?.minishow || ""}
                                  onChange={(e) => handleKpiChange(att._id, d.toString(), 'minishow', e.target.value)}
                                  onKeyUp={scrollOnTab} // Sửa thành onKeyUp
                                  disabled={isClosed}
                                />
                                <input
                                  type="text"
                                  maxLength={2}
                                  title="Big Show"
                                  className="w-full h-8 text-xs font-semibold text-center border rounded-md outline-none transition-all duration-200 border-slate-200 hover:border-purple-400 focus:bg-purple-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-700 bg-white"
                                  placeholder=""
                                  value={rowData.kpiRecords?.[d]?.bigshow || ""}
                                  onChange={(e) => handleKpiChange(att._id, d.toString(), 'bigshow', e.target.value)}
                                  onKeyUp={scrollOnTab} // Sửa thành onKeyUp
                                  disabled={isClosed}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-blue-700 bg-blue-50/50 text-sm">{calcFull}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-amber-600 bg-amber-50/50 text-sm">{calcHalf}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-black text-amber-700 bg-amber-100/50 text-sm">{calcPaid}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-cyan-700 bg-cyan-50/50 text-sm">{calcMini}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-purple-700 bg-purple-50/50 text-sm">{calcBig}</td>
                      
                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-blue-50" : "bg-slate-50 group-hover:bg-blue-50"}`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)} className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
                            <Save className="w-4 h-4 mr-1.5" /> Lưu
                          </Button>
                        ) : (
                          <div className="text-center text-xs text-slate-400 font-medium flex flex-col items-center gap-1 justify-center h-full">
                            {isClosed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : "Đã đồng bộ"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </TabsContent>
  );
};

// ======================== 2. BẢNG LÀM THÊM GIỜ (OT) ========================
export const OvertimeTable: React.FC<SharedProps & { toggleOvertime: any }> = ({ isDataLoading, filteredAttendances, editingRecords, selectedMonthDoc, daysArray, setSearchQuery, setSelectedDept, handleSaveRow, toggleOvertime }) => {
  
  const sortedAttendances = React.useMemo(() => {
    return [...filteredAttendances].sort((a, b) => {
      const codeA = String(a.employee?.employeeCode || "");
      const codeB = String(b.employee?.employeeCode || "");
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredAttendances]);

  return (
    <TabsContent value="overtime" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full">
          <Loader />
        </div>
      ) : sortedAttendances.length === 0 ? (
        <NoDataFound title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" buttonText="Xóa bộ lọc" buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }} />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm border-collapse min-w-[1600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-teal-900 text-white">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-teal-900 z-40 min-w-[220px] border-r border-teal-700 text-left font-semibold">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-300" /> Nhân sự</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-teal-700 min-w-[140px] text-left font-semibold">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-300" /> Phòng ban</div>
                  </th>
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={d} className={`p-2 text-center min-w-[45px] border-r border-teal-700 font-bold text-xs ${dayInfo.isSunday ? "bg-red-800/80 text-red-100" : dayInfo.isWeekend ? "bg-teal-800 text-teal-100" : ""}`}>
                        {d}
                      </th>
                    );
                  })}
                  <th colSpan={4} className="p-2.5 bg-teal-800 text-center border-b border-teal-600 font-bold text-xs uppercase tracking-wider text-teal-100">Tổng Giờ OT</th>
                  <th rowSpan={2} className="p-2.5 bg-teal-800 sticky right-0 z-40 min-w-[90px] font-semibold text-center">Thao tác</th>
                </tr>
                <tr className="bg-teal-800 text-xs">
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={`sub-ot-${d}`} className={`p-1.5 text-center font-medium border-r border-teal-700 ${dayInfo.isSunday ? "text-red-300 bg-red-900/40" : dayInfo.isWeekend ? "text-teal-200 bg-teal-700/50" : "text-teal-300"}`}>
                        {dayInfo.name}
                      </th>
                    );
                  })}
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-blue-300 bg-teal-900/50">Thường</th>
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-amber-300 bg-teal-900/50">Nghỉ</th>
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-purple-300 bg-teal-900/50">Lễ</th>
                  <th className="p-2 text-center font-black text-white bg-emerald-600/90">TỔNG</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sortedAttendances.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];
                  const isClosed = selectedMonthDoc.status === "closed";

                  let calcOTN = 0, calcOTW = 0, calcOTH = 0;
                  daysArray.forEach(d => {
                    const val = rowData.overtimeRecords?.[d];
                    if (val === "X") calcOTN++;
                    else if (val === "N") calcOTW++;
                    else if (val === "T") calcOTH++;
                  });
                  const calcTotalOT = calcOTN + calcOTW + calcOTH;

                  return (
                    <tr key={`ot-${att._id}`} className={`group transition-colors duration-150 ${idx % 2 === 0 ? "bg-white hover:bg-teal-50" : "bg-slate-50 hover:bg-teal-50"}`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-teal-50" : "bg-slate-50 group-hover:bg-teal-50"}`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1"><Hash className="inline w-3 h-3 mr-0.5" />{att.employee?.employeeCode}</div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">{att.employee?.workInfo?.department || "N/A"}</Badge>
                      </td>
                      {daysArray.map((d) => {
                        const val = rowData.overtimeRecords?.[d] || "";
                        const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                        
                        let cellStyle = "text-slate-400 font-normal", bgStyle = "hover:bg-slate-100 bg-white";
                        if (val === "X") { cellStyle = "text-blue-700 font-bold"; bgStyle = "bg-blue-100 border-blue-300 hover:bg-blue-200"; }
                        else if (val === "N") { cellStyle = "text-amber-600 font-bold"; bgStyle = "bg-amber-100 border-amber-300 hover:bg-amber-200"; }
                        else if (val === "T") { cellStyle = "text-purple-700 font-bold"; bgStyle = "bg-purple-100 border-purple-300 hover:bg-purple-200"; }
                        
                        if (dayInfo.isSunday && !val) bgStyle += " bg-red-50/40";

                        return (
                          <td key={d} className={`p-1 border-r border-slate-200/60 text-center transition-colors ${dayInfo.isSunday ? "bg-red-50/20" : ""}`}>
                            <button 
                              disabled={isClosed} 
                              onClick={() => toggleOvertime(att._id, d.toString(), val)} 
                              onKeyUp={scrollOnTab} // Sửa thành onKeyUp
                              title="Đổi loại OT: X (Thường) → N (Nghỉ) → T (Lễ) → Trống" 
                              className={`w-full h-10 flex items-center justify-center text-sm transition-all duration-200 rounded-md border border-transparent ${cellStyle} ${bgStyle} ${isClosed ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-95"}`}
                            >
                              {val}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-blue-700 text-sm bg-blue-50/30">{calcOTN}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-amber-600 text-sm bg-amber-50/30">{calcOTW}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-purple-700 text-sm bg-purple-50/30">{calcOTH}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-black text-emerald-800 bg-emerald-100/50 text-sm">{calcTotalOT}</td>
                      
                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-teal-50" : "bg-slate-50 group-hover:bg-teal-50"}`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)} className="w-full h-10 text-sm bg-teal-600 hover:bg-teal-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
                            <Save className="w-4 h-4 mr-1.5" /> Lưu
                          </Button>
                        ) : (
                          <div className="text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center h-full">
                            {isClosed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : "Đã đồng bộ"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </TabsContent>
  );
};

// ======================== 3. BẢNG ĐI MUỘN VỀ SỚM ========================
export const ShortfallTable: React.FC<SharedProps & { handleShortfallDailyChange: any }> = ({ isDataLoading, filteredAttendances, editingRecords, selectedMonthDoc, daysArray, setSearchQuery, setSelectedDept, handleSaveRow, handleShortfallDailyChange }) => {
  
  const sortedAttendances = React.useMemo(() => {
    return [...filteredAttendances].sort((a, b) => {
      const codeA = String(a.employee?.employeeCode || "");
      const codeB = String(b.employee?.employeeCode || "");
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredAttendances]);

  return (
    <TabsContent value="shortfall" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full">
          <Loader />
        </div>
      ) : sortedAttendances.length === 0 ? (
        <NoDataFound title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" buttonText="Xóa bộ lọc" buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }} />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm border-collapse min-w-[1600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-rose-950 text-white">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-rose-950 z-40 min-w-[220px] border-r border-rose-800 text-left font-semibold">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-rose-300" /> Nhân sự</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-rose-800 min-w-[140px] text-left font-semibold">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-rose-300" /> Phòng ban</div>
                  </th>
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={d} className={`p-2 text-center min-w-[50px] border-r border-rose-800 font-bold text-xs ${dayInfo.isSunday ? "bg-red-800/80 text-red-100" : dayInfo.isWeekend ? "bg-rose-900 text-rose-100" : ""}`}>
                        {d}
                      </th>
                    );
                  })}
                  <th rowSpan={2} className="p-3 bg-rose-900 border-l border-rose-700 text-center font-bold text-sm min-w-[120px]">Tổng Phút Phạt</th>
                  <th rowSpan={2} className="p-2 bg-rose-900 sticky right-0 z-40 min-w-[90px] font-semibold text-center">Thao tác</th>
                </tr>
                <tr className="bg-rose-900 text-xs">
                  {daysArray.map((d) => {
                    const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                    return (
                      <th key={`sub-sf-${d}`} className={`p-1.5 text-center font-medium border-r border-rose-800 ${dayInfo.isSunday ? "text-red-300 bg-red-900/40" : dayInfo.isWeekend ? "text-rose-200 bg-rose-800/50" : "text-rose-300"}`}>
                        {dayInfo.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sortedAttendances.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];
                  const isClosed = selectedMonthDoc.status === "closed";

                  let calcShortfall = 0;
                  daysArray.forEach(d => {
                    calcShortfall += Number(rowData.shortfallRecords?.[d]) || 0;
                  });

                  return (
                    <tr key={`sf-${att._id}`} className={`group transition-colors duration-150 ${idx % 2 === 0 ? "bg-white hover:bg-rose-50" : "bg-slate-50 hover:bg-rose-50"}`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-rose-50" : "bg-slate-50 group-hover:bg-rose-50"}`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1"><Hash className="inline w-3 h-3 mr-0.5" />{att.employee?.employeeCode}</div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">{att.employee?.workInfo?.department || "N/A"}</Badge>
                      </td>
                      {daysArray.map((d) => {
                        const dayInfo = getDayOfWeek(selectedMonthDoc.year, selectedMonthDoc.month, d);
                        return (
                          <td key={d} className={`p-1 border-r border-slate-200/60 text-center ${dayInfo.isSunday ? "bg-red-50/20" : ""}`}>
                            <input
                              type="text"
                              disabled={isClosed}
                              className="w-full h-10 text-center text-sm font-bold text-rose-600 bg-transparent outline-none rounded-md placeholder-slate-300 focus:bg-rose-50 focus:ring-2 focus:ring-rose-200 transition-all"
                              value={rowData.shortfallRecords?.[d] || ""}
                              onChange={(e) => handleShortfallDailyChange(att._id, d.toString(), e.target.value)}
                              onKeyUp={scrollOnTab} // Sửa thành onKeyUp
                              placeholder=""
                            />
                          </td>
                        );
                      })}
                      
                      <td className="p-3 border-l border-r border-slate-200/60 text-center font-black text-rose-700 bg-rose-50/80 text-sm">{calcShortfall}</td>
                      
                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${idx % 2 === 0 ? "bg-white group-hover:bg-rose-50" : "bg-slate-50 group-hover:bg-rose-50"}`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)} className="w-full h-10 text-sm bg-rose-600 hover:bg-rose-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
                            <Save className="w-4 h-4 mr-1.5" /> Lưu
                          </Button>
                        ) : (
                          <div className="text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center h-full">
                            {isClosed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : "Đã đồng bộ"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </TabsContent>
  );
};