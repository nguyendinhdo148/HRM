import React from "react";
import { Users, MoreHorizontal, Pencil, Trash2, Clock, PlusCircle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NoDataFound } from "@/components/no-data-found";
import { CONTRACT_TYPES, EMPLOYEE_STATUS_UI, CONTRACT_STATUSES, formatDateForDisplay } from "./utils";

export const DepartmentsTab = ({ departments, handleOpenDeptModal, handleDeleteDept, handleViewEmployeesInDept, getEmployeeCount }: any) => (
  <TabsContent value="departments" className="space-y-6">
    <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold">Danh sách Phòng ban</h3>
      <Button onClick={() => handleOpenDeptModal(null)} className="bg-blue-600 hover:bg-blue-700"><PlusCircle className="size-4 mr-2" /> Thêm phòng ban</Button>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept: any) => (
        <Card key={dept._id} className="relative hover:shadow-md transition-all border-slate-200">
          <CardHeader className="pb-3">
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenDeptModal(dept)} className="cursor-pointer text-blue-600"><Pencil className="mr-2 h-4 w-4" /> Sửa</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteDept(dept._id)} className="cursor-pointer text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>
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

export const EmployeesTab = ({ processedEmployees, handleOpenEmpModal, handleDeleteEmp }: any) => (
  <TabsContent value="employees">
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Mã NV</TableHead><TableHead>Họ Tên</TableHead><TableHead>Phòng ban</TableHead>
            <TableHead>Loại HĐ</TableHead><TableHead>Lương CB</TableHead><TableHead>Ngày vào làm</TableHead>
            <TableHead className="text-center">Trạng thái NS</TableHead><TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedEmployees.map((emp: any) => (
            <TableRow key={emp._id}>
              <TableCell className="font-medium text-blue-600">{emp.employeeCode}</TableCell>
              <TableCell className="font-semibold">{emp.fullName}</TableCell>
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
                    <DropdownMenuItem onClick={() => handleOpenEmpModal(emp)} className="cursor-pointer text-blue-600"><Pencil className="mr-2 h-4 w-4" /> Sửa</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteEmp(emp._id)} className="cursor-pointer text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {processedEmployees.length === 0 && <div className="py-8"><NoDataFound title="Không có dữ liệu" description="Chưa có nhân viên nào phù hợp." buttonText="Thêm mới" buttonAction={() => handleOpenEmpModal(null)} /></div>}
    </div>
  </TabsContent>
);

export const ContractsTab = ({ processedEmployees, handleOpenEmpModal }: any) => (
  <TabsContent value="contracts">
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Nhân viên</TableHead><TableHead className="text-center">Loại Hợp Đồng</TableHead>
            <TableHead className="text-center">Thời hạn HĐ</TableHead><TableHead className="text-center">Trạng Thái NS</TableHead>
            <TableHead>Thâm Niên</TableHead><TableHead className="text-right">Thao tác</TableHead>
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
                  {/* HIỂN THỊ NGÀY NGHỈ NẾU CÓ */}
                  {emp.status === "resigned" && emp.workInfo?.resignationDate && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1">Nghỉ: {formatDateForDisplay(emp.workInfo.resignationDate)}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-bold text-slate-800">{emp.workingDuration?.formatted || "-"}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEmpModal(emp, "work")} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Cập nhật HĐ
                  </Button>
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