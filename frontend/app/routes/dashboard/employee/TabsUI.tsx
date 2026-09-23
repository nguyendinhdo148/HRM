import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import {
  Users, MoreHorizontal, Pencil, Trash2, Clock, PlusCircle, Printer,
  Building2, X, CheckSquare, Square, ArrowRightLeft, Save, XCircle, Loader2,
  CheckCircle2, Lock, Unlock,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoDataFound } from "@/components/no-data-found";
import { calculateAge, CONTRACT_TYPES, EMPLOYEE_STATUS_UI, CONTRACT_STATUSES, formatDateForDisplay } from "./utils";

// ⚠️ Đổi path import này cho đúng với dự án của bạn
import { API_BASE_URL, getAuthHeaders } from "./utils";

// ============================================================
// CONSTANTS
// ============================================================
const DEFAULT_HOUSING_COST = 1200000;
const DEFAULT_MINISHOW_RATE = 65000;
const DEFAULT_BIGSHOW_RATE = 213462;

// ============================================================
// CSS
// ============================================================
const SCROLLBAR_STYLES = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 14px;
    height: 14px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 8px;
    border: 3px solid #f1f5f9;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }
  .custom-scrollbar {
    scrollbar-width: auto;
    scrollbar-color: #94a3b8 #f1f5f9;
  }

  /* ⭐ Gỡ overflow của wrapper shadcn Table để chỉ còn 1 vùng scroll duy nhất */
  .table-scroll-container > div {
    overflow: visible !important;
  }
`;

// ============================================================
// ⭐ TÍNH TOÁN DERIVED VALUES
// ============================================================
const computeDerived = (sb: any) => {
  const s = sb || {};

  const housingCost = Number(s.housingCost) || DEFAULT_HOUSING_COST;
  const dormitoryDeduction = Number(s.dormitoryDeduction) || 0;
  const housingAllowance = housingCost - dormitoryDeduction;

  let trainingAllowance = 0;
  if (s.trainingAllowanceType === "FIXED") {
    trainingAllowance = Number(s.trainingAllowanceFixed) || 0;
  } else if (s.trainingAllowanceType === "PER_SESSION") {
    trainingAllowance = Number(s.trainingAllowanceRate) || Number(s.trainingAllowance) || 0;
  }

  return {
    housingCost,
    dormitoryDeduction,
    housingAllowance,
    trainingAllowance,
  };
};

// ============================================================
// ⭐ CHUẨN HÓA salaryAndBenefits
// ============================================================
const normalizeSalaryAndBenefits = (sb: any) => {
  const s = sb || {};
  const derived = computeDerived(s);

  return {
    baseSalary: Number(s.baseSalary) || 0,
    insuranceSalary: Number(s.insuranceSalary) || 0,
    bankName: s.bankName ?? "",
    bankAccountNumber: s.bankAccountNumber ?? "",
    taxCode: s.taxCode ?? "",
    dependents: Number(s.dependents) || 0,
    socialInsuranceNumber: s.socialInsuranceNumber ?? "",
    paymentMethod: s.paymentMethod ?? "CASH",
    paymentPeriod: s.paymentPeriod ?? "",
    minishowRate: Number(s.minishowRate) || DEFAULT_MINISHOW_RATE,
    bigshowRate: Number(s.bigshowRate) || DEFAULT_BIGSHOW_RATE,
    mealRate: Number(s.mealRate) || 0,
    trainingAllowanceType: s.trainingAllowanceType ?? "NONE",
    trainingAllowanceFixed: Number(s.trainingAllowanceFixed) || 0,
    trainingAllowanceRate: Number(s.trainingAllowanceRate) || 0,
    trainingAllowance: derived.trainingAllowance,
    housingCost: derived.housingCost,
    dormitoryDeduction: derived.dormitoryDeduction,
    housingAllowance: derived.housingAllowance,
    bonuses: {
      responsibility: Number(s.bonuses?.responsibility) || 0,
      ...(s.bonuses || {}),
    },
  };
};

// ============================================================
// INLINE NUMBER INPUT — memo
// ============================================================
const InlineNumberInput = memo(({ value, onChange, disabled, className = "", min = 0, placeholder = "0" }: any) => {
  const [focused, setFocused] = useState(false);

  const displayValue =
    focused && (value === 0 || value === "0" || value === null || value === undefined)
      ? ""
      : (value ?? "");

  return (
    <input
      type="number"
      min={min}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full border border-slate-300 rounded-md px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed ${className}`}
      value={displayValue}
      onFocus={(e) => {
        setFocused(true);
        e.target.select?.();
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const v = e.target.value === "" ? 0 : Number(e.target.value);
        onChange?.(v);
      }}
    />
  );
});
InlineNumberInput.displayName = "InlineNumberInput";

