import React from "react";
import { Users, Briefcase, Clock, TimerOff, BarChart3, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, Cell } from "recharts";
import { CHART_COLORS } from "./utils";

interface StatsViewProps {
  stats: any;
  departmentStats: any[];
  chartData: any[];
  selectedDept: string;
}

export const StatsView: React.FC<StatsViewProps> = ({ stats, departmentStats, chartData, selectedDept }) => {
  return (
    <div className="space-y-5 mt-4 animate-in slide-in-from-bottom-2">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhân sự</p>
              <div className="p-2 bg-blue-100 rounded-xl"><Users className="w-4 h-4 text-blue-600" /></div>
            </div>
            <div className="text-3xl font-black text-slate-800">{stats.count}</div>
            <p className="text-xs text-slate-400 mt-1">Nhân sự đã lọc</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng công</p>
              <div className="p-2 bg-amber-100 rounded-xl"><Briefcase className="w-4 h-4 text-amber-600" /></div>
            </div>
            <div className="text-3xl font-black text-amber-600">{stats.totalPaidDays}</div>
            <p className="text-xs text-slate-400 mt-1">TB: {stats.avgDays} công/người</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Làm thêm giờ (OT)</p>
              <div className="p-2 bg-teal-100 rounded-xl"><Clock className="w-4 h-4 text-teal-600" /></div>
            </div>
            <div className="text-3xl font-black text-teal-600">{stats.totalOT}</div>
            <p className="text-xs text-slate-400 mt-1">Tổng số công OT</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đi Muộn / Về sớm</p>
              <div className="p-2 bg-rose-100 rounded-xl"><TimerOff className="w-4 h-4 text-rose-600" /></div>
            </div>
            <div className="text-3xl font-black text-rose-600">{stats.totalShortfall}</div>
            <p className="text-xs text-slate-400 mt-1">Tổng số giờ thiếu</p>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md rounded-xl overflow-hidden border-slate-200/80">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" /> Top 15 nhân sự theo ngày công
                </CardTitle>
                <CardDescription>
                  Đã lọc theo phòng ban: {selectedDept === "ALL" ? "Tất cả" : selectedDept}
                </CardDescription>
              </div>
              {selectedDept !== "ALL" && (
                <Badge className="bg-blue-100 text-blue-700 shadow-none font-medium">{selectedDept}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <RechartsTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }}
                    formatter={(value: any) => [`${value} ngày`, "Tổng công"]}
                    labelFormatter={(label: any) => `Nhân sự: ${label}`}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={50} animationDuration={1200}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê phòng ban */}
        <Card className="shadow-md rounded-xl overflow-hidden border-slate-200/80">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-emerald-50/50 px-5 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Theo phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3 text-left">Phòng ban</th>
                    <th className="p-3 text-center">NV</th>
                    <th className="p-3 text-center">Công</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentStats.map((dept: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{dept.name}</td>
                      <td className="p-3 text-center"><Badge variant="secondary" className="font-bold">{dept.employees}</Badge></td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-blue-600">{dept.totalDays}</span>
                        <span className="text-slate-400 ml-1 text-[10px]">ngày</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};