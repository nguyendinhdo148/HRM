// src/AttendanceReport/Tables.jsx
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { Users, Building2, Wallet, Hash, CheckCircle2, Save } from "lucide-react";
import { formatNumberWithDot } from "./utils";

const scrollOnTab = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key === "Tab") {
    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
};

const deriveAttendanceFromKpi = (kpi?: { minishow?: number; bigshow?: number }) => {
  const mini = kpi?.minishow || 0;
  const big = kpi?.bigshow || 0;
  if (mini > 0 || big > 0) return "X";
  return "OFF";
};

interface SharedProps {
  isDataLoading: boolean;
  filteredAttendances: any[];
  editingRecords: any;
  report: any;
  daysArray: any[];
  setSearchQuery: (q: string) => void;
  setSelectedDept: (d: string) => void;
  handleSaveRow: (id: string) => void;
}

// ============ 1. BẢNG CHÍNH (HÀNH CHÍNH & SHOW) ============
export const ReportBoardTable: React.FC<SharedProps & {
  handleAdvanceChange: any;
  handleKpiChange: any;
  handleTotalPaidDaysChange: any;
}> = ({
  isDataLoading, filteredAttendances, editingRecords, report, daysArray,
  setSearchQuery, setSelectedDept, handleSaveRow, handleAdvanceChange, handleKpiChange, handleTotalPaidDaysChange,
}) => {
  const sorted = React.useMemo(
    () => [...filteredAttendances].sort((a, b) =>
      String(a.employee?.employeeCode || "").localeCompare(
        String(b.employee?.employeeCode || ""), undefined, { numeric: true, sensitivity: "base" }
      )
    ),
    [filteredAttendances]
  );

  const isClosed = report?.status === "closed";

  return (
    <TabsContent value="board" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full">
          <Loader />
        </div>
      ) : sorted.length === 0 ? (
        <NoDataFound
          title="Không tìm thấy nhân sự"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
          buttonText="Xóa bộ lọc"
          buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }}
        />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div
            className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
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
                  {daysArray.map((d) => (
                    <th key={d.key} className={`p-2 text-center min-w-[90px] border-r border-slate-700 font-bold ${
                      d.isSunday ? "bg-red-900/80 text-red-100" : d.isWeekend ? "bg-slate-800 text-slate-200" : ""
                    }`}>
                      {d.label}
                    </th>
                  ))}
                  <th colSpan={5} className="p-2.5 bg-slate-800 text-center border-b border-slate-600 font-bold text-xs uppercase tracking-wider text-slate-200">
                    Tổng hợp
                  </th>
                  <th rowSpan={2} className="p-2.5 bg-blue-900 sticky right-0 z-40 min-w-[90px] font-semibold text-center">
                    Thao tác
                  </th>
                </tr>
                <tr className="bg-slate-800 text-xs">
                  {daysArray.map((d) => (
                    <th key={`sub-${d.key}`} className={`p-1.5 text-center border-r border-slate-700 font-medium ${
                      d.isSunday ? "text-red-300 bg-red-900/40"
                        : d.isWeekend ? "text-slate-300 bg-slate-800"
                        : "text-slate-400"
                    }`}>
                      {d.dow}
                    </th>
                  ))}
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-blue-300 bg-slate-800">CÔNG</th>
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-amber-300 bg-slate-800">NỬA</th>
                  <th className="p-2 border-r border-slate-600 text-center font-black text-white bg-amber-600/90">TỔNG</th>
                  <th className="p-2 border-r border-slate-600 text-center font-bold text-cyan-300 bg-slate-800">MINI</th>
                  <th className="p-2 text-center font-bold text-purple-300 bg-slate-800">BIG</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sorted.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];

                  let calcFull = 0, calcHalf = 0, calcMini = 0, calcBig = 0;
                  daysArray.forEach((d) => {
                    const raw = rowData.records?.[d.key];
                    const val = raw === undefined || raw === null ? "" :
                      (raw === "x" || raw === "Chạm" ? "X" : raw);
                    if (val === "X") calcFull++;
                    else if (val === "0.5") calcHalf++;
                    calcMini += Number(rowData.kpiRecords?.[d.key]?.minishow) || 0;
                    calcBig += Number(rowData.kpiRecords?.[d.key]?.bigshow) || 0;
                  });

                  // ✅ FIX: Ưu tiên summary.totalPaidDays nếu nó khác computed (user đã đè tay)
                  const computed = calcFull + calcHalf * 0.5;
                  const fromSummary = Number(rowData.summary?.totalPaidDays ?? 0);
                  const calcPaid = fromSummary > 0 && Math.abs(fromSummary - computed) > 0.01
                    ? fromSummary
                    : computed;

                  return (
                    <tr key={att._id} className={`group transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-slate-50 hover:bg-blue-50"
                    }`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-blue-50" : "bg-slate-50 group-hover:bg-blue-50"
                      }`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          <Hash className="inline w-3 h-3 mr-0.5" />
                          {att.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">
                          {att.employee?.workInfo?.department || "N/A"}
                        </Badge>
                      </td>
                      <td className="p-2 border-r border-slate-200/60">
                        <div className={`relative rounded-lg overflow-hidden ${
                          isClosed ? "bg-slate-100"
                            : "bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm"
                        }`}>
                          <input
                            type="text"
                            disabled={isClosed}
                            className="w-full text-right font-semibold text-emerald-700 bg-transparent outline-none p-2.5 text-sm placeholder-slate-300"
                            value={formatNumberWithDot(rowData.advancePayment)}
                            onChange={(e) => handleAdvanceChange(att._id, e.target.value)}
                          />
                        </div>
                      </td>

                      {daysArray.map((d) => {
                        const kpi = rowData.kpiRecords?.[d.key];
                        const derivedStatus = deriveAttendanceFromKpi(kpi);
                        const statusLabel = derivedStatus === "X" ? "X" : "OFF";
                        const statusTextStyle = derivedStatus === "X" ? "text-blue-700" : "text-red-500";

                        return (
                          <td key={d.key} className={`p-1.5 border-r border-slate-200/60 align-top transition-colors ${d.isSunday ? "bg-red-50/20" : ""}`}>
                            <div className="flex flex-col gap-1 w-full h-full">
                              <div className={`w-full h-5 flex items-center justify-center text-[10px] font-bold uppercase ${statusTextStyle}`}>
                                {statusLabel}
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <input
                                  type="text" maxLength={2} title="Mini Show"
                                  className="w-full h-7 text-xs font-semibold text-center border rounded-md outline-none transition-all border-slate-200 hover:border-cyan-400 focus:bg-cyan-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-700 bg-white"
                                  placeholder="M"
                                  value={rowData.kpiRecords?.[d.key]?.minishow || ""}
                                  onChange={(e) => handleKpiChange(att._id, d.key, "minishow", e.target.value)}
                                  onKeyUp={scrollOnTab}
                                  disabled={isClosed}
                                />
                                <input
                                  type="text" maxLength={2} title="Big Show"
                                  className="w-full h-7 text-xs font-semibold text-center border rounded-md outline-none transition-all border-slate-200 hover:border-purple-400 focus:bg-purple-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-700 bg-white"
                                  placeholder="B"
                                  value={rowData.kpiRecords?.[d.key]?.bigshow || ""}
                                  onChange={(e) => handleKpiChange(att._id, d.key, "bigshow", e.target.value)}
                                  onKeyUp={scrollOnTab}
                                  disabled={isClosed}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-2 border-r border-slate-200/60 text-center bg-blue-50/50">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={isClosed}
                          value={calcPaid}
                          onChange={(e) => handleTotalPaidDaysChange(att._id, e.target.value)}
                          className="w-16 h-9 text-center font-bold text-blue-700 bg-transparent outline-none border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-amber-600 bg-amber-50/50 text-sm">{calcHalf}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-black text-amber-700 bg-amber-100/50 text-sm">{calcPaid}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-cyan-700 bg-cyan-50/50 text-sm">{calcMini}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-purple-700 bg-purple-50/50 text-sm">{calcBig}</td>

                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-blue-50" : "bg-slate-50 group-hover:bg-blue-50"
                      }`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)}
                            className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
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

