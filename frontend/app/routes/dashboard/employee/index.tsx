import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Users, Building2, UserPlus, Briefcase, 
  MoreHorizontal, Pencil, Trash2, X, Info, FileText, DollarSign,
  Filter
} from "lucide-react";

// UI Components (Shadcn UI)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";

// Cấu hình Base URL API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/hrm`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// Hàm format ngày
const formatDateForInput = (isoString?: string) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().split('T')[0];
};

const formatDateForDisplay = (isoString?: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

export default function HRMDashboard() {
  // ==========================================
  // 1. STATES QUẢN LÝ DỮ LIỆU & TAB
  // ==========================================
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Điều hướng Tabs và Lọc
  const [activeTab, setActiveTab] = useState("departments");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);

  // States quản lý Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  
  const [empFormTab, setEmpFormTab] = useState("personal"); 

  // Form States
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3b82f6" });
  
  const initialEmpForm = {
    employeeCode: "",
    fullName: "",
    email: "",
    personalInfo: {
      dateOfBirth: "", gender: "Khác", idCardIssueDate: "", idCardIssuePlace: "",
      nationality: "Việt Nam", ethnicity: "", hometown: "", permanentAddress: ""
    },
    workInfo: {
      department: "", position: "", title: "", profession: "", jobDescription: "",
      workingTime: "", equipmentProvided: "", transportation: ""
    },
    contractInfo: {
      contractNumber: "", contractType: "", signDate: "", endDate: "",
      probationStartDate: "", probationEndDate: "", compensationRegime: ""
    },
    salaryAndBenefits: {
      taxCode: "", socialInsuranceNumber: "", insuranceSalary: 0, baseSalary: 0,
      paymentMethod: "", paymentPeriod: "",
      allowances: { meal: 0, transport: 0, phone: 0, clothing: 0, housing: 0, other: 0 },
      bonuses: { general: 0, performance: 0 }
    },
    status: "active"
  };

  const [empForm, setEmpForm] = useState(initialEmpForm);

  // ==========================================
  // 2. GỌI API ĐỂ LẤY DỮ LIỆU
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
      ]);
      
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hàm tính tổng số nhân viên theo phòng ban
  const getEmployeeCount = (deptName: string) => {
    return employees.filter(emp => emp.workInfo?.department === deptName).length;
  };

  // ==========================================
  // 3. LOGIC XỬ LÝ PHÒNG BAN
  // ==========================================
  const handleOpenDeptModal = (dept: any = null) => {
    setSelectedDept(dept);
    setDeptForm(dept ? { name: dept.name, description: dept.description, color: dept.color } : { name: "", description: "", color: "#3b82f6" });
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedDept ? `${API_BASE_URL}/departments/${selectedDept._id}` : `${API_BASE_URL}/departments`;
    const method = selectedDept ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(deptForm) });
      if (res.ok) {
        setIsDeptModalOpen(false);
        fetchData();
      } else {
        alert("Có lỗi xảy ra khi lưu phòng ban!");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng ban này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchData();
      else alert((await res.json()).message || "Không thể xóa phòng ban");
    } catch (error) { console.error(error); }
  };

  // Hàm chuyển sang tab Nhân viên và lọc theo phòng ban
  const handleViewEmployeesInDept = (deptName: string) => {
    setDeptFilter(deptName);
    setActiveTab("employees");
  };

  // ==========================================
  // 4. LOGIC XỬ LÝ NHÂN VIÊN
  // ==========================================
  const handleOpenEmpModal = (emp: any = null) => {
    setSelectedEmp(emp);
    setEmpFormTab("personal"); 
    
    if (emp) {
      setEmpForm({
        employeeCode: emp.employeeCode || "",
        fullName: emp.fullName || "",
        email: emp.email || "",
        personalInfo: {
          dateOfBirth: formatDateForInput(emp.personalInfo?.dateOfBirth),
          gender: emp.personalInfo?.gender || "Khác",
          idCardIssueDate: formatDateForInput(emp.personalInfo?.idCardIssueDate),
          idCardIssuePlace: emp.personalInfo?.idCardIssuePlace || "",
          nationality: emp.personalInfo?.nationality || "Việt Nam",
          ethnicity: emp.personalInfo?.ethnicity || "",
          hometown: emp.personalInfo?.hometown || "",
          permanentAddress: emp.personalInfo?.permanentAddress || ""
        },
        workInfo: {
          department: emp.workInfo?.department || "",
          position: emp.workInfo?.position || "",
          title: emp.workInfo?.title || "",
          profession: emp.workInfo?.profession || "",
          jobDescription: emp.workInfo?.jobDescription || "",
          workingTime: emp.workInfo?.workingTime || "",
          equipmentProvided: emp.workInfo?.equipmentProvided || "",
          transportation: emp.workInfo?.transportation || ""
        },
        contractInfo: {
          contractNumber: emp.contractInfo?.contractNumber || "",
          contractType: emp.contractInfo?.contractType || "",
          signDate: formatDateForInput(emp.contractInfo?.signDate),
          endDate: formatDateForInput(emp.contractInfo?.endDate),
          probationStartDate: formatDateForInput(emp.contractInfo?.probationStartDate),
          probationEndDate: formatDateForInput(emp.contractInfo?.probationEndDate),
          compensationRegime: emp.contractInfo?.compensationRegime || ""
        },
        salaryAndBenefits: {
          taxCode: emp.salaryAndBenefits?.taxCode || "",
          socialInsuranceNumber: emp.salaryAndBenefits?.socialInsuranceNumber || "",
          insuranceSalary: emp.salaryAndBenefits?.insuranceSalary || 0,
          baseSalary: emp.salaryAndBenefits?.baseSalary || 0,
          paymentMethod: emp.salaryAndBenefits?.paymentMethod || "",
          paymentPeriod: emp.salaryAndBenefits?.paymentPeriod || "",
          allowances: {
            meal: emp.salaryAndBenefits?.allowances?.meal || 0,
            transport: emp.salaryAndBenefits?.allowances?.transport || 0,
            phone: emp.salaryAndBenefits?.allowances?.phone || 0,
            clothing: emp.salaryAndBenefits?.allowances?.clothing || 0,
            housing: emp.salaryAndBenefits?.allowances?.housing || 0,
            other: emp.salaryAndBenefits?.allowances?.other || 0,
          },
          bonuses: {
            general: emp.salaryAndBenefits?.bonuses?.general || 0,
            performance: emp.salaryAndBenefits?.bonuses?.performance || 0,
          }
        },
        status: emp.status || "active"
      });
    } else {
      setEmpForm(initialEmpForm);
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedEmp ? `${API_BASE_URL}/employees/${selectedEmp._id}` : `${API_BASE_URL}/employees`;
    const method = selectedEmp ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(empForm),
      });
      if (res.ok) {
        setIsEmpModalOpen(false);
        fetchData();
      } else {
        alert((await res.json()).message || "Có lỗi khi lưu nhân viên!");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteEmp = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  // Mảng nhân viên đã được lọc (nếu có chọn phòng ban)
  const displayedEmployees = deptFilter 
    ? employees.filter(emp => emp.workInfo?.department === deptFilter)
    : employees;

  if (isLoading) return <Loader />;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10 relative">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Hệ thống Nhân sự (HRM)</h2>
        <p className="text-muted-foreground">Quản lý cơ cấu phòng ban và hồ sơ nhân viên của công ty.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="departments" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Phòng ban</TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2"><Users className="w-4 h-4" /> Nhân viên</TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* TAB 1: PHÒNG BAN */}
        {/* ========================================== */}
        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div><h3 className="text-lg font-semibold">Danh sách Phòng ban</h3></div>
            <Button onClick={() => handleOpenDeptModal(null)} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="size-4 mr-2" /> Thêm phòng ban
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <Card key={dept._id} className="relative hover:shadow-md transition-all border-slate-200">
                <CardHeader className="pb-3">
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDeptModal(dept)} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4 text-blue-600" /> Sửa</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteDept(dept._id)} className="cursor-pointer text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: dept.color || "#3b82f6" }}>
                      {dept.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{dept.description || "Không có mô tả"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Sĩ số: <strong className="text-slate-900">{getEmployeeCount(dept.name)}</strong> người</span>
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={() => handleViewEmployeesInDept(dept.name)}>
                      Xem danh sách &rarr;
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {departments.length === 0 && <div className="col-span-full"><NoDataFound title="Chưa có phòng ban" description="" buttonText="Tạo mới" buttonAction={() => handleOpenDeptModal(null)} /></div>}
          </div>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 2: NHÂN VIÊN */}
        {/* ========================================== */}
        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Hồ sơ Nhân sự</h3>
                {deptFilter && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer flex items-center gap-1 border-blue-200" onClick={() => setDeptFilter(null)}>
                    <Filter className="w-3 h-3" /> Lọc: {deptFilter} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Hiển thị {displayedEmployees.length} nhân sự {deptFilter ? `thuộc phòng ${deptFilter}` : "toàn công ty"}.
              </p>
            </div>
            <Button onClick={() => handleOpenEmpModal(null)} className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="size-4 mr-2" /> Thêm nhân viên
            </Button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã NV</TableHead>
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Chức danh</TableHead>
                  <TableHead>Lương CB</TableHead>
                  <TableHead>Ngày vào làm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedEmployees.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell className="font-medium text-blue-600">{emp.employeeCode}</TableCell>
                    <TableCell className="font-semibold">{emp.fullName}</TableCell>
                    <TableCell>{emp.workInfo?.department || "Chưa xếp"}</TableCell>
                    <TableCell>{emp.workInfo?.position || "N/A"}</TableCell>
                    <TableCell>{emp.salaryAndBenefits?.baseSalary ? emp.salaryAndBenefits.baseSalary.toLocaleString('vi-VN') + " đ" : "0 đ"}</TableCell>
                    <TableCell>{formatDateForDisplay(emp.contractInfo?.signDate)}</TableCell>
                    <TableCell>
                      {emp.status === "active" ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">Chính thức</Badge> : 
                       emp.status === "probation" ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Thử việc</Badge> :
                       emp.status === "on_leave" ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">Nghỉ phép</Badge> :
                       <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200">Đã nghỉ</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEmpModal(emp)} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4 text-blue-600" /> Sửa & Xem chi tiết</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteEmp(emp._id)} className="cursor-pointer text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {displayedEmployees.length === 0 && <div className="py-8"><NoDataFound title="Không có dữ liệu" description="Chưa có nhân viên nào phù hợp." buttonText="Thêm mới" buttonAction={() => handleOpenEmpModal(null)} /></div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================== */}
      {/* DIALOG FORM PHÒNG BAN */}
      {/* ========================================== */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedDept ? "Sửa Phòng Ban" : "Thêm Phòng Ban"}</h3>
              <button type="button" onClick={() => setIsDeptModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên phòng ban</label>
                <input required type="text" className="w-full border rounded-md p-2" value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} placeholder="VD: Phòng IT"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea className="w-full border rounded-md p-2" value={deptForm.description} onChange={(e) => setDeptForm({...deptForm, description: e.target.value})} placeholder="Mô tả chức năng..."/>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Lưu lại</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DIALOG FORM NHÂN VIÊN (DẠNG FULL TABS) */}
      {/* ========================================== */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h3 className="text-xl font-bold">{selectedEmp ? `Sửa hồ sơ: ${empForm.fullName}` : "Thêm Nhân Viên Mới"}</h3>
              <button type="button" onClick={() => setIsEmpModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
            </div>

            {/* Custom Form Tabs Control */}
            <div className="flex px-6 pt-4 gap-2 border-b shrink-0 bg-slate-50">
              <button 
                type="button" 
                onClick={() => setEmpFormTab("personal")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "personal" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Info className="w-4 h-4" /> Định danh & Cá nhân
              </button>
              <button 
                type="button" 
                onClick={() => setEmpFormTab("work")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "work" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <FileText className="w-4 h-4" /> Công việc & Hợp đồng
              </button>
              <button 
                type="button" 
                onClick={() => setEmpFormTab("salary")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "salary" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <DollarSign className="w-4 h-4" /> Lương, Phụ cấp & BHXH
              </button>
            </div>

            {/* Body Scrollable Area */}
            <form id="employee-form" onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto flex-1">
              
              {/* === TAB 1: THÔNG TIN CÁ NHÂN === */}
              {empFormTab === "personal" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium mb-1 text-blue-600">CMT - Mã NV *</label>
    <input
      required
      type="text"
      className="w-full border rounded-md p-2"
      value={empForm.employeeCode}
      onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1 text-blue-600">Họ và tên *</label>
    <input
      required
      type="text"
      className="w-full border rounded-md p-2"
      value={empForm.fullName}
      onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
    />
  </div>
                </div>

                {/* ✅ EMAIL */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-600">Email *</label>
                  <input
                    required  
                    type="email"
                    className="w-full border rounded-md p-2"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="example@gmail.com"
                  />
                </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.dateOfBirth} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, dateOfBirth: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Giới tính</label>
                      <select className="w-full border rounded-md p-2" value={empForm.personalInfo.gender} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, gender: e.target.value}})}>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Trạng thái nhân sự *</label>
                      <select className="w-full border rounded-md p-2 font-medium" value={empForm.status} onChange={(e) => setEmpForm({...empForm, status: e.target.value})}>
                        <option value="active">Chính thức (Active)</option>
                        <option value="probation">Thử việc (Probation)</option>
                        <option value="on_leave">Nghỉ phép (On leave)</option>
                        <option value="resigned">Đã nghỉ việc (Resigned)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày cấp CMT/CCCD</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssueDate} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssueDate: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nơi cấp</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssuePlace} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssuePlace: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quốc tịch</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.nationality} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, nationality: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dân tộc</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.ethnicity} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, ethnicity: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nguyên quán</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.hometown} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, hometown: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.permanentAddress} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: e.target.value}})}/>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: CÔNG VIỆC & HỢP ĐỒNG === */}
              {empFormTab === "work" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">Thông tin công việc</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bộ phận (Phòng ban)</label>
                      <select className="w-full border rounded-md p-2" value={empForm.workInfo.department} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, department: e.target.value}})}>
                        <option value="">-- Chọn phòng ban --</option>
                        {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nghề nghiệp</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.profession} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, profession: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Chức vụ</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.position} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, position: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Chức danh</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.title} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, title: e.target.value}})}/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mô tả công việc</label>
                    <textarea className="w-full border rounded-md p-2" value={empForm.workInfo.jobDescription} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, jobDescription: e.target.value}})}/>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Thời gian làm việc</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.workingTime} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, workingTime: e.target.value}})} placeholder="VD: Hành chính"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Trang thiết bị cung cấp</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.equipmentProvided} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, equipmentProvided: e.target.value}})} placeholder="VD: Laptop, Chuột"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phương tiện đi lại</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.transportation} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, transportation: e.target.value}})}/>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Thông tin hợp đồng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Số HĐLĐ</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.contractNumber} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractNumber: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Loại HĐ</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.contractType} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractType: e.target.value}})} placeholder="VD: Không xác định thời hạn"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Chế độ bồi thường</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.compensationRegime} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, compensationRegime: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày ký HĐ</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.signDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, signDate: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày kết thúc HĐ</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.endDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, endDate: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày bắt đầu thử việc</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationStartDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationStartDate: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày kết thúc thử việc</label>
                      <input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationEndDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationEndDate: e.target.value}})}/>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 3: LƯƠNG & PHỤ CẤP === */}
              {empFormTab === "salary" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">Lương & Bảo hiểm</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mã số thuế</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.taxCode} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, taxCode: e.target.value}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sổ BHXH</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.socialInsuranceNumber} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, socialInsuranceNumber: e.target.value}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Lương cơ bản (VNĐ)</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.baseSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, baseSalary: Number(e.target.value)}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lương tham gia BH (VNĐ)</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.insuranceSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, insuranceSalary: Number(e.target.value)}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Hình thức trả lương</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.paymentMethod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentMethod: e.target.value}})} placeholder="VD: Chuyển khoản"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Thời gian trả lương</label>
                      <input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.paymentPeriod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentPeriod: e.target.value}})} placeholder="VD: Mùng 5 hàng tháng"/>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Phụ cấp & Thưởng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tiền ăn ca</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.meal} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, meal: Number(e.target.value)}}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Xăng xe</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.transport} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, transport: Number(e.target.value)}}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Điện thoại</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.phone} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, phone: Number(e.target.value)}}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Trang phục</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.clothing} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, clothing: Number(e.target.value)}}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nhà ở</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.housing} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, housing: Number(e.target.value)}}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phụ cấp khác</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.other} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, other: Number(e.target.value)}}})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tiền thưởng</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.general} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, general: Number(e.target.value)}}})}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Thưởng năng lực</label>
                      <input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.performance} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, performance: Number(e.target.value)}}})}/>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Footer Modal - Nút Lưu */}
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsEmpModalOpen(false)}>Hủy bỏ</Button>
              <Button type="submit" form="employee-form" className="bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}