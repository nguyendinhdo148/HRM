import React, { useState, useMemo, useEffect } from "react";
import {
  Users, MoreHorizontal, Pencil, Trash2, Clock, PlusCircle, Printer,
  Building2, X, CheckSquare, Square, ArrowRightLeft,
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
// 1. DEPARTMENTS TAB (giữ nguyên)
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
// 2. EMPLOYEES TAB (có chọn + chuyển phòng ban hàng loạt)
// ============================================================
export const EmployeesTab = ({
  processedEmployees,
  handleOpenEmpModal,
  handleDeleteEmp,
  onPrintContract,
  departments: departmentsProp = [],
  onBulkTransfer,
  isBulkTransferring = false,
}: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetDept, setTargetDept] = useState<string>("");

  // ⚠️ Fallback: tự fetch departments nếu cha không truyền
  const [internalDepts, setInternalDepts] = useState<any[]>([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(false);

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

  const allSelected =
    processedEmployees.length > 0 &&
    selectedIds.length === processedEmployees.length;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  return (
    <TabsContent value="employees">
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

          <Button
            size="sm"
            onClick={handleTransfer}
            disabled={isBulkTransferring || !targetDept}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isBulkTransferring ? "Đang chuyển..." : "Chuyển phòng ban"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="ml-auto text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4 mr-1" /> Bỏ chọn
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[44px]">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white hover:border-blue-500 transition-colors"
                  title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </TableHead>
              <TableHead>Mã NV</TableHead>
              <TableHead>Họ Tên & Định danh</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Loại HĐ</TableHead>
              <TableHead>Lương CB</TableHead>
              <TableHead>Ngày vào làm</TableHead>
              <TableHead className="text-center">Trạng thái NS</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedEmployees.map((emp: any) => {
              const checked = selectedIds.includes(emp._id);
              return (
                <TableRow key={emp._id} className={checked ? "bg-blue-50/50 hover:bg-blue-50" : ""}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleOne(emp._id)}
                      className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white hover:border-blue-500 transition-colors"
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">{emp.employeeCode}</TableCell>
                  <TableCell>
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
                  <TableCell>{emp.workInfo?.department || "Chưa xếp"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-indigo-700 bg-indigo-50">{CONTRACT_TYPES.find(t => t.value === emp.contractInfo?.contractType)?.label || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{emp.salaryAndBenefits?.baseSalary?.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>{formatDateForDisplay(emp.workInfo?.joinDate)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${EMPLOYEE_STATUS_UI[emp.status]?.color || "bg-slate-100 text-slate-600"} font-medium`}>
                      {EMPLOYEE_STATUS_UI[emp.status]?.label || "Chưa xác định"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPrintContract?.(emp)} className="cursor-pointer text-emerald-600">
                          <Printer className="mr-2 h-4 w-4" /> In hợp đồng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEmpModal(emp)} className="cursor-pointer text-blue-600">
                          <Pencil className="mr-2 h-4 w-4" /> Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteEmp(emp._id)} className="cursor-pointer text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {processedEmployees.length === 0 && <div className="py-8"><NoDataFound title="Không có dữ liệu" description="Chưa có nhân viên nào phù hợp." buttonText="Thêm mới" buttonAction={() => handleOpenEmpModal(null)} /></div>}
      </div>
    </TabsContent>
  );
};

// ============================================================
// 3. CONTRACTS TAB (giữ nguyên)
// ============================================================
export const ContractsTab = ({ processedEmployees, handleOpenEmpModal, onPrintContract }: any) => (
  <TabsContent value="contracts">
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onPrintContract?.(emp)} 
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" /> In HĐ
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEmpModal(emp, "work")} 
                      className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
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
  </TabsContent>
);