// ============================================================
// TOAST
// ============================================================
const Toast = ({ show, message = "Lưu thành công!", type = "success" }: any) => {
  if (!show) return null;

  const colorMap: any = {
    success: { bg: "bg-emerald-600", border: "border-emerald-700", icon: <CheckCircle2 className="w-5 h-5 text-white" /> },
    error: { bg: "bg-rose-600", border: "border-rose-700", icon: <XCircle className="w-5 h-5 text-white" /> },
  };

  const c = colorMap[type] || colorMap.success;

  return (
    <div className="fixed top-4 right-4 z-[99999] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`${c.bg} ${c.border} border text-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-3 min-w-[280px] max-w-md`}>
        <div className="flex-shrink-0">{c.icon}</div>
        <div className="flex-1 font-semibold text-sm">{message}</div>
        <button type="button" className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity" aria-label="Đóng thông báo">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ⭐ EMPLOYEE ROW — memo
// ============================================================
const EmployeeRow = memo(
  ({
    emp,
    checked,
    isDirty,
    isSavedFlash,
    isUnlocked,
    isSavingAll,
    onToggleOne,
    onUpdateDraftField,
    onUpdateDraftBonus,
    onPrintContract,
    onOpenEmpModal,
    onDeleteEmp,
  }: any) => {
    const sb = emp._sb;
    const derived = emp._derived;

    const housingAllowance = derived.housingAllowance;
    const trainingAllowance = derived.trainingAllowance;

    const stickyBg = checked
      ? "bg-blue-50 group-hover:bg-blue-50"
      : isSavedFlash
      ? "bg-emerald-50"
      : isDirty
      ? "bg-amber-50"
      : "bg-white group-hover:bg-slate-50";

    // ⭐ Ca tập display text
    const isPerSession = sb.trainingAllowanceType === "PER_SESSION";
    const isFixed = sb.trainingAllowanceType === "FIXED";

    return (
      <TableRow
        className={`
          group
          ${checked ? "bg-blue-50/50" : ""}
          ${isSavedFlash ? "bg-emerald-50" : ""}
          ${isDirty ? "bg-amber-50/50" : ""}
          transition-all
        `}
      >
        <TableCell className={`sticky left-0 z-10 ${stickyBg} transition-colors`}>
          <button
            type="button"
            onClick={() => onToggleOne(emp._id)}
            className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white hover:border-blue-500 transition-colors"
          >
            {checked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
          </button>
        </TableCell>

        <TableCell className={`sticky left-[44px] z-10 ${stickyBg} font-medium text-blue-600 min-w-[100px] border-r border-slate-200 transition-colors`}>
          {emp.employeeCode}
        </TableCell>

        <TableCell className={`sticky left-[144px] z-10 ${stickyBg} min-w-[220px] border-r-2 border-slate-300 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors`}>
          <div className="font-bold text-slate-900">{emp.fullName}</div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                {emp.personalInfo?.gender || "Khác"} | {calculateAge(emp.personalInfo?.dateOfBirth)} tuổi
              </Badge>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              CCCD: {emp.idCardNumber || "Chưa cập nhật"}
            </div>
          </div>
        </TableCell>

        <TableCell className="min-w-[120px]">
          {emp.workInfo?.department || "Chưa xếp"}
        </TableCell>

        {/* LƯƠNG CB */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.baseSalary}
              onChange={(v: number) => onUpdateDraftField(emp._id, "baseSalary", v)}
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-slate-700">
              {sb.baseSalary?.toLocaleString("vi-VN") || 0} đ
            </span>
          )}
        </TableCell>

        {/* LƯƠNG BH */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.insuranceSalary}
              onChange={(v: number) => onUpdateDraftField(emp._id, "insuranceSalary", v)}
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-blue-700">
              {sb.insuranceSalary?.toLocaleString("vi-VN") || 0} đ
            </span>
          )}
        </TableCell>

        {/* MINI SHOW */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.minishowRate}
              onChange={(v: number) => onUpdateDraftField(emp._id, "minishowRate", v)}
              placeholder="65000"
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-purple-700">
              {(sb.minishowRate ?? 65000).toLocaleString("vi-VN")} đ
            </span>
          )}
        </TableCell>

        {/* BIG SHOW */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.bigshowRate}
              onChange={(v: number) => onUpdateDraftField(emp._id, "bigshowRate", v)}
              placeholder="213462"
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-purple-700">
              {(sb.bigshowRate ?? 213462).toLocaleString("vi-VN")} đ
            </span>
          )}
        </TableCell>

        {/* TIỀN ĂN CA */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.mealRate}
              onChange={(v: number) => onUpdateDraftField(emp._id, "mealRate", v)}
              placeholder="0"
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-emerald-700">
              {(sb.mealRate ?? 0).toLocaleString("vi-VN")} đ
            </span>
          )}
        </TableCell>

        {/* PHỤ CẤP Ở */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <div className="space-y-1.5 min-w-[170px]">
              <div>
                <div className="text-[9px] text-amber-700 font-semibold mb-0.5 text-left">Chi phí ở</div>
                <InlineNumberInput
                  value={sb.housingCost}
                  onChange={(v: number) => onUpdateDraftField(emp._id, "housingCost", v)}
                  placeholder="1200000"
                  disabled={isSavingAll}
                />
              </div>
              <div>
                <div className="text-[9px] text-amber-700 font-semibold mb-0.5 text-left">KTX tt VS (trừ)</div>
                <InlineNumberInput
                  value={sb.dormitoryDeduction}
                  onChange={(v: number) => onUpdateDraftField(emp._id, "dormitoryDeduction", v)}
                  placeholder="0"
                  disabled={isSavingAll}
                />
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold text-right pt-0.5 border-t border-emerald-200">
                = {housingAllowance.toLocaleString("vi-VN")} đ
              </div>
            </div>
          ) : (
            <span className="font-semibold text-amber-700">
              {housingAllowance.toLocaleString("vi-VN")} đ
            </span>
          )}
        </TableCell>

        {/* ⭐ PHỤ CẤP CA TẬP */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <div className="space-y-1.5 min-w-[170px]">
              <div>
                <div className="text-[9px] text-indigo-700 font-semibold mb-0.5 text-left">Hình thức</div>
                <select
                  className="w-full border border-indigo-300 rounded-md px-2 py-1 text-xs bg-white disabled:bg-slate-50"
                  value={sb.trainingAllowanceType || "NONE"}
                  onChange={(e) => onUpdateDraftField(emp._id, "trainingAllowanceType", e.target.value)}
                  disabled={isSavingAll}
                >
                  <option value="NONE">Không có</option>
                  <option value="FIXED">Cố định</option>
                  <option value="PER_SESSION">Theo buổi</option>
                </select>
              </div>

              {isFixed && (
                <div>
                  <div className="text-[9px] text-indigo-700 font-semibold mb-0.5 text-left">Giá cố định</div>
                  <InlineNumberInput
                    value={sb.trainingAllowanceFixed}
                    onChange={(v: number) => onUpdateDraftField(emp._id, "trainingAllowanceFixed", v)}
                    placeholder="VD: 500000"
                    disabled={isSavingAll}
                  />
                </div>
              )}

              {isPerSession && (
                <div>
                  <div className="text-[9px] text-indigo-700 font-semibold mb-0.5 text-left">Giá/buổi</div>
                  <InlineNumberInput
                    value={sb.trainingAllowanceRate}
                    onChange={(v: number) => onUpdateDraftField(emp._id, "trainingAllowanceRate", v)}
                    placeholder="VD: 39000"
                    disabled={isSavingAll}
                  />
                </div>
              )}

              {sb.trainingAllowanceType !== "NONE" && (
                <div className="text-[10px] text-green-600 font-semibold text-right pt-0.5 border-t border-green-200">
                  {isPerSession
                    ? `${trainingAllowance.toLocaleString("vi-VN")} đ/buổi`
                    : `= ${trainingAllowance.toLocaleString("vi-VN")} đ`}
                </div>
              )}
            </div>
          ) : (
            // ⭐ Chế độ xem — PER_SESSION hiển thị "X đ/buổi"
            <span className="font-semibold text-indigo-700">
              {isPerSession
                ? `${trainingAllowance.toLocaleString("vi-VN")} đ/buổi`
                : `${trainingAllowance.toLocaleString("vi-VN")} đ`}
            </span>
          )}
        </TableCell>

        {/* THƯỞNG TN */}
        <TableCell className="text-right">
          {isUnlocked ? (
            <InlineNumberInput
              value={sb.bonuses?.responsibility}
              onChange={(v: number) => onUpdateDraftBonus(emp._id, "responsibility", v)}
              disabled={isSavingAll}
            />
          ) : (
            <span className="font-semibold text-teal-700">
              {(sb.bonuses?.responsibility || 0).toLocaleString("vi-VN")} đ
            </span>
          )}
        </TableCell>

        {/* TRẠNG THÁI */}
        <TableCell className="text-center min-w-[120px]">
          <Badge className={`${EMPLOYEE_STATUS_UI[emp.status]?.color || "bg-slate-100 text-slate-600"} font-medium`}>
            {EMPLOYEE_STATUS_UI[emp.status]?.label || "Chưa xác định"}
          </Badge>
        </TableCell>

        {/* THAO TÁC */}
        <TableCell className={`text-right sticky right-0 z-10 ${stickyBg} min-w-[140px] border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors`}>
          <div className="flex justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPrintContract?.(emp)} className="cursor-pointer text-emerald-600">
                  <Printer className="mr-2 h-4 w-4" /> In hợp đồng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenEmpModal(emp)} className="cursor-pointer text-blue-600">
                  <Pencil className="mr-2 h-4 w-4" /> Sửa chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteEmp(emp._id)} className="cursor-pointer text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  },
  (prev, next) => {
    return (
      prev.emp._id === next.emp._id &&
      prev.emp._sb === next.emp._sb &&
      prev.emp._derived === next.emp._derived &&
      prev.checked === next.checked &&
      prev.isDirty === next.isDirty &&
      prev.isSavedFlash === next.isSavedFlash &&
      prev.isUnlocked === next.isUnlocked &&
      prev.isSavingAll === next.isSavingAll
    );
  }
);
EmployeeRow.displayName = "EmployeeRow";

