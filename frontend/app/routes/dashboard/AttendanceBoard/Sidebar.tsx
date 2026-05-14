import React from "react";
import { PlusCircle, PlayCircle, CalendarDays, Users, CheckCircle2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  monthsList: any[];
  selectedMonthDoc: any;
  setSelectedMonthDoc: (doc: any) => void;
  newMonth: number;
  setNewMonth: (m: number) => void;
  newYear: number;
  setNewYear: (y: number) => void;
  handleInitializeMonth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  monthsList,
  selectedMonthDoc,
  setSelectedMonthDoc,
  newMonth,
  setNewMonth,
  newYear,
  setNewYear,
  handleInitializeMonth,
}) => {
  return (
    <div className="w-full xl:w-80 shrink-0 space-y-4">
      {/* Card khởi tạo tháng mới */}
      <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <PlusCircle className="w-4 h-4 text-blue-600" />
            </div>
            Khởi tạo kỳ công mới
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Tháng
              </label>
              <select
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={newMonth}
                onChange={(e) => setNewMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Năm
              </label>
              <select
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleInitializeMonth}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <PlayCircle className="w-4 h-4 mr-2" /> Khởi tạo bảng công
          </Button>
        </CardContent>
      </Card>

      {/* Danh sách kỳ công */}
      <Card className="shadow-md border-slate-200/80 backdrop-blur-sm bg-white/90 flex flex-col h-[550px] overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Danh sách kỳ công
          </h3>
          <Badge variant="outline" className="text-xs">{monthsList.length} kỳ</Badge>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
          {monthsList.map((m) => (
            <button
              key={m._id}
              onClick={() => setSelectedMonthDoc(m)}
              className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between transition-all duration-200 group ${
                selectedMonthDoc?._id === m._id
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                  : "hover:bg-slate-100 text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                  selectedMonthDoc?._id === m._id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                }`}>
                  {m.month}
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {selectedMonthDoc?._id === m._id ? `Tháng ${m.month}/${m.year}` : (
                      <>Tháng {m.month}<span className="text-slate-400 font-normal">/{m.year}</span></>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 ${selectedMonthDoc?._id === m._id ? "text-blue-100" : "text-slate-400"}`}>
                    <Users className="inline w-3 h-3 mr-1" /> {m.totalEmployees || 0} nhân sự
                  </div>
                </div>
              </div>
              {m.status === "closed" ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle2 className={`w-5 h-5 ${selectedMonthDoc?._id === m._id ? "text-white" : "text-emerald-500"}`} />
                    </TooltipTrigger>
                    <TooltipContent>Đã chốt công</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className={`w-2.5 h-2.5 rounded-full ${selectedMonthDoc?._id === m._id ? "bg-white animate-pulse" : "bg-amber-400 shadow-sm shadow-amber-200"}`} />
              )}
            </button>
          ))}
          {monthsList.length === 0 && (
            <div className="text-center p-8 text-slate-400">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};