// ============ 2. BẢNG LÀM THÊM GIỜ (OT) ============
export const ReportOvertimeTable: React.FC<SharedProps & { toggleOvertime: any }> = ({
  isDataLoading, filteredAttendances, editingRecords, report, daysArray,
  setSearchQuery, setSelectedDept, handleSaveRow, toggleOvertime,
}) => {
  const sorted = React.useMemo(
    () => [...filteredAttendances].sort((a, b) =>
      String(a.employee?.employeeCode || "").localeCompare(
        String(b.employee?.employeeCode || ""), undefined, { numeric: true, sensitivity: "base" }
      )
    ),
    [filteredAttendances]
  );
  const isClosed = report?.status === "closed";

  return (
    <TabsContent value="overtime" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full"><Loader /></div>
      ) : sorted.length === 0 ? (
        <NoDataFound title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
          buttonText="Xóa bộ lọc" buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }} />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all"
            style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm border-collapse min-w-[1600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-teal-900 text-white">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-teal-900 z-40 min-w-[220px] border-r border-teal-700 text-left font-semibold">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-300" /> Nhân sự</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-teal-700 min-w-[140px] text-left font-semibold">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-300" /> Phòng ban</div>
                  </th>
                  {daysArray.map((d) => (
                    <th key={d.key} className={`p-2 text-center min-w-[45px] border-r border-teal-700 font-bold text-xs ${
                      d.isSunday ? "bg-red-800/80 text-red-100" : d.isWeekend ? "bg-teal-800 text-teal-100" : ""
                    }`}>{d.label}</th>
                  ))}
                  <th colSpan={4} className="p-2.5 bg-teal-800 text-center border-b border-teal-600 font-bold text-xs uppercase tracking-wider text-teal-100">
                    Tổng Giờ OT
                  </th>
                  <th rowSpan={2} className="p-2.5 bg-teal-800 sticky right-0 z-40 min-w-[90px] font-semibold text-center">Thao tác</th>
                </tr>
                <tr className="bg-teal-800 text-xs">
                  {daysArray.map((d) => (
                    <th key={`sub-ot-${d.key}`} className={`p-1.5 text-center font-medium border-r border-teal-700 ${
                      d.isSunday ? "text-red-300 bg-red-900/40"
                        : d.isWeekend ? "text-teal-200 bg-teal-700/50"
                        : "text-teal-300"
                    }`}>{d.dow}</th>
                  ))}
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-blue-300 bg-teal-900/50">Thường</th>
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-amber-300 bg-teal-900/50">Nghỉ</th>
                  <th className="p-2 border-r border-teal-600 text-center font-bold text-purple-300 bg-teal-900/50">Lễ</th>
                  <th className="p-2 text-center font-black text-white bg-emerald-600/90">TỔNG</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sorted.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];
                  let calcOTN = 0, calcOTW = 0, calcOTH = 0;
                  daysArray.forEach((d) => {
                    const val = rowData.overtimeRecords?.[d.key];
                    if (val === "X") calcOTN++;
                    else if (val === "N") calcOTW++;
                    else if (val === "T") calcOTH++;
                  });
                  const calcTotalOT = calcOTN + calcOTW + calcOTH;

                  return (
                    <tr key={`ot-${att._id}`} className={`group transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white hover:bg-teal-50" : "bg-slate-50 hover:bg-teal-50"
                    }`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-teal-50" : "bg-slate-50 group-hover:bg-teal-50"
                      }`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          <Hash className="inline w-3 h-3 mr-0.5" />{att.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">
                          {att.employee?.workInfo?.department || "N/A"}
                        </Badge>
                      </td>
                      {daysArray.map((d) => {
                        const val = rowData.overtimeRecords?.[d.key] || "";
                        let cellStyle = "text-slate-400 font-normal", bgStyle = "hover:bg-slate-100 bg-white";
                        if (val === "X") { cellStyle = "text-blue-700 font-bold"; bgStyle = "bg-blue-100 border-blue-300 hover:bg-blue-200"; }
                        else if (val === "N") { cellStyle = "text-amber-600 font-bold"; bgStyle = "bg-amber-100 border-amber-300 hover:bg-amber-200"; }
                        else if (val === "T") { cellStyle = "text-purple-700 font-bold"; bgStyle = "bg-purple-100 border-purple-300 hover:bg-purple-200"; }
                        return (
                          <td key={d.key} className={`p-1 border-r border-slate-200/60 text-center transition-colors ${d.isSunday ? "bg-red-50/20" : ""}`}>
                            <button
                              disabled={isClosed}
                              onClick={() => toggleOvertime(att._id, d.key, val)}
                              onKeyUp={scrollOnTab}
                              title="Đổi loại OT: X → N → T → Trống"
                              className={`w-full h-10 flex items-center justify-center text-sm transition-all duration-200 rounded-md border border-transparent ${cellStyle} ${bgStyle} ${
                                isClosed ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-95"
                              }`}
                            >{val}</button>
                          </td>
                        );
                      })}
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-blue-700 text-sm bg-blue-50/30">{calcOTN}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-amber-600 text-sm bg-amber-50/30">{calcOTW}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-bold text-purple-700 text-sm bg-purple-50/30">{calcOTH}</td>
                      <td className="p-3 border-r border-slate-200/60 text-center font-black text-emerald-800 bg-emerald-100/50 text-sm">{calcTotalOT}</td>
                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-teal-50" : "bg-slate-50 group-hover:bg-teal-50"
                      }`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)}
                            className="w-full h-10 text-sm bg-teal-600 hover:bg-teal-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
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