// ============================================================
// 1. DEPARTMENTS TAB
// ============================================================
export const DepartmentsTab = ({ departments, handleOpenDeptModal, handleDeleteDept, isDeptDeleting, handleViewEmployeesInDept, getEmployeeCount }: any) => (
  <TabsContent value="departments" className="space-y-6">
    <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold">Danh sách Phòng ban</h3>
      <Button onClick={() => handleOpenDeptModal(null)} className="bg-blue-600 hover:bg-blue-700" disabled={isDeptDeleting}><PlusCircle className="size-4 mr-2" /> Thêm phòng ban</Button>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept: any) => (
        <Card key={dept._id} className="relative hover:shadow-md transition-all border-slate-200">
          <CardHeader className="pb-3">
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeptDeleting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenDeptModal(dept)} className="cursor-pointer text-blue-600" disabled={isDeptDeleting}><Pencil className="mr-2 h-4 w-4" /> Sửa</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteDept(dept._id)} className="cursor-pointer text-red-600" disabled={isDeptDeleting}><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl flex justify-center items-center text-white font-bold text-lg" style={{ backgroundColor: dept.color || "#3b82f6" }}>{dept.name.charAt(0)}</div>
              <div><CardTitle className="text-lg">{dept.name}</CardTitle><CardDescription className="line-clamp-1">{dept.description || "Không có mô tả"}</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4" /><span className="text-sm font-medium">Sĩ số: <strong>{getEmployeeCount(dept.name)}</strong></span></div>
              <Button variant="link" size="sm" className="p-0 text-blue-600" onClick={() => handleViewEmployeesInDept(dept.name)}>Xem danh sách &rarr;</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {departments.length === 0 && <div className="col-span-full"><NoDataFound title="Chưa có phòng ban" description="" buttonText="Tạo mới" buttonAction={() => handleOpenDeptModal(null)} /></div>}
    </div>
  </TabsContent>
);

