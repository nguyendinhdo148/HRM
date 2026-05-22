import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Users, Briefcase, Filter, X, Search, Upload, UserPlus, 
  Download, RefreshCcw, ArrowDownAZ, ArrowUpZA, ArrowUpDown, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
import * as XLSX from "xlsx";

import { API_BASE_URL, getAuthHeaders, EMPLOYEE_STATUSES, CONTRACT_TYPES, GENDER_OPTIONS, initialEmpForm, formatDateForInput, ALL_FIELDS, formatDateForDisplay } from "./utils";
import { DepartmentsTab, EmployeesTab, ContractsTab } from "./TabsUI";
import { DepartmentModal, EmployeeModal } from "./FormsModal";
import { ImportExcelModal } from "./ImportExcelModal";

export default function HRMDashboard() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("departments");

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortCodeOrder, setSortCodeOrder] = useState<"asc" | "desc">("asc");

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3b82f6" });

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empFormTab, setEmpFormTab] = useState("personal"); 
  const [empForm, setEmpForm] = useState(initialEmpForm);
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("years");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (error) { console.error("Lỗi khi tải dữ liệu:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const { contractType, signDate } = empForm.contractInfo;
    if (contractType === "FIXED_TERM" && signDate && durationValue > 0) {
      const start = new Date(signDate);
      if (durationUnit === "months") {
        start.setMonth(start.getMonth() + durationValue);
      } else {
        start.setFullYear(start.getFullYear() + durationValue);
      }
      start.setDate(start.getDate() - 1); 
      
      const durationStr = `${durationValue} ${durationUnit === "months" ? "tháng" : "năm"}`;
      
      setEmpForm(prev => ({
        ...prev,
        contractInfo: { ...prev.contractInfo, contractDuration: durationStr, endDate: start.toISOString().split('T')[0] }
      }));
    } else if (contractType === "INDEFINITE") {
      setEmpForm(prev => ({
        ...prev,
        contractInfo: { ...prev.contractInfo, contractDuration: "Không thời hạn", endDate: "" }
      }));
    }
  }, [empForm.contractInfo.contractType, empForm.contractInfo.signDate, durationValue, durationUnit]);

  const processedEmployees = useMemo(() => {
    const filtered = employees.filter((emp) => {
      const matchesSearch = searchQuery === "" || 
        emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === null || emp.workInfo?.department === deptFilter;
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
      const matchesType = typeFilter === "all" || emp.contractInfo?.contractType === typeFilter;
      const matchesGender = genderFilter === "all" || emp.personalInfo?.gender === genderFilter;

      return matchesSearch && matchesDept && matchesStatus && matchesType && matchesGender;
    });

    return filtered.sort((a, b) => {
      const codeA = a.employeeCode || "";
      const codeB = b.employeeCode || "";
      
      if (sortCodeOrder === "asc") {
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
      }
    });
  }, [employees, searchQuery, deptFilter, statusFilter, typeFilter, genderFilter, sortCodeOrder]);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedDept ? `${API_BASE_URL}/departments/${selectedDept._id}` : `${API_BASE_URL}/departments`;
    try {
      const res = await fetch(url, { method: selectedDept ? "PUT" : "POST", headers: getAuthHeaders(), body: JSON.stringify(deptForm) });
      if (res.ok) { setIsDeptModalOpen(false); fetchData(); } else alert("Có lỗi xảy ra khi lưu phòng ban!");
    } catch (error) { console.error(error); }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng ban này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchData(); else alert((await res.json()).message);
    } catch (error) { console.error(error); }
  };

  const handleOpenEmpModal = (emp: any = null, forceTab: string = "personal") => {
    setSelectedEmp(emp); 
    setEmpFormTab(forceTab); 
    if (emp) {
      setEmpForm({
        ...initialEmpForm,
        employeeCode: emp.employeeCode || "", idCardNumber: emp.idCardNumber || "", fullName: emp.fullName || "", email: emp.email || "", phoneNumber: emp.phoneNumber || "", status: emp.status || "active",
        personalInfo: {
          ...emp.personalInfo,
          dateOfBirth: formatDateForInput(emp.personalInfo?.dateOfBirth), gender: emp.personalInfo?.gender || "Khác", idCardIssueDate: formatDateForInput(emp.personalInfo?.idCardIssueDate),
        },
        workInfo: { 
          ...emp.workInfo, 
          joinDate: formatDateForInput(emp.workInfo?.joinDate),
          resignationDate: formatDateForInput(emp.workInfo?.resignationDate) 
        },
        contractInfo: { 
          ...emp.contractInfo, 
          signDate: formatDateForInput(emp.contractInfo?.signDate), 
          endDate: formatDateForInput(emp.contractInfo?.endDate), 
          probationStartDate: formatDateForInput(emp.contractInfo?.probationStartDate), 
          probationEndDate: formatDateForInput(emp.contractInfo?.probationEndDate) 
        },
        salaryAndBenefits: emp.salaryAndBenefits || initialEmpForm.salaryAndBenefits
      });

      if (emp.contractInfo?.contractDuration) {
        const dStr = emp.contractInfo.contractDuration.toLowerCase();
        const numMatch = dStr.match(/\d+/);
        if (numMatch) {
          setDurationValue(parseInt(numMatch[0], 10));
          setDurationUnit(dStr.includes("tháng") ? "months" : "years");
        }
      } else {
        setDurationValue(1);
        setDurationUnit("years");
      }
    } else {
      setEmpForm(initialEmpForm);
      setDurationValue(1);
      setDurationUnit("years");
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedEmp ? `${API_BASE_URL}/employees/${selectedEmp._id}` : `${API_BASE_URL}/employees`;
    try {
      const res = await fetch(url, { method: selectedEmp ? "PUT" : "POST", headers: getAuthHeaders(), body: JSON.stringify(empForm) });
      if (res.ok) { setIsEmpModalOpen(false); fetchData(); } else { const err = await res.json(); alert(err.message); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteEmp = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân sự này?")) return;
    try { const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: "DELETE", headers: getAuthHeaders() }); if (res.ok) fetchData(); } catch (error) { console.error(error); }
  };

  const handleExportExcel = async () => {
    if (processedEmployees.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const wb = XLSX.utils.book_new();
      const headers = ["STT", ...ALL_FIELDS.map(c => c.label)];

      const dataRows = processedEmployees.map((emp, index) => {
        const rowData = ALL_FIELDS.map((field) => {
          const keys = field.path.split('.');
          let val = emp;
          for (let k of keys) {
            if (val !== undefined && val !== null) val = val[k];
            else val = "";
          }

          if (field.type === "date" && val) return formatDateForDisplay(val);
          if (field.type === "select") {
            if (field.id === "status") return EMPLOYEE_STATUSES.find(s => s.value === val)?.label || val;
            if (field.id === "contractType") return CONTRACT_TYPES.find(c => c.value === val)?.label || val;
          }
          if ((field.id === "bankAccountNumber" || field.id === "idCardNumber" || field.id === "phoneNumber" || field.id === "employeeCode" || field.id === "taxCode" || field.id === "socialInsuranceNumber") && val) {
            return val.toString();
          }

          return val !== undefined && val !== null ? val : "";
        });
        
        return [index + 1, ...rowData];
      });

      const wsData = [
        [`DANH SÁCH NHÂN SỰ - Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`],
        [], 
        headers,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 5 }, ...ALL_FIELDS.map(() => ({ wch: 20 }))];
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[cellRef]) {
          ws[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E40AF" } }, alignment: { horizontal: "center", vertical: "center" } };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Nhan_Su");
      XLSX.writeFile(wb, `Danh_Sach_Nhan_Su_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      alert("Có lỗi xảy ra khi xuất file Excel!");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
        <Loader className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10 relative">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Hệ thống Nhân sự (HRM)</h2>
        <p className="text-muted-foreground">Quản lý cơ cấu phòng ban, hồ sơ nhân sự và theo dõi hợp đồng tập trung.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-3 mb-8">
          <TabsTrigger value="departments" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> 1. Phòng ban</TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2"><Users className="w-4 h-4" /> 2. Hồ sơ Nhân sự</TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> 3. Quản lý Hợp đồng</TabsTrigger>
        </TabsList>

        {(activeTab === "employees" || activeTab === "contracts") && (
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl border shadow-sm mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{activeTab === "employees" ? "Hồ sơ Nhân sự" : "Quản lý Hợp đồng"}</h3>
                {deptFilter && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 cursor-pointer flex items-center gap-1 border-blue-200" onClick={() => setDeptFilter(null)}>
                    <Filter className="w-3 h-3" /> Lọc: {deptFilter} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Đang hiển thị {processedEmployees.length} kết quả.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Tìm tên, mã NV..." className="pl-9 bg-slate-50 border-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <Button 
                variant="outline" 
                onClick={() => setSortCodeOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="bg-slate-50 border-slate-200 font-medium text-slate-700 w-full sm:w-auto"
              >
                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
                Mã NV: {sortCodeOrder === "asc" ? "Tăng dần" : "Giảm dần"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-50 border-slate-200 w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                    {statusFilter === "all" ? "Tất cả trạng thái" : EMPLOYEE_STATUSES.find(s => s.value === statusFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")} className="font-medium">Tất cả</DropdownMenuItem>
                  {EMPLOYEE_STATUSES.map((s) => (<DropdownMenuItem key={s.value} onClick={() => setStatusFilter(s.value)}>{s.label}</DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-50 border-slate-200 w-full sm:w-auto">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                    {typeFilter === "all" ? "Mọi loại HĐ" : CONTRACT_TYPES.find(t => t.value === typeFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setTypeFilter("all")} className="font-medium">Tất cả</DropdownMenuItem>
                  {CONTRACT_TYPES.map((t) => (<DropdownMenuItem key={t.value} onClick={() => setTypeFilter(t.value)}>{t.label}</DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-50 border-slate-200 w-full sm:w-auto">
                    <User className="w-4 h-4 mr-2 text-slate-500" />
                    {genderFilter === "all" ? "Mọi giới tính" : GENDER_OPTIONS.find(g => g.value === genderFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  <DropdownMenuItem onClick={() => setGenderFilter("all")} className="font-medium">Tất cả</DropdownMenuItem>
                  {GENDER_OPTIONS.map((g) => (
                    <DropdownMenuItem key={g.value} onClick={() => setGenderFilter(g.value)}>{g.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTab === "employees" && (
                <>
                  <Button variant="outline" onClick={handleExportExcel} disabled={isExporting} className="border-blue-600 text-blue-600 hover:bg-blue-50 ml-0 lg:ml-2 w-full sm:w-auto flex">
                    {isExporting ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} 
                    Xuất Excel
                  </Button>
                  <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="border-teal-600 text-teal-600 hover:bg-teal-50 ml-0 lg:ml-2 w-full sm:w-auto flex">
                    <Upload className="size-4 mr-2" /> Nhập Excel
                  </Button>
                  <Button onClick={() => handleOpenEmpModal(null)} className="bg-teal-600 hover:bg-teal-700 ml-0 lg:ml-2 w-full sm:w-auto">
                    <UserPlus className="size-4 mr-2" /> Thêm mới
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <DepartmentsTab 
          departments={departments} 
          handleOpenDeptModal={(dept: any) => { setSelectedDept(dept); setIsDeptModalOpen(true); }} 
          handleDeleteDept={handleDeleteDept} 
          handleViewEmployeesInDept={(name: string) => { setDeptFilter(name); setActiveTab("employees"); }} 
          getEmployeeCount={(name: string) => employees.filter(emp => emp.workInfo?.department === name).length}
        />
        
        <EmployeesTab 
          processedEmployees={processedEmployees} 
          handleOpenEmpModal={handleOpenEmpModal} 
          handleDeleteEmp={handleDeleteEmp} 
        />
        
        <ContractsTab 
          processedEmployees={processedEmployees} 
          handleOpenEmpModal={handleOpenEmpModal} 
        />
      </Tabs>

      <DepartmentModal 
        isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} 
        selectedDept={selectedDept} deptForm={deptForm} setDeptForm={setDeptForm} handleSaveDepartment={handleSaveDepartment} 
      />
      <EmployeeModal 
        isOpen={isEmpModalOpen} onClose={() => setIsEmpModalOpen(false)} 
        selectedEmp={selectedEmp} empForm={empForm} setEmpForm={setEmpForm} 
        empFormTab={empFormTab} setEmpFormTab={setEmpFormTab} handleSaveEmployee={handleSaveEmployee} 
        departments={departments} durationValue={durationValue} setDurationValue={setDurationValue} durationUnit={durationUnit} setDurationUnit={setDurationUnit}
      />
      <ImportExcelModal 
        isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchData} departmentsList={departments}
      />
    </div>
  );
}