// src/AttendanceReport/Sidebar.jsx
import React from "react";
import {
  PlusCircle, PlayCircle, CalendarDays, Users, CheckCircle2,
  CalendarClock, RefreshCcw, Trash2, Lock, Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtVN } from "./utils";

interface SidebarProps {
  reports: any[];
  selectedReport: any;
  setSelectedReport: (r: any) => void;
  newName: string; setNewName: (v: string) => void;
  newFrom: string; setNewFrom: (v: string) => void;
  newTo: string; setNewTo: (v: string) => void;
  // ✅ MỚI: tháng/năm lương
  newPayrollMonth: number; setNewPayrollMonth: (v: number) => void;
  newPayrollYear: number; setNewPayrollYear: (v: number) => void;
  reportScopeMode: "ALL" | "DEPT" | "EMPLOYEE";
  setReportScopeMode: (v: "ALL" | "DEPT" | "EMPLOYEE") => void;
  reportDept: string;
  setReportDept: (v: string) => void;
  selectedEmployeeIds: string[];
  setSelectedEmployeeIds: (v: string[]) => void;
  departments: string[];
  employees: any[];
  handleCreateReport: () => void;
  isCreating?: boolean;
  handleDeleteReport: (r: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  reports, selectedReport, setSelectedReport,
  newName, setNewName, newFrom, setNewFrom, newTo, setNewTo,
  newPayrollMonth, setNewPayrollMonth, newPayrollYear, setNewPayrollYear, // ✅ MỚI
  reportScopeMode, setReportScopeMode, reportDept, setReportDept,
  selectedEmployeeIds, setSelectedEmployeeIds, departments, employees,
  handleCreateReport, isCreating, handleDeleteReport,
}) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="w-full xl:w-80 shrink-0 space-y-4">
      {/* Card tạo báo cáo mới */}
      <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-700" />
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <PlusCircle className="w-4 h-4 text-purple-600" />
            </div>
            Tạo báo cáo mới
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tên báo cáo
            </label>
            <Input
              placeholder="VD: Báo cáo lần 1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-10 text-sm rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Từ ngày
              </label>
              <Input
                type="date"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Đến ngày
              </label>
              <Input
                type="date"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="h-10 text-sm rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Phạm vi báo cáo
            </label>
            <select
              value={reportScopeMode}
              onChange={(e) => setReportScopeMode(e.target.value as "ALL" | "DEPT" | "EMPLOYEE")}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả nhân sự</option>
              <option value="DEPT">Theo phòng ban</option>
              <option value="EMPLOYEE">Theo nhân sự</option>
            </select>
          </div>

          {reportScopeMode === "DEPT" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Chọn phòng ban
              </label>
              <select
                value={reportDept}
                onChange={(e) => setReportDept(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {reportScopeMode === "EMPLOYEE" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Chọn nhân sự
              </label>
              <select
                multiple
                value={selectedEmployeeIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, (option) => option.value);
                  setSelectedEmployeeIds(values);
                }}
                className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.employeeCode} - {emp.fullName || "Nhân sự"}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">Giữ Ctrl/Cmd để chọn nhiều nhân sự.</p>
            </div>
          )}

          {/* ✅ MỚI: Tháng/Năm lương */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                Tháng lương
              </label>
              <select
                value={newPayrollMonth}
                onChange={(e) => setNewPayrollMonth(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm text-indigo-700 font-semibold outline-none"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                Năm lương
              </label>
              <select
                value={newPayrollYear}
                onChange={(e) => setNewPayrollYear(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm text-indigo-700 font-semibold outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleCreateReport}
            disabled={isCreating || !newName || !newFrom || !newTo || (reportScopeMode === "DEPT" && !reportDept) || (reportScopeMode === "EMPLOYEE" && selectedEmployeeIds.length === 0)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isCreating
              ? <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
              : <><PlayCircle className="w-4 h-4 mr-2" /> Tạo báo cáo</>}
          </Button>
        </CardContent>
      </Card>

      {/* Danh sách báo cáo */}
      <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 flex flex-col h-[550px] overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-purple-50/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600" />
            Danh sách báo cáo
          </h3>
          <Badge variant="outline" className="text-xs">{reports.length} báo cáo</Badge>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
          {reports.map((r) => {
            const active = selectedReport?._id === r._id;
            return (
              <div
                key={r._id}
                onClick={() => setSelectedReport(r)}
                className={`cursor-pointer p-3.5 rounded-xl transition-all duration-200 group border
                  ${active
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200 scale-[1.02] border-transparent"
                    : "hover:bg-slate-100 text-slate-700 border-transparent hover:border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${active ? "text-white" : "text-slate-700"}`}>
                      {r.name}
                    </p>
                    <p className={`text-[11px] mt-1 flex items-center gap-1 ${active ? "text-purple-100" : "text-slate-500"}`}>
                      <CalendarDays className="w-3 h-3" />
                      {fmtVN(r.fromDate)} → {fmtVN(r.toDate)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        r.status === "closed"
                          ? (active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")
                          : (active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700")
                      }`}>
                        {r.status === "closed" ? <><Lock className="w-2.5 h-2.5" />Đã khóa</> : <><Unlock className="w-2.5 h-2.5" />Đang mở</>}
                      </span>
                      {/* ✅ MỚI: hiển thị tháng lương */}
                      {r.payrollMonth && r.payrollYear && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          active ? "bg-white/30 text-white" : "bg-indigo-100 text-indigo-700"
                        }`}>
                          💰 T{r.payrollMonth}/{r.payrollYear}
                        </span>
                      )}
                      {r.scope?.mode === "DEPT" && r.scope?.department && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                          {r.scope.department}
                        </span>
                      )}
                      {r.scope?.mode === "EMPLOYEE" && r.scope?.employeeIds?.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
                          <Users className="inline w-2.5 h-2.5 mr-0.5" />
                          {r.scope.employeeIds.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteReport(r); }}
                    className={`p-1 rounded transition-colors ${active ? "text-purple-200 hover:text-white" : "text-slate-300 hover:text-red-500"}`}
                    title="Xóa báo cáo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="text-center p-8 text-slate-400">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Chưa có báo cáo nào</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};