// ============================================================
// 2. EMPLOYEES TAB
// ============================================================
export const EmployeesTab = ({
  processedEmployees,
  handleOpenEmpModal,
  handleDeleteEmp,
  onPrintContract,
  departments: departmentsProp = [],
  onBulkTransfer,
  onInlineUpdate,
  isBulkTransferring = false,
}: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetDept, setTargetDept] = useState<string>("");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedFlashes, setSavedFlashes] = useState<string[]>([]);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
  };

  const [internalDepts, setInternalDepts] = useState<any[]>([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(false);

  // ⭐ REF — chỉ còn wrapper bảng
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (departmentsProp && departmentsProp.length > 0) return;

    let cancelled = false;
    const fetchDepts = async () => {
      setIsDeptsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/departments`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setInternalDepts(data);
        }
      } catch (e) {
        console.error("Fetch departments failed:", e);
      } finally {
        if (!cancelled) setIsDeptsLoading(false);
      }
    };
    fetchDepts();
    return () => { cancelled = true; };
  }, [departmentsProp]);

  const departments = departmentsProp.length > 0 ? departmentsProp : internalDepts;

  const departmentOptions = useMemo(
    () => departments.map((d: any) => d.name).filter(Boolean),
    [departments]
  );

  const dirtyCount = Object.keys(drafts).length;

  useEffect(() => {
    return () => {
      setDrafts({});
      setIsUnlocked(false);
    };
  }, []);

  const allSelected =
    processedEmployees.length > 0 &&
    selectedIds.length === processedEmployees.length;

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(processedEmployees.map((e: any) => e._id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setTargetDept("");
  };

  const handleTransfer = async () => {
    if (selectedIds.length === 0) return;
    if (!targetDept) {
      alert("Vui lòng chọn phòng ban đích!");
      return;
    }
    if (!onBulkTransfer) {
      alert("Chưa cấu hình hàm xử lý chuyển phòng ban!");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn chuyển ${selectedIds.length} nhân viên sang phòng "${targetDept}"?`)) return;

    await onBulkTransfer(selectedIds, targetDept);
    clearSelection();
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    setDrafts({});
    showToast("Đã mở khóa — giờ có thể sửa trực tiếp!", "success");
  };

  const handleLock = () => {
    if (dirtyCount > 0) {
      if (!window.confirm(`Còn ${dirtyCount} thay đổi chưa lưu. Bạn có chắc muốn khóa và hủy các thay đổi?`)) return;
    }
    setIsUnlocked(false);
    setDrafts({});
  };

  const updateDraftField = useCallback((empId: string, field: string, value: any) => {
    setDrafts((prev) => {
      const emp = processedEmployees.find((e: any) => e._id === empId);
      const base = prev[empId] || normalizeSalaryAndBenefits(emp?.salaryAndBenefits);

      const next = { ...base, [field]: value };

      const derived = computeDerived(next);
      next.housingCost = derived.housingCost;
      next.dormitoryDeduction = derived.dormitoryDeduction;
      next.housingAllowance = derived.housingAllowance;
      next.trainingAllowance = derived.trainingAllowance;

      return { ...prev, [empId]: next };
    });
  }, [processedEmployees]);

  const updateDraftBonus = useCallback((empId: string, field: string, value: any) => {
    setDrafts((prev) => {
      const emp = processedEmployees.find((e: any) => e._id === empId);
      const base = prev[empId] || normalizeSalaryAndBenefits(emp?.salaryAndBenefits);

      const next = {
        ...base,
        bonuses: { ...(base.bonuses || {}), [field]: value },
      };
      return { ...prev, [empId]: next };
    });
  }, [processedEmployees]);

  const rowsData = useMemo(() => {
    return processedEmployees.map((emp: any) => {
      const base = normalizeSalaryAndBenefits(emp?.salaryAndBenefits);
      const draft = drafts[emp._id];

      const sb = draft
        ? { ...base, ...draft, bonuses: { ...base.bonuses, ...(draft.bonuses || {}) } }
        : base;

      return {
        ...emp,
        _sb: sb,
        _derived: computeDerived(sb),
      };
    });
  }, [processedEmployees, drafts]);

  const handleSaveAll = async () => {
    if (dirtyCount === 0) {
      showToast("Không có thay đổi nào để lưu.", "error");
      return;
    }

    setIsSavingAll(true);
    const savedIds: string[] = [];
    const failedIds: string[] = [];

    try {
      for (const empId of Object.keys(drafts)) {
        const finalSalary = normalizeSalaryAndBenefits(drafts[empId]);
        console.log("🚀 Saving employee:", { empId, finalSalary });

        try {
          if (onInlineUpdate) {
            await onInlineUpdate(empId, finalSalary);
          } else {
            const authHeaders = getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/employees/${empId}`, {
              method: "PATCH",
              headers: { ...authHeaders, "Content-Type": "application/json" },
              body: JSON.stringify({ salaryAndBenefits: finalSalary }),
            });

            if (!res.ok) {
              const errText = await res.text();
              console.error(`Save failed for ${empId}:`, res.status, errText);
              throw new Error(`HTTP ${res.status}: ${errText}`);
            }
          }
          savedIds.push(empId);
        } catch (err) {
          console.error(`Failed to save ${empId}:`, err);
          failedIds.push(empId);
        }
      }

      if (savedIds.length > 0) {
        setSavedFlashes(savedIds);
        setTimeout(() => setSavedFlashes([]), 1500);
      }

      if (failedIds.length === 0) {
        showToast(`Đã lưu thành công ${savedIds.length} nhân viên!`, "success");
        setIsUnlocked(false);
        setDrafts({});
      } else if (savedIds.length === 0) {
        showToast(`Lưu thất bại tất cả ${failedIds.length} nhân viên!`, "error");
      } else {
        showToast(`Lưu ${savedIds.length} thành công, ${failedIds.length} thất bại!`, "error");
        const remaining: Record<string, any> = {};
        failedIds.forEach((id) => { remaining[id] = drafts[id]; });
        setDrafts(remaining);
      }
    } catch (e: any) {
      console.error("Save all error:", e);
      showToast("Lỗi: " + (e.message || "Không xác định"), "error");
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <TabsContent value="employees">
      <style>{SCROLLBAR_STYLES}</style>

      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ===== Toolbar ===== */}
      <div className="flex items-center justify-between gap-3 mb-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {!isUnlocked ? (
            <Button onClick={handleUnlock} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Unlock className="w-4 h-4 mr-2" />
              Mở khóa để sửa
            </Button>
          ) : (
            <>
              <Button onClick={handleLock} variant="outline" className="border-slate-300 text-slate-700 font-bold">
                <Lock className="w-4 h-4 mr-2" />
                Khóa lại
              </Button>

              <Button
                onClick={handleSaveAll}
                disabled={isSavingAll || dirtyCount === 0}
                className={`font-bold ${dirtyCount > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-200 text-slate-400"}`}
              >
                {isSavingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu tất cả {dirtyCount > 0 && `(${dirtyCount})`}
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Unlock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Đang mở khóa {dirtyCount > 0 && `— ${dirtyCount} thay đổi`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Đã khóa — chỉ xem</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Bulk action bar ===== */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-30 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-blue-800 font-bold">
            <CheckSquare className="w-5 h-5" />
            Đã chọn {selectedIds.length} nhân viên
          </div>

          <div className="h-6 w-px bg-blue-200" />

          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Chuyển sang:</span>
            <Select value={targetDept} onValueChange={setTargetDept}>
              <SelectTrigger className="w-[240px] h-9 bg-white border-blue-200">
                <SelectValue placeholder={isDeptsLoading ? "Đang tải..." : "Chọn phòng ban..."} />
              </SelectTrigger>
              <SelectContent>
                {isDeptsLoading ? (
                  <div className="px-3 py-2 text-sm text-slate-400">Đang tải phòng ban...</div>
                ) : departmentOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-400">Chưa có phòng ban</div>
                ) : (
                  departmentOptions.map((name: string) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {name}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleTransfer} disabled={isBulkTransferring || !targetDept} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isBulkTransferring ? "Đang chuyển..." : "Chuyển phòng ban"}
          </Button>

          <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4 mr-1" /> Bỏ chọn
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* ⭐ Wrapper DUY NHẤT có scroll — gỡ overflow của shadcn Table bên trong */}
        <div
          ref={tableScrollRef}
          className="table-scroll-container custom-scrollbar"
          style={{
            maxHeight: "calc(100vh - 280px)",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <Table className="min-w-[2100px]">
            {/* ⭐ STICKY HEADER — sticky trực tiếp trên từng <th> */}
            <TableHeader className="bg-slate-50">
              <TableRow className="bg-slate-50">
                <TableHead className="sticky top-0 left-0 z-40 bg-slate-50 w-[44px]">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white hover:border-blue-500 transition-colors"
                    title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  >
                    {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 left-[44px] z-40 bg-slate-50 min-w-[100px] border-r border-slate-200">
                  Mã NV
                </TableHead>
                <TableHead className="sticky top-0 left-[144px] z-40 bg-slate-50 min-w-[220px] border-r-2 border-slate-300 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  Họ Tên & Định danh
                </TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 min-w-[120px]">Phòng ban</TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[130px]"><span className="text-blue-700">💰 Lương CB</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[130px]"><span className="text-blue-700">🏥 Lương BH</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[110px]"><span className="text-purple-700">🎭 Mini Show</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[110px]"><span className="text-purple-700">🎭 Big Show</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[110px]"><span className="text-emerald-700">🍚 Tiền ăn/ca</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[180px]"><span className="text-amber-700">🏠 Phụ cấp ở</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[180px]"><span className="text-indigo-700">🎓 Ca tập</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-right min-w-[130px]"><span className="text-teal-700">🏆 Thưởng TN</span></TableHead>
                <TableHead className="sticky top-0 z-40 bg-slate-50 text-center min-w-[120px]">Trạng thái NS</TableHead>
                <TableHead className="sticky top-0 right-0 z-40 bg-slate-50 text-right min-w-[140px] border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rowsData.map((emp: any) => (
                <EmployeeRow
                  key={emp._id}
                  emp={emp}
                  checked={selectedIds.includes(emp._id)}
                  isDirty={!!drafts[emp._id]}
                  isSavedFlash={savedFlashes.includes(emp._id)}
                  isUnlocked={isUnlocked}
                  isSavingAll={isSavingAll}
                  onToggleOne={toggleOne}
                  onUpdateDraftField={updateDraftField}
                  onUpdateDraftBonus={updateDraftBonus}
                  onPrintContract={onPrintContract}
                  onOpenEmpModal={handleOpenEmpModal}
                  onDeleteEmp={handleDeleteEmp}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {processedEmployees.length === 0 && (
          <div className="py-8">
            <NoDataFound title="Không có dữ liệu" description="Chưa có nhân viên nào phù hợp." buttonText="Thêm mới" buttonAction={() => handleOpenEmpModal(null)} />
          </div>
        )}
      </div>
    </TabsContent>
  );
};

// ============================================================
// 3. CONTRACTS TAB
// ============================================================
export const ContractsTab = ({ processedEmployees, handleOpenEmpModal, onPrintContract }: any) => (
  <TabsContent value="contracts">
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead className="text-center">Loại Hợp Đồng</TableHead>
              <TableHead className="text-center">Thời hạn HĐ</TableHead>
              <TableHead className="text-center">Trạng Thái NS</TableHead>
              <TableHead>Thâm Niên</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedEmployees.map((emp: any) => {
              const statusInfo = CONTRACT_STATUSES[emp.currentContractStatus || "CHUA_XAC_DINH"];
              const StatusIcon = statusInfo?.icon || Clock;
              return (
                <TableRow key={emp._id}>
                  <TableCell>
                    <div className="font-bold text-slate-900">{emp.fullName}</div>
                    <div className="text-xs text-slate-500">Mã NV: {emp.employeeCode} | {emp.workInfo?.department}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-indigo-700 bg-indigo-50">{CONTRACT_TYPES.find(t => t.value === emp.contractInfo?.contractType)?.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo?.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {statusInfo?.label}
                    </div>
                    {emp.contractInfo?.endDate && <div className="text-[11px] text-slate-500 mt-1">Đến: {formatDateForDisplay(emp.contractInfo.endDate)}</div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${EMPLOYEE_STATUS_UI[emp.status]?.color} font-medium`}>{EMPLOYEE_STATUS_UI[emp.status]?.label}</Badge>
                    {emp.status === "resigned" && emp.workInfo?.resignationDate && (
                      <div className="text-[11px] text-rose-600 font-bold mt-1">Nghỉ: {formatDateForDisplay(emp.workInfo.resignationDate)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-bold text-slate-800">{emp.workingDuration?.formatted || "-"}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onPrintContract?.(emp)} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> In HĐ
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEmpModal(emp, "work")} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Cập nhật HĐ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {processedEmployees.length === 0 && <NoDataFound title="Không tìm thấy hợp đồng" description="" buttonText="Đóng" buttonAction={() => {}} />}
      </div>
    </div>
  </TabsContent>
);