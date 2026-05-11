import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Users, Building2, UserPlus, Briefcase, 
  MoreHorizontal, Pencil, Trash2, X, Info, FileText, DollarSign,
  Filter, Upload, CheckCircle2, ChevronLeft, ChevronRight, Settings2, RotateCcw, Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/hrm`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const formatDateForInput = (isoString?: string) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().split('T')[0];
};

const formatDateForDisplay = (isoString?: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// ==========================================
// ĐỊNH NGHĨA 41 TRƯỜNG DỮ LIỆU ĐỂ MAP ĐỘNG
// ==========================================
const ALL_FIELDS = [
  { id: "employeeCode", label: "Mã NV (*)", path: "employeeCode", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "fullName", label: "Họ Tên (*)", path: "fullName", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "email", label: "Email (*)", path: "email", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "status", label: "Trạng thái", path: "status", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "dateOfBirth", label: "Ngày sinh", path: "personalInfo.dateOfBirth", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "gender", label: "Giới tính", path: "personalInfo.gender", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "idCardIssueDate", label: "Ngày cấp CMT", path: "personalInfo.idCardIssueDate", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "idCardIssuePlace", label: "Nơi cấp", path: "personalInfo.idCardIssuePlace", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "nationality", label: "Quốc tịch", path: "personalInfo.nationality", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "ethnicity", label: "Dân tộc", path: "personalInfo.ethnicity", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "hometown", label: "Nguyên quán", path: "personalInfo.hometown", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "permanentAddress", label: "Địa chỉ TT", path: "personalInfo.permanentAddress", type: "string", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "department", label: "Phòng ban", path: "workInfo.department", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "position", label: "Chức vụ", path: "workInfo.position", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "title", label: "Chức danh", path: "workInfo.title", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "profession", label: "Nghề nghiệp", path: "workInfo.profession", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "jobDescription", label: "Mô tả CV", path: "workInfo.jobDescription", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "workingTime", label: "Thời gian LV", path: "workInfo.workingTime", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "equipmentProvided", label: "Thiết bị", path: "workInfo.equipmentProvided", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "transportation", label: "Phương tiện", path: "workInfo.transportation", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "contractNumber", label: "Số HĐ", path: "contractInfo.contractNumber", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "contractType", label: "Loại HĐ", path: "contractInfo.contractType", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "signDate", label: "Ngày ký", path: "contractInfo.signDate", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "endDate", label: "Ngày KT", path: "contractInfo.endDate", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "probationStartDate", label: "BĐ Thử việc", path: "contractInfo.probationStartDate", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "probationEndDate", label: "KT Thử việc", path: "contractInfo.probationEndDate", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "compensationRegime", label: "Chế độ BT", path: "contractInfo.compensationRegime", type: "string", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "taxCode", label: "Mã Số Thuế", path: "salaryAndBenefits.taxCode", type: "string", color: "bg-green-50 text-green-800 border-green-200" },
  { id: "socialInsuranceNumber", label: "Số BHXH", path: "salaryAndBenefits.socialInsuranceNumber", type: "string", color: "bg-green-50 text-green-800 border-green-200" },
  { id: "baseSalary", label: "Lương CB", path: "salaryAndBenefits.baseSalary", type: "number", color: "bg-green-100 text-green-900 border-green-300 font-bold" },
  { id: "insuranceSalary", label: "Lương BH", path: "salaryAndBenefits.insuranceSalary", type: "number", color: "bg-green-50 text-green-800 border-green-200" },
  { id: "paymentMethod", label: "HT Trả Lương", path: "salaryAndBenefits.paymentMethod", type: "string", color: "bg-green-50 text-green-800 border-green-200" },
  { id: "paymentPeriod", label: "Kỳ Trả Lương", path: "salaryAndBenefits.paymentPeriod", type: "string", color: "bg-green-50 text-green-800 border-green-200" },
  { id: "meal", label: "PC Ăn ca", path: "salaryAndBenefits.allowances.meal", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "transport", label: "PC Xăng", path: "salaryAndBenefits.allowances.transport", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "phone", label: "PC Đ.Thoại", path: "salaryAndBenefits.allowances.phone", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "clothing", label: "PC Tr.Phục", path: "salaryAndBenefits.allowances.clothing", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "housing", label: "PC Nhà ở", path: "salaryAndBenefits.allowances.housing", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "other", label: "PC Khác", path: "salaryAndBenefits.allowances.other", type: "number", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "generalBonus", label: "Thưởng", path: "salaryAndBenefits.bonuses.general", type: "number", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { id: "performanceBonus", label: "Thưởng NL", path: "salaryAndBenefits.bonuses.performance", type: "number", color: "bg-teal-50 text-teal-800 border-teal-200" }
];

export default function HRMDashboard() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("departments");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empFormTab, setEmpFormTab] = useState("personal"); 

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importColumns, setImportColumns] = useState([...ALL_FIELDS]); 
  const [showAddColumnSelect, setShowAddColumnSelect] = useState(false);
  
  const [previewRows, setPreviewRows] = useState<any[]>([]); 
  const [step, setStep] = useState<1 | 2>(1); 

  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3b82f6" });
  
  const initialEmpForm = {
    employeeCode: "", fullName: "", email: "", status: "active",
    personalInfo: { dateOfBirth: "", gender: "Khác", idCardIssueDate: "", idCardIssuePlace: "", nationality: "Việt Nam", ethnicity: "", hometown: "", permanentAddress: "" },
    workInfo: { department: "", position: "", title: "", profession: "", jobDescription: "", workingTime: "", equipmentProvided: "", transportation: "" },
    contractInfo: { contractNumber: "", contractType: "", signDate: "", endDate: "", probationStartDate: "", probationEndDate: "", compensationRegime: "" },
    salaryAndBenefits: {
      taxCode: "", socialInsuranceNumber: "", insuranceSalary: 0, baseSalary: 0, paymentMethod: "", paymentPeriod: "",
      allowances: { meal: 0, transport: 0, phone: 0, clothing: 0, housing: 0, other: 0 },
      bonuses: { general: 0, performance: 0 }
    }
  };

  const [empForm, setEmpForm] = useState(initialEmpForm);

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

  const getEmployeeCount = (deptName: string) => employees.filter(emp => emp.workInfo?.department === deptName).length;

  const handleOpenDeptModal = (dept: any = null) => {
    setSelectedDept(dept);
    setDeptForm(dept ? { name: dept.name, description: dept.description, color: dept.color } : { name: "", description: "", color: "#3b82f6" });
    setIsDeptModalOpen(true);
  };

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

  const handleViewEmployeesInDept = (deptName: string) => { setDeptFilter(deptName); setActiveTab("employees"); };

  const handleOpenEmpModal = (emp: any = null) => {
    setSelectedEmp(emp); setEmpFormTab("personal"); 
    if (emp) {
      setEmpForm({
        employeeCode: emp.employeeCode || "", fullName: emp.fullName || "", email: emp.email || "", status: emp.status || "active",
        personalInfo: {
          dateOfBirth: formatDateForInput(emp.personalInfo?.dateOfBirth), gender: emp.personalInfo?.gender || "Khác", idCardIssueDate: formatDateForInput(emp.personalInfo?.idCardIssueDate),
          idCardIssuePlace: emp.personalInfo?.idCardIssuePlace || "", nationality: emp.personalInfo?.nationality || "Việt Nam", ethnicity: emp.personalInfo?.ethnicity || "",
          hometown: emp.personalInfo?.hometown || "", permanentAddress: emp.personalInfo?.permanentAddress || ""
        },
        workInfo: { department: emp.workInfo?.department || "", position: emp.workInfo?.position || "", title: emp.workInfo?.title || "", profession: emp.workInfo?.profession || "", jobDescription: emp.workInfo?.jobDescription || "", workingTime: emp.workInfo?.workingTime || "", equipmentProvided: emp.workInfo?.equipmentProvided || "", transportation: emp.workInfo?.transportation || "" },
        contractInfo: { contractNumber: emp.contractInfo?.contractNumber || "", contractType: emp.contractInfo?.contractType || "", signDate: formatDateForInput(emp.contractInfo?.signDate), endDate: formatDateForInput(emp.contractInfo?.endDate), probationStartDate: formatDateForInput(emp.contractInfo?.probationStartDate), probationEndDate: formatDateForInput(emp.contractInfo?.probationEndDate), compensationRegime: emp.contractInfo?.compensationRegime || "" },
        salaryAndBenefits: {
          taxCode: emp.salaryAndBenefits?.taxCode || "", socialInsuranceNumber: emp.salaryAndBenefits?.socialInsuranceNumber || "", insuranceSalary: emp.salaryAndBenefits?.insuranceSalary || 0, baseSalary: emp.salaryAndBenefits?.baseSalary || 0, paymentMethod: emp.salaryAndBenefits?.paymentMethod || "", paymentPeriod: emp.salaryAndBenefits?.paymentPeriod || "",
          allowances: { meal: emp.salaryAndBenefits?.allowances?.meal || 0, transport: emp.salaryAndBenefits?.allowances?.transport || 0, phone: emp.salaryAndBenefits?.allowances?.phone || 0, clothing: emp.salaryAndBenefits?.allowances?.clothing || 0, housing: emp.salaryAndBenefits?.allowances?.housing || 0, other: emp.salaryAndBenefits?.allowances?.other || 0 },
          bonuses: { general: emp.salaryAndBenefits?.bonuses?.general || 0, performance: emp.salaryAndBenefits?.bonuses?.performance || 0 }
        }
      });
    } else setEmpForm(initialEmpForm);
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedEmp ? `${API_BASE_URL}/employees/${selectedEmp._id}` : `${API_BASE_URL}/employees`;
    try {
      const res = await fetch(url, { method: selectedEmp ? "PUT" : "POST", headers: getAuthHeaders(), body: JSON.stringify(empForm) });
      if (res.ok) { setIsEmpModalOpen(false); fetchData(); } else alert((await res.json()).message);
    } catch (error) { console.error(error); }
  };

  const handleDeleteEmp = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try { const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: "DELETE", headers: getAuthHeaders() }); if (res.ok) fetchData(); } catch (error) { console.error(error); }
  };

  // ==========================================
  // LOGIC ĐIỀU KHIỂN CỘT IMPORT
  // ==========================================
  const moveColumn = (index: number, direction: number) => {
    const newCols = [...importColumns];
    if (direction === -1 && index > 0) {
      [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
    } else if (direction === 1 && index < newCols.length - 1) {
      [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
    }
    setImportColumns(newCols);
  };

  const removeColumn = (index: number) => setImportColumns(importColumns.filter((_, i) => i !== index));

  const addColumn = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = e.target.value;
    if (!fieldId) return;
    const fieldToAdd = ALL_FIELDS.find(f => f.id === fieldId);
    if (fieldToAdd) { setImportColumns([...importColumns, fieldToAdd]); setShowAddColumnSelect(false); }
  };

  const resetColumns = () => { if(window.confirm("Reset cấu hình cột về mặc định (Tất cả 41 cột)?")) setImportColumns([...ALL_FIELDS]); };
  const missingFields = ALL_FIELDS.filter(f => !importColumns.find(ic => ic.id === f.id));

  // ==========================================
  // BƯỚC 1: DỊCH DỮ LIỆU & BẮT LỖI GIAO DIỆN
  // ==========================================
  const handleParseAndPreview = () => {
    if (!importData.trim()) return alert("Vui lòng dán dữ liệu!");
    if (importColumns.length === 0) return alert("Vui lòng cấu hình ít nhất 1 cột!");

    const rows = importData.split('\n').filter(row => row.trim() !== '');
    const parsedData: any[] = [];

    const parseDateVN = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    const parseStatus = (statusStr: string) => {
      if (!statusStr) return "active";
      const s = statusStr.toLowerCase().trim();
      if (s.includes("thử việc") || s.includes("probation")) return "probation";
      if (s.includes("nghỉ phép") || s.includes("leave")) return "on_leave";
      if (s.includes("đã nghỉ") || s.includes("resigned") || s.includes("thôi")) return "resigned";
      return "active";
    };

    rows.forEach((row, rowIndex) => {
      const cols = row.split('\t').map(col => col?.trim() || "");
      const newEmployee = JSON.parse(JSON.stringify(initialEmpForm));
      const errors: Record<string, string> = {}; 

      importColumns.forEach((colDef, idx) => {
        const val = cols[idx] || "";
        const keys = colDef.path.split('.');
        let currentObj = newEmployee;
        
        for (let i = 0; i < keys.length - 1; i++) {
          currentObj = currentObj[keys[i]];
        }
        const lastKey = keys[keys.length - 1];

        if (colDef.id === 'status') {
            currentObj[lastKey] = parseStatus(val);
        } else if (val === "") {
            if (colDef.type === 'number' || colDef.id.toLowerCase().includes('date')) currentObj[lastKey] = null;
            else currentObj[lastKey] = "";
        } else if (colDef.type === 'number') {
            const num = Number(val.replace(/[^0-9]/g, ''));
            if (isNaN(num)) errors[colDef.path] = "Phải là số hợp lệ";
            currentObj[lastKey] = num;
        } else if (colDef.id.toLowerCase().includes('date')) {
            const date = parseDateVN(val);
            if (val && (!date || isNaN(new Date(date).getTime()))) errors[colDef.path] = "Ngày sai (DD/MM/YYYY)";
            currentObj[lastKey] = date;
        } else {
            currentObj[lastKey] = val;
        }
      });

      if (!newEmployee.employeeCode) errors["employeeCode"] = "Mã NV là bắt buộc";
      if (!newEmployee.fullName) errors["fullName"] = "Họ tên là bắt buộc";
      if (!newEmployee.email) errors["email"] = "Email là bắt buộc";
      else if (!/^\S+@\S+\.\S+$/.test(newEmployee.email)) errors["email"] = "Email không đúng định dạng";

      // Đánh dấu isSuccess = false để quản lý tiến trình gửi
      parsedData.push({ id: rowIndex, data: newEmployee, errors, isSuccess: false });
    });

    setPreviewRows(parsedData);
    setStep(2); 
  };

  const handleUpdateCell = (rowIndex: number, path: string, newValue: string) => {
    setPreviewRows(prev => {
      const newRows = [...prev];
      const row = { ...newRows[rowIndex], data: JSON.parse(JSON.stringify(newRows[rowIndex].data)), errors: { ...newRows[rowIndex].errors } };
      
      const keys = path.split('.');
      let current = row.data;
      for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
      
      current[keys[keys.length - 1]] = newValue;
      delete row.errors[path]; 
      
      newRows[rowIndex] = row;
      return newRows;
    });
  };

  // ==========================================
  // BƯỚC 2: GỬI DB & XỬ LÝ LỖI TRÙNG MÃ (RETRY LẬP TỨC)
  // ==========================================
  const handleSubmitValidatedData = async () => {
    const hasErrors = previewRows.some(row => Object.keys(row.errors).length > 0 && !row.isSuccess);
    if (hasErrors) return alert("Vẫn còn ô dữ liệu bị lỗi (màu đỏ). Vui lòng sửa hết trước khi lưu!");

    setIsImporting(true);
    let successCount = 0; 
    let hasBackendErrors = false;
    
    // Tạo bản sao để cập nhật lỗi từ Backend nếu có
    const updatedRows = [...previewRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      if (row.isSuccess) continue; // Bỏ qua dòng đã lưu thành công trước đó

      try {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(row.data),
        });

        if (res.ok) {
          successCount++;
          updatedRows[i].isSuccess = true; // Khóa dòng này lại thành màu xanh
        } else {
          hasBackendErrors = true;
          updatedRows[i].errors["employeeCode"] = "Mã NV đã tồn tại hoặc lỗi Server";
        }
      } catch (error) { 
        hasBackendErrors = true;
        updatedRows[i].errors["employeeCode"] = "Lỗi kết nối Server";
      }
    }

    setIsImporting(false);

    if (hasBackendErrors) {
      setPreviewRows(updatedRows);
      alert(`Đã lưu ${successCount} nhân sự. Có một số dòng bị trùng Mã NV từ Database. Vui lòng sửa ô bôi đỏ và bấm Lưu lại!`);
    } else {
      alert(`Hoàn tất! Đã lưu toàn bộ thành công.`);
      setIsImportModalOpen(false);
      setStep(1);
      setPreviewRows([]);
      setImportData("");
      fetchData();
    }
  };

  const displayedEmployees = deptFilter ? employees.filter(emp => emp.workInfo?.department === deptFilter) : employees;

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

        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div><h3 className="text-lg font-semibold">Danh sách Phòng ban</h3></div>
            <Button onClick={() => handleOpenDeptModal(null)} className="bg-blue-600 hover:bg-blue-700"><PlusCircle className="size-4 mr-2" /> Thêm phòng ban</Button>
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: dept.color || "#3b82f6" }}>{dept.name.charAt(0)}</div>
                    <div><CardTitle className="text-lg">{dept.name}</CardTitle><CardDescription className="line-clamp-1">{dept.description || "Không có mô tả"}</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4" /><span className="text-sm font-medium">Sĩ số: <strong className="text-slate-900">{getEmployeeCount(dept.name)}</strong> người</span></div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={() => handleViewEmployeesInDept(dept.name)}>Xem danh sách &rarr;</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {departments.length === 0 && <div className="col-span-full"><NoDataFound title="Chưa có phòng ban" description="" buttonText="Tạo mới" buttonAction={() => handleOpenDeptModal(null)} /></div>}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Hồ sơ Nhân sự</h3>
                {deptFilter && (<Badge variant="secondary" className="bg-blue-100 text-blue-700 cursor-pointer flex items-center gap-1 border-blue-200" onClick={() => setDeptFilter(null)}><Filter className="w-3 h-3" /> Lọc: {deptFilter} <X className="w-3 h-3 ml-1" /></Badge>)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Hiển thị {displayedEmployees.length} nhân sự {deptFilter ? `thuộc phòng ${deptFilter}` : "toàn công ty"}.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="border-teal-600 text-teal-600 hover:bg-teal-50"><Upload className="size-4 mr-2" /> Nhập từ Excel</Button>
              <Button onClick={() => handleOpenEmpModal(null)} className="bg-teal-600 hover:bg-teal-700"><UserPlus className="size-4 mr-2" /> Thêm nhân viên</Button>
            </div>
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã NV</TableHead><TableHead>Họ Tên</TableHead><TableHead>Phòng ban</TableHead><TableHead>Chức danh</TableHead><TableHead>Lương CB</TableHead><TableHead>Ngày vào làm</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedEmployees.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell className="font-medium text-blue-600">{emp.employeeCode}</TableCell><TableCell className="font-semibold">{emp.fullName}</TableCell><TableCell>{emp.workInfo?.department || "Chưa xếp"}</TableCell><TableCell>{emp.workInfo?.position || "N/A"}</TableCell>
                    <TableCell>{emp.salaryAndBenefits?.baseSalary ? emp.salaryAndBenefits.baseSalary.toLocaleString('vi-VN') + " đ" : "0 đ"}</TableCell><TableCell>{formatDateForDisplay(emp.contractInfo?.signDate)}</TableCell>
                    <TableCell>
                      {emp.status === "active" ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Chính thức</Badge> : emp.status === "probation" ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Thử việc</Badge> : emp.status === "on_leave" ? <Badge className="bg-amber-100 text-amber-700 border-amber-200">Nghỉ phép</Badge> : <Badge className="bg-rose-100 text-rose-700 border-rose-200">Đã nghỉ</Badge>}
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

      {/* DIALOG FORM PHÒNG BAN */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{selectedDept ? "Sửa Phòng Ban" : "Thêm Phòng Ban"}</h3><button type="button" onClick={() => setIsDeptModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button></div>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tên phòng ban</label><input required type="text" className="w-full border rounded-md p-2" value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} placeholder="VD: Phòng IT"/></div>
              <div><label className="block text-sm font-medium mb-1">Mô tả</label><textarea className="w-full border rounded-md p-2" value={deptForm.description} onChange={(e) => setDeptForm({...deptForm, description: e.target.value})} placeholder="Mô tả chức năng..."/></div>
              <div className="flex justify-end gap-2 mt-6"><Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Hủy</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">Lưu lại</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG FORM NHÂN VIÊN */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b shrink-0"><h3 className="text-xl font-bold">{selectedEmp ? `Sửa hồ sơ: ${empForm.fullName}` : "Thêm Nhân Viên Mới"}</h3><button type="button" onClick={() => setIsEmpModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button></div>
            <div className="flex px-6 pt-4 gap-2 border-b shrink-0 bg-slate-50">
              <button type="button" onClick={() => setEmpFormTab("personal")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "personal" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Info className="w-4 h-4" /> Định danh & Cá nhân</button>
              <button type="button" onClick={() => setEmpFormTab("work")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "work" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><FileText className="w-4 h-4" /> Công việc & Hợp đồng</button>
              <button type="button" onClick={() => setEmpFormTab("salary")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "salary" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><DollarSign className="w-4 h-4" /> Lương, Phụ cấp & BHXH</button>
            </div>
            <form id="employee-form" onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {empFormTab === "personal" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1 text-blue-600">CMT - Mã NV *</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.employeeCode} onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}/></div>
                    <div><label className="block text-sm font-medium mb-1 text-blue-600">Họ và tên *</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.fullName} onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}/></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1 text-blue-600">Email *</label><input required type="email" className="w-full border rounded-md p-2" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} placeholder="example@gmail.com"/></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày sinh</label><input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.dateOfBirth} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, dateOfBirth: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Giới tính</label><select className="w-full border rounded-md p-2" value={empForm.personalInfo.gender} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, gender: e.target.value}})}><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Trạng thái nhân sự</label><select className="w-full border rounded-md p-2 font-medium" value={empForm.status} onChange={(e) => setEmpForm({...empForm, status: e.target.value})}><option value="active">Chính thức (Active)</option><option value="probation">Thử việc (Probation)</option><option value="on_leave">Nghỉ phép (On leave)</option><option value="resigned">Đã nghỉ việc (Resigned)</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày cấp CMT/CCCD</label><input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssueDate} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssueDate: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Nơi cấp</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssuePlace} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssuePlace: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Quốc tịch</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.nationality} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, nationality: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Dân tộc</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.ethnicity} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, ethnicity: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Nguyên quán</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.hometown} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, hometown: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.permanentAddress} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: e.target.value}})}/></div>
                  </div>
                </div>
              )}
              {/* TAB 2: CÔNG VIỆC & HỢP ĐỒNG */}
              {empFormTab === "work" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">Thông পুরা tin công việc</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Bộ phận (Phòng ban)</label><select className="w-full border rounded-md p-2" value={empForm.workInfo.department} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, department: e.target.value}})}><option value="">-- Chọn phòng ban --</option>{departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Nghề nghiệp</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.profession} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, profession: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Chức vụ</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.position} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, position: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Chức danh</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.title} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, title: e.target.value}})}/></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Mô tả công việc</label><textarea className="w-full border rounded-md p-2" value={empForm.workInfo.jobDescription} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, jobDescription: e.target.value}})}/></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Thời gian làm việc</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.workingTime} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, workingTime: e.target.value}})} placeholder="VD: Hành chính"/></div>
                    <div><label className="block text-sm font-medium mb-1">Trang thiết bị cung cấp</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.equipmentProvided} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, equipmentProvided: e.target.value}})} placeholder="VD: Laptop, Chuột"/></div>
                    <div><label className="block text-sm font-medium mb-1">Phương tiện đi lại</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.transportation} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, transportation: e.target.value}})}/></div>
                  </div>
                  <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Thông tin hợp đồng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Số HĐLĐ</label><input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.contractNumber} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractNumber: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Loại HĐ</label><input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.contractType} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractType: e.target.value}})} placeholder="VD: Không xác định thời hạn"/></div>
                    <div><label className="block text-sm font-medium mb-1">Chế độ bồi thường</label><input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.compensationRegime} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, compensationRegime: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày ký HĐ</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.signDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, signDate: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Ngày kết thúc HĐ</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.endDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, endDate: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày bắt đầu thử việc</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationStartDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationStartDate: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Ngày kết thúc thử việc</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationEndDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationEndDate: e.target.value}})}/></div>
                  </div>
                </div>
              )}
              {/* TAB 3: LƯƠNG & PHỤ CẤP */}
              {empFormTab === "salary" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">Lương & Bảo hiểm</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Mã số thuế</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.taxCode} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, taxCode: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Sổ BHXH</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.socialInsuranceNumber} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, socialInsuranceNumber: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Lương cơ bản (VNĐ)</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.baseSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, baseSalary: Number(e.target.value)}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Lương tham gia BH (VNĐ)</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.insuranceSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, insuranceSalary: Number(e.target.value)}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Hình thức trả lương</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.paymentMethod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentMethod: e.target.value}})} placeholder="VD: Chuyển khoản"/></div>
                    <div><label className="block text-sm font-medium mb-1">Thời gian trả lương</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.paymentPeriod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentPeriod: e.target.value}})} placeholder="VD: Mùng 5 hàng tháng"/></div>
                  </div>
                  <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Phụ cấp & Thưởng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Tiền ăn ca</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.meal} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, meal: Number(e.target.value)}}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Xăng xe</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.transport} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, transport: Number(e.target.value)}}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Điện thoại</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.phone} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, phone: Number(e.target.value)}}})}/></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Trang phục</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.clothing} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, clothing: Number(e.target.value)}}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Nhà ở</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.housing} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, housing: Number(e.target.value)}}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Phụ cấp khác</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.allowances.other} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, allowances: {...empForm.salaryAndBenefits.allowances, other: Number(e.target.value)}}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Tiền thưởng</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.general} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, general: Number(e.target.value)}}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Thưởng năng lực</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.performance} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, performance: Number(e.target.value)}}})}/></div>
                  </div>
                </div>
              )}
            </form>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0"><Button type="button" variant="outline" onClick={() => setIsEmpModalOpen(false)}>Hủy bỏ</Button><Button type="submit" form="employee-form" className="bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</Button></div>
          </div>
        </div>
      )}

      {/* DIALOG FORM IMPORT ĐỘNG (2 BƯỚC) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Settings2 className="w-5 h-5 text-teal-600"/> Cấu hình & Nhập dữ liệu thông minh</h3>
                <p className="text-sm text-muted-foreground mt-1">Sắp xếp các cột bên dưới cho khớp với thứ tự các cột trong file Excel của bạn trước khi Copy & Paste.</p>
              </div>
              <button type="button" onClick={() => { setIsImportModalOpen(false); setStep(1); setPreviewRows([]); }} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
              {step === 1 ? (
                <>
                  {/* KHU VỰC QUẢN LÝ CỘT */}
                  <div className="mb-6 bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-slate-800">Thứ tự cột Excel hiện tại ({importColumns.length} cột)</span>
                      <div className="flex items-center gap-2">
                        {showAddColumnSelect ? (
                          <select className="border p-1.5 rounded text-sm w-48" onChange={addColumn} onBlur={() => setShowAddColumnSelect(false)}>
                            <option value="">-- Chọn trường cần thêm --</option>
                            {missingFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                          </select>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setShowAddColumnSelect(true)} disabled={missingFields.length === 0}>
                            <PlusCircle className="w-4 h-4 mr-1"/> Thêm cột
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={resetColumns}>
                          <RotateCcw className="w-4 h-4 mr-1"/> Reset mặc định
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 pt-2 custom-scrollbar items-center">
                      {importColumns.map((col, idx) => (
                        <div key={col.id} className={`flex-shrink-0 flex flex-col w-32 border rounded-lg overflow-hidden shadow-sm transition-all hover:-translate-y-1 ${col.color || 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                          <div className="p-2 text-center border-b border-inherit text-xs font-semibold h-10 flex items-center justify-center line-clamp-2">
                            {idx + 1}. {col.label}
                          </div>
                          <div className="flex justify-between items-center p-1 bg-white">
                            <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
                            <button onClick={() => removeColumn(idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3 h-3"/></button>
                            <button onClick={() => moveColumn(idx, 1)} disabled={idx === importColumns.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))}
                      {importColumns.length === 0 && <div className="text-sm text-slate-500 italic p-4">Bạn đã xoá hết các cột. Vui lòng thêm lại hoặc Reset!</div>}
                    </div>
                  </div>

                  {/* KHU VỰC PASTE DATA */}
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Dán dữ liệu vào đây (Bỏ qua dòng tiêu đề):</label>
                    <textarea 
                      className="w-full h-64 border rounded-md p-3 font-mono text-sm whitespace-pre focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="Chọn vùng dữ liệu trong Excel, ấn Ctrl+C rồi click vào đây ấn Ctrl+V..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                    ></textarea>
                  </div>
                </>
              ) : (
                // --- STEP 2: PREVIEW VÀ SỬA LỖI INLINE ---
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col h-full">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="font-semibold text-slate-800">Kiểm tra dữ liệu ({previewRows.length} dòng)</p>
                    <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                      Cảnh báo: Ô màu đỏ là dữ liệu không hợp lệ hoặc Trùng Mã NV
                    </Badge>
                  </div>
                  
                  <div className="overflow-auto border rounded-lg custom-scrollbar">
                    <Table className="w-max min-w-full">
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[50px] border-r">STT</TableHead>
                          {importColumns.map(col => (
                            <TableHead key={col.id} className="border-r whitespace-nowrap">{col.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell className="border-r font-medium text-center bg-slate-50">
                              {row.isSuccess ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : index + 1}
                            </TableCell>
                            {importColumns.map(col => {
                              const hasError = row.errors[col.path];
                              const keys = col.path.split('.');
                              let val = row.data;
                              for(let k of keys) val = val[k];
                              
                              return (
                                <TableCell key={col.id} className={`border-r p-0 ${hasError ? 'bg-rose-50' : ''} ${row.isSuccess ? 'bg-emerald-50 opacity-60' : ''}`}>
                                  <input 
                                    type="text" 
                                    disabled={row.isSuccess}
                                    className={`w-full min-w-[120px] p-2 text-sm outline-none bg-transparent transition-colors
                                      ${hasError ? 'border-[1.5px] border-rose-500 text-rose-900 focus:bg-white' : 'border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500'}
                                      ${row.isSuccess ? 'cursor-not-allowed' : ''}
                                    `}
                                    value={val || ""}
                                    title={hasError || ""}
                                    onChange={(e) => handleUpdateCell(index, col.path, e.target.value)}
                                  />
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-white flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => { setIsImportModalOpen(false); setStep(1); setPreviewRows([]); }} disabled={isImporting}>
                Hủy bỏ
              </Button>

              {step === 1 ? (
                <Button onClick={handleParseAndPreview} className="bg-blue-600 hover:bg-blue-700 shadow-md" disabled={!importData.trim() || importColumns.length === 0}>
                  Phân tích dữ liệu &rarr;
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep(1)} disabled={isImporting}>
                    &larr; Quay lại
                  </Button>
                  <Button 
                    onClick={handleSubmitValidatedData} 
                    className="bg-teal-600 hover:bg-teal-700 shadow-md" 
                    disabled={isImporting || previewRows.some(r => Object.keys(r.errors).length > 0 && !r.isSuccess) || previewRows.every(r => r.isSuccess)}
                  >
                    {isImporting ? "Đang lưu vào hệ thống..." : "Lưu vào hệ thống"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}