// ============ 3. BẢNG ĐI MUỘN / VỀ SỚM ============
export const ReportShortfallTable: React.FC<SharedProps & { handleShortfallDailyChange: any }> = ({
  isDataLoading, filteredAttendances, editingRecords, report, daysArray,
  setSearchQuery, setSelectedDept, handleSaveRow, handleShortfallDailyChange,
}) => {
  const sorted = React.useMemo(
    () => [...filteredAttendances].sort((a, b) =>
      String(a.employee?.employeeCode || "").localeCompare(
        String(b.employee?.employeeCode || ""), undefined, { numeric: true, sensitivity: "base" }
      )
    ),
    [filteredAttendances]
  );
  const isClosed = report?.status === "closed";

  return (
    <TabsContent value="shortfall" className="mt-4 animate-in fade-in-50 w-full">
      {isDataLoading ? (
        <div className="bg-white rounded-2xl border shadow-sm h-96 flex items-center justify-center w-full"><Loader /></div>
      ) : sorted.length === 0 ? (
        <NoDataFound title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
          buttonText="Xóa bộ lọc" buttonAction={() => { setSearchQuery(""); setSelectedDept("ALL"); }} />
      ) : (
        <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl w-full">
          <div className="overflow-auto relative w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-all"
            style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm border-collapse min-w-[1600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-rose-950 text-white">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-rose-950 z-40 min-w-[220px] border-r border-rose-800 text-left font-semibold">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-rose-300" /> Nhân sự</div>
                  </th>
                  <th rowSpan={2} className="p-3.5 border-r border-rose-800 min-w-[140px] text-left font-semibold">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-rose-300" /> Phòng ban</div>
                  </th>
                  {daysArray.map((d) => (
                    <th key={d.key} className={`p-2 text-center min-w-[50px] border-r border-rose-800 font-bold text-xs ${
                      d.isSunday ? "bg-red-800/80 text-red-100" : d.isWeekend ? "bg-rose-900 text-rose-100" : ""
                    }`}>{d.label}</th>
                  ))}
                  <th rowSpan={2} className="p-3 bg-rose-900 border-l border-rose-700 text-center font-bold text-sm min-w-[120px]">
                    Tổng Phút Phạt
                  </th>
                  <th rowSpan={2} className="p-2 bg-rose-900 sticky right-0 z-40 min-w-[90px] font-semibold text-center">Thao tác</th>
                </tr>
                <tr className="bg-rose-900 text-xs">
                  {daysArray.map((d) => (
                    <th key={`sub-sf-${d.key}`} className={`p-1.5 text-center font-medium border-r border-rose-800 ${
                      d.isSunday ? "text-red-300 bg-red-900/40"
                        : d.isWeekend ? "text-rose-200 bg-rose-800/50"
                        : "text-rose-300"
                    }`}>{d.dow}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sorted.map((att, idx) => {
                  const rowData = editingRecords[att._id] || att;
                  const isEditing = !!editingRecords[att._id];
                  let calcShortfall = 0;
                  daysArray.forEach((d) => {
                    calcShortfall += Number(rowData.shortfallRecords?.[d.key]) || 0;
                  });
                  return (
                    <tr key={`sf-${att._id}`} className={`group transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white hover:bg-rose-50" : "bg-slate-50 hover:bg-rose-50"
                    }`}>
                      <td className={`p-3 border-r border-slate-200/60 sticky left-0 z-20 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-rose-50" : "bg-slate-50 group-hover:bg-rose-50"
                      }`}>
                        <div className="font-semibold text-slate-800 text-sm">{att.employee?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          <Hash className="inline w-3 h-3 mr-0.5" />{att.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-200/60 text-center">
                        <Badge variant="outline" className="font-medium text-xs bg-white text-slate-600 border-slate-300">
                          {att.employee?.workInfo?.department || "N/A"}
                        </Badge>
                      </td>
                      {daysArray.map((d) => (
                        <td key={d.key} className={`p-1 border-r border-slate-200/60 text-center ${d.isSunday ? "bg-red-50/20" : ""}`}>
                          <input
                            type="text"
                            disabled={isClosed}
                            className="w-full h-10 text-center text-sm font-bold text-rose-600 bg-transparent outline-none rounded-md placeholder-slate-300 focus:bg-rose-50 focus:ring-2 focus:ring-rose-200 transition-all"
                            value={rowData.shortfallRecords?.[d.key] || ""}
                            onChange={(e) => handleShortfallDailyChange(att._id, d.key, e.target.value)}
                            onKeyUp={scrollOnTab}
                          />
                        </td>
                      ))}
                      <td className="p-3 border-l border-r border-slate-200/60 text-center font-black text-rose-700 bg-rose-50/80 text-sm">
                        {calcShortfall}
                      </td>
                      <td className={`p-2 sticky right-0 z-20 shadow-[-1px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                        idx % 2 === 0 ? "bg-white group-hover:bg-rose-50" : "bg-slate-50 group-hover:bg-rose-50"
                      }`}>
                        {isEditing && !isClosed ? (
                          <Button size="sm" onClick={() => handleSaveRow(att._id)}
                            className="w-full h-10 text-sm bg-rose-600 hover:bg-rose-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
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