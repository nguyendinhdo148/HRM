// src/AttendanceReport/utils.js
export const REPORT_API = `${import.meta.env.VITE_API_URL}/attendance-reports`;

export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const formatNumberWithDot = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const num = val.toString().replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const getDayOfWeek = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  const daysName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const fullName = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return {
    name: daysName[dayIndex],
    full: fullName[dayIndex],
    isWeekend: dayIndex === 0 || dayIndex === 6,
    isSunday: dayIndex === 0,
  };
};

export const fmtVN = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/**
 * Sinh mảng ngày từ fromDate → toDate (bao gồm cả 2 đầu)
 */
export const buildDaysArray = (from?: string, to?: string) => {
  if (!from || !to) return [];
  const start = new Date(from);
  const end = new Date(to);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const days: Array<{
    date: Date;
    day: number;
    month: number;
    year: number;
    key: string;
    label: string;
    dow: string;
    dowFull: string;
    isWeekend: boolean;
    isSunday: boolean;
  }> = [];

  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = getDayOfWeek(y, m, d);
    days.push({
      date: new Date(cur),
      day: d,
      month: m,
      year: y,
      key: iso,
      label: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
      dow: dow.name,
      dowFull: dow.full,
      isWeekend: dow.isWeekend,
      isSunday: dow.isSunday,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

export const CHART_COLORS = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b",
  "#10b981", "#ef4444", "#ec4899", "#6366f1",
];