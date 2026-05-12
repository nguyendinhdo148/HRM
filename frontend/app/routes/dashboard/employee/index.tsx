import React, { useState, useEffect, useMemo } from "react";
import { 
  PlusCircle, Users, Building2, UserPlus, Briefcase, 
  MoreHorizontal, Pencil, Trash2, X, Info, FileText, DollarSign,
  Filter, Upload, CheckCircle2, ChevronLeft, ChevronRight, Settings2, RotateCcw, Check, Calendar, AlertTriangle, XCircle, Clock,
  Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { Input } from "@/components/ui/input";

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
// ĐỊNH NGHĨA MODEL & UI MAPPING (CODE SẠCH)
// ==========================================
const CONTRACT_TYPES = [
  { value: "PROBATION", label: "Thử việc" },
  { value: "FIXED_TERM", label: "Có thời hạn" },
  { value: "INDEFINITE", label: "Vô thời hạn" },
  { value: "FREELANCE", label: "Cộng tác viên / Thời vụ" },
  { value: "INTERNSHIP", label: "Thực tập sinh" },
];

const EMPLOYEE_STATUSES = [
  { value: "active", label: "Chính thức (Active)" },
  { value: "probation", label: "Thử việc (Probation)" },
  { value: "on_leave", label: "Nghỉ phép (On leave)" },
  { value: "resigned", label: "Đã nghỉ việc (Resigned)" },
];

// Mapping UI chuẩn cho Trạng thái nhân sự
const EMPLOYEE_STATUS_UI: Record<string, { label: string, color: string }> = {
  active: { label: "Chính thức", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  probation: { label: "Thử việc", color: "bg-blue-100 text-blue-700 border-blue-200" },
  on_leave: { label: "Nghỉ phép", color: "bg-amber-100 text-amber-700 border-amber-200" },
  resigned: { label: "Đã nghỉ", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

// Mapping UI cho Tình trạng Hợp đồng (Từ Backend)
const CONTRACT_STATUSES: Record<string, { label: string, color: string, icon: any }> = {
  CON_HAN: { label: "Còn hạn", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  HET_HAN: { label: "Đã hết hạn", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle },
  KHONG_THOI_HAN: { label: "Không thời hạn", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Briefcase },
  CHUA_XAC_DINH: { label: "Chưa xác định", color: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
  // Dự phòng cho các status cũ nếu DB còn sót
  HOP_LE: { label: "Hợp lệ", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  SAP_HET_HAN: { label: "Sắp hết hạn", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  DA_HET_HAN: { label: "Đã hết hạn", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  DANG_THU_VIEC: { label: "Đang thử việc", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  HET_HAN_THU_VIEC: { label: "Hết hạn thử việc", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle },
  DA_NGHI_VIEC: { label: "Đã nghỉ việc", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Briefcase },
};

const ALL_FIELDS = [
  { id: "employeeCode", label: "Mã NV (*)", path: "employeeCode", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "fullName", label: "Họ Tên (*)", path: "fullName", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "idCardNumber", label: "Số CCCD/CMND (*)", path: "idCardNumber", type: "string", color: "bg-amber-100 text-amber-900 border-amber-200" },
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
  { id: "joinDate", label: "Ngày vào làm", path: "workInfo.joinDate", type: "string", color: "bg-blue-50 text-blue-800 border-blue-200" },
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

  // MAIN TAB NAVIGATION
  const [activeTab, setActiveTab] = useState("departments");

  // FILTERS (Dùng chung cho cả tab Nhân sự và Hợp đồng)
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3b82f6" });

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empFormTab, setEmpFormTab] = useState("personal"); 

  // EXCEL IMPORT STATES
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importColumns, setImportColumns] = useState([...ALL_FIELDS]); 
  const [showAddColumnSelect, setShowAddColumnSelect] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]); 
  const [step, setStep] = useState<1 | 2>(1); 

  // STATES CHO THỜI HẠN HỢP ĐỒNG (THÁNG/NĂM)
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("years");

  const initialEmpForm = {
    employeeCode: "",idCardNumber: "", fullName: "", email: "", status: "active",
    personalInfo: { dateOfBirth: "", gender: "Khác", idCardIssueDate: "", idCardIssuePlace: "", nationality: "Việt Nam", ethnicity: "", hometown: "", permanentAddress: "" },
    workInfo: { department: "", position: "", title: "", profession: "", jobDescription: "", workingTime: "", equipmentProvided: "", transportation: "", joinDate: "", resignationDate: "" },
    contractInfo: { contractNumber: "", contractType: "PROBATION", contractDuration: "", signDate: "", endDate: "", probationStartDate: "", probationEndDate: "", compensationRegime: "" },
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

  // LOGIC TỰ ĐỘNG TÍNH NGÀY KẾT THÚC HỢP ĐỒNG VÀ GHÉP CHUỖI DURATION LƯU DB
  useEffect(() => {
    const { contractType, signDate } = empForm.contractInfo;
    if (contractType === "FIXED_TERM" && signDate && durationValue > 0) {
      const start = new Date(signDate);
      if (durationUnit === "months") {
        start.setMonth(start.getMonth() + durationValue);
      } else {
        start.setFullYear(start.getFullYear() + durationValue);
      }
      start.setDate(start.getDate() - 1); // Trừ 1 ngày
      
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

  // ==========================================
  // XỬ LÝ LỌC DỮ LIỆU CHUNG
  // ==========================================
  const processedEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = searchQuery === "" || 
        emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === null || emp.workInfo?.department === deptFilter;
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
      const matchesType = typeFilter === "all" || emp.contractInfo?.contractType === typeFilter;

      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });
  }, [employees, searchQuery, deptFilter, statusFilter, typeFilter]);

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
    setSelectedEmp(emp); 
    setEmpFormTab("personal"); 
    if (emp) {
      setEmpForm({
        ...initialEmpForm,
        employeeCode: emp.employeeCode || "", idCardNumber: emp.idCardNumber || "", fullName: emp.fullName || "", email: emp.email || "", status: emp.status || "active",
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

      // Nếu sửa HĐ cũ, cố gắng bóc tách durationValue và durationUnit từ chuỗi contractDuration
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

  // ==========================================
  // XỬ LÝ NHẬP EXCEL
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

  const resetColumns = () => { if(window.confirm("Reset cấu hình cột về mặc định?")) setImportColumns([...ALL_FIELDS]); };
  const missingFields = ALL_FIELDS.filter(f => !importColumns.find(ic => ic.id === f.id));

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

    const parseContractType = (typeStr: string) => {
      if (!typeStr) return "PROBATION";
      const s = typeStr.toLowerCase().trim();
      if (s.includes("thử việc") || s.includes("probation")) return "PROBATION";
      if (s.includes("vô") || s.includes("không xác định") || s.includes("indefinite")) return "INDEFINITE";
      if (s.includes("cộng tác") || s.includes("thời vụ") || s.includes("freelance")) return "FREELANCE";
      if (s.includes("thực tập") || s.includes("intern")) return "INTERNSHIP";
      return "FIXED_TERM"; 
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
        } else if (colDef.id === 'contractType') { 
            currentObj[lastKey] = parseContractType(val);
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
      if (!newEmployee.idCardNumber) errors["idCardNumber"] = "Số CCCD là bắt buộc";
      if (!newEmployee.email) errors["email"] = "Email là bắt buộc";
      else if (!/^\S+@\S+\.\S+$/.test(newEmployee.email)) errors["email"] = "Email sai định dạng";
      if (!newEmployee.workInfo.joinDate) errors["workInfo.joinDate"] = "Ngày vào làm (joinDate) là bắt buộc";

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

  const handleSubmitValidatedData = async () => {
    const hasErrors = previewRows.some(row => Object.keys(row.errors).length > 0 && !row.isSuccess);
    if (hasErrors) return alert("Vẫn còn ô dữ liệu bị lỗi (màu đỏ). Vui lòng sửa hết trước khi lưu!");

    setIsImporting(true);
    let successCount = 0; 
    let hasBackendErrors = false;
    const updatedRows = [...previewRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      if (row.isSuccess) continue; 

      try {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(row.data),
        });

        if (res.ok) {
          successCount++;
          updatedRows[i].isSuccess = true; 
        } else {
          hasBackendErrors = true;
          updatedRows[i].errors["employeeCode"] = "Mã NV bị trùng / Lỗi Server";
        }
      } catch (error) { 
        hasBackendErrors = true;
        updatedRows[i].errors["employeeCode"] = "Lỗi kết nối Server";
      }
    }

    setIsImporting(false);

    if (hasBackendErrors) {
      setPreviewRows(updatedRows);
      alert(`Đã lưu ${successCount} nhân sự. Có một số dòng bị trùng Mã NV hoặc thiếu ngày đi làm. Vui lòng sửa ô bôi đỏ và bấm Lưu lại!`);
    } else {
      alert(`Hoàn tất! Đã lưu toàn bộ thành công.`);
      setIsImportModalOpen(false);
      setStep(1);
      setPreviewRows([]);
      setImportData("");
      fetchData();
    }
  };

  if (isLoading) return <Loader />;

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

        {/* ========================================================= */}
        {/* TAB 1: DANH SÁCH PHÒNG BAN */}
        {/* ========================================================= */}
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

        {/* ========================================================= */}
        {/* TỔ HỢP BỘ LỌC DÙNG CHUNG CHO TAB NHÂN SỰ VÀ HỢP ĐỒNG */}
        {/* ========================================================= */}
        {(activeTab === "employees" || activeTab === "contracts") && (
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl border shadow-sm mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{activeTab === "employees" ? "Hồ sơ Nhân sự" : "Quản lý Hợp đồng"}</h3>
                {deptFilter && (<Badge variant="secondary" className="bg-blue-100 text-blue-700 cursor-pointer flex items-center gap-1 border-blue-200" onClick={() => setDeptFilter(null)}><Filter className="w-3 h-3" /> Lọc: {deptFilter} <X className="w-3 h-3 ml-1" /></Badge>)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Đang hiển thị {processedEmployees.length} kết quả.</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Tìm tên, mã NV..." className="pl-9 bg-slate-50 border-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              {/* BỘ LỌC TRẠNG THÁI NHÂN SỰ CHUẨN */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-50 border-slate-200">
                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                    {statusFilter === "all" ? "Tất cả trạng thái" : EMPLOYEE_STATUSES.find(s => s.value === statusFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")} className="font-medium">Tất cả</DropdownMenuItem>
                  {EMPLOYEE_STATUSES.map((s) => (<DropdownMenuItem key={s.value} onClick={() => setStatusFilter(s.value)}>{s.label}</DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* BỘ LỌC LOẠI HỢP ĐỒNG CHUẨN */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-50 border-slate-200">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                    {typeFilter === "all" ? "Mọi loại HĐ" : CONTRACT_TYPES.find(t => t.value === typeFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setTypeFilter("all")} className="font-medium">Tất cả</DropdownMenuItem>
                  {CONTRACT_TYPES.map((t) => (<DropdownMenuItem key={t.value} onClick={() => setTypeFilter(t.value)}>{t.label}</DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTab === "employees" && (
                <>
                  <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="border-teal-600 text-teal-600 hover:bg-teal-50 ml-2 hidden sm:flex"><Upload className="size-4 mr-2" /> Nhập Excel</Button>
                  <Button onClick={() => handleOpenEmpModal(null)} className="bg-teal-600 hover:bg-teal-700 ml-2"><UserPlus className="size-4 mr-2" /> Thêm mới</Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DANH SÁCH NHÂN SỰ */}
        {/* ========================================================= */}
        <TabsContent value="employees">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã NV</TableHead><TableHead>Họ Tên</TableHead><TableHead>Phòng ban</TableHead><TableHead>Loại HĐ</TableHead><TableHead>Lương CB</TableHead><TableHead>Ngày vào làm</TableHead><TableHead className="text-center">Trạng thái NS</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedEmployees.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell className="font-medium text-blue-600">{emp.employeeCode}</TableCell>
                    <TableCell className="font-semibold">{emp.fullName}</TableCell>
                    <TableCell>{emp.workInfo?.department || "Chưa xếp"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-medium">
                        {CONTRACT_TYPES.find(t => t.value === emp.contractInfo?.contractType)?.label || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{emp.salaryAndBenefits?.baseSalary ? emp.salaryAndBenefits.baseSalary.toLocaleString('vi-VN') + " đ" : "0 đ"}</TableCell>
                    <TableCell>{formatDateForDisplay(emp.workInfo?.joinDate)}</TableCell>
                    
                    {/* KHÚC NÀY ĐÃ ÁP DỤNG CODE SẠCH UI MAPPING THAY CHO IF-ELSE */}
                    <TableCell className="text-center">
                      <Badge className={`${EMPLOYEE_STATUS_UI[emp.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"} font-medium`}>
                        {EMPLOYEE_STATUS_UI[emp.status]?.label || "Chưa xác định"}
                      </Badge>
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
            {processedEmployees.length === 0 && <div className="py-8"><NoDataFound title="Không có dữ liệu" description="Chưa có nhân viên nào phù hợp." buttonText="Thêm mới" buttonAction={() => handleOpenEmpModal(null)} /></div>}
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: DANH SÁCH HỢP ĐỒNG (TÍCH HỢP) */}
        {/* ========================================================= */}
        <TabsContent value="contracts">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 py-4">Nhân viên</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-center">Loại Hợp Đồng</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-center">Thời hạn HĐ</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-center">Trạng Thái NS</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Thâm Niên</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedEmployees.map((emp) => {
                  const statusInfo = CONTRACT_STATUSES[emp.currentContractStatus || "CHUA_XAC_DINH"];
                  const StatusIcon = statusInfo?.icon || Clock;

                  return (
                    <TableRow key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{emp.fullName}</span>
                          <span className="text-xs text-slate-500 font-medium">Mã NV: {emp.employeeCode} | {emp.workInfo?.department || "Chưa xếp phòng"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-medium whitespace-nowrap">
                          {CONTRACT_TYPES.find(t => t.value === emp.contractInfo?.contractType)?.label || "Chưa có"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${statusInfo?.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo?.label}
                        </div>
                        {emp.contractInfo?.endDate && (
                          <div className="text-[11px] text-slate-500 mt-1">Đến: {formatDateForDisplay(emp.contractInfo.endDate)}</div>
                        )}
                      </TableCell>

                      {/* KHÚC NÀY ĐÃ ÁP DỤNG CODE SẠCH UI MAPPING */}
                      <TableCell className="py-4 text-center">
                        <Badge className={`${EMPLOYEE_STATUS_UI[emp.status]?.color || "bg-slate-100 text-slate-600 border-slate-200"} font-medium`}>
                          {EMPLOYEE_STATUS_UI[emp.status]?.label || "Chưa xác định"}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex flex-col min-w-[140px]">
                          <span className="text-sm font-bold text-slate-800">{emp.workingDuration?.formatted || "-"}</span>
                          {emp.workingDuration?.totalDays && (
                            <span className="text-xs text-emerald-600 font-medium mt-0.5">Ngày vào: {formatDateForDisplay(emp.workInfo?.joinDate)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        {/* NÚT CHUYỂN TẬN TAY VÀO FORM SỬA HỢP ĐỒNG */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            handleOpenEmpModal(emp);
                            setEmpFormTab("work"); // Bật sẵn tab số 2: Hợp đồng
                          }}
                          className="border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Cập nhật HĐ
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {processedEmployees.length === 0 && <div className="py-8"><NoDataFound title="Không tìm thấy hợp đồng" description="" buttonText="Xóa bộ lọc" buttonAction={() => {setSearchQuery(""); setStatusFilter("all"); setTypeFilter("all");}} /></div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* DIALOG FORM PHÒNG BAN */}
      {/* ============================================================== */}
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

      {/* ============================================================== */}
      {/* DIALOG FORM NHÂN VIÊN MỚI / SỬA (CÓ LOGIC TÍNH HỢP ĐỒNG CHUẨN) */}
      {/* ============================================================== */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b shrink-0"><h3 className="text-xl font-bold">{selectedEmp ? `Hồ sơ: ${empForm.fullName}` : "Thêm Nhân Viên Mới"}</h3><button type="button" onClick={() => setIsEmpModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button></div>
            
            <div className="flex px-6 pt-4 gap-2 border-b shrink-0 bg-slate-50">
              <button type="button" onClick={() => setEmpFormTab("personal")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "personal" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Info className="w-4 h-4" /> 1. Định danh & Cá nhân</button>
              <button type="button" onClick={() => setEmpFormTab("work")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "work" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Briefcase className="w-4 h-4" /> 2. Công việc & Hợp đồng</button>
              <button type="button" onClick={() => setEmpFormTab("salary")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "salary" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><DollarSign className="w-4 h-4" /> 3. Lương & Bảo hiểm</button>
            </div>

            <form id="employee-form" onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto flex-1">
              
              {/* --- TAB 1 --- */}
              {empFormTab === "personal" && (
                <div className="space-y-6 animate-in fade-in-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700">Mã NV (*)</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.employeeCode} onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}/></div>
                    <div><label className="block text-sm font-bold text-slate-700">Họ và tên (*)</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.fullName} onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}/></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1 text-blue-600">Số CCCD/CMND *</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.idCardNumber} onChange={(e) => setEmpForm({ ...empForm, idCardNumber: e.target.value })} placeholder="Số định danh 12 số..."/></div>
                  <div><label className="block text-sm font-bold text-slate-700">Email (*)</label><input required type="email" className="w-full border rounded-md p-2" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} placeholder="example@gmail.com"/></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày sinh</label><input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.dateOfBirth} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, dateOfBirth: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Giới tính</label><select className="w-full border rounded-md p-2" value={empForm.personalInfo.gender} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, gender: e.target.value}})}><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></div>
                    
                    {/* TRẠNG THÁI NHÂN SỰ CHUẨN */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Trạng thái nhân sự</label>
                      <select 
                        className="w-full border rounded-md p-2 font-medium bg-white focus:ring-2 focus:ring-blue-500/20" 
                        value={empForm.status} 
                        onChange={(e) => setEmpForm({...empForm, status: e.target.value})}
                      >
                        {EMPLOYEE_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                      </select>
                    </div>
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

              {/* --- TAB 2 --- */}
              {empFormTab === "work" && (
                <div className="space-y-8 animate-in fade-in-50">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-4"><Calendar className="w-4 h-4"/> Mốc thời gian làm việc</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-amber-800">Ngày Bắt Đầu Đi Làm (Join Date) *</label>
                        <input required type="date" className="w-full border-amber-200 border rounded-md p-2 bg-white" value={empForm.workInfo.joinDate} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, joinDate: e.target.value}})}/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phòng ban</label>
                        <select className="w-full border rounded-md p-2 bg-white" value={empForm.workInfo.department} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, department: e.target.value}})}>
                          <option value="">-- Chọn phòng ban --</option>
                          {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Nghề nghiệp</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.profession} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, profession: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Chức vụ</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.position} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, position: e.target.value}})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Chức danh</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.title} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, title: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Thời gian làm việc</label><input type="text" className="w-full border rounded-md p-2" value={empForm.workInfo.workingTime} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, workingTime: e.target.value}})} placeholder="VD: Hành chính"/></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Mô tả công việc</label><textarea className="w-full border rounded-md p-2" value={empForm.workInfo.jobDescription} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, jobDescription: e.target.value}})}/></div>

                  <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8 flex items-center gap-2"><FileText className="w-4 h-4"/> Thông tin hợp đồng lao động</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Loại Hợp Đồng (*)</label>
                      <select required className="w-full border-blue-400 border bg-blue-50/30 rounded-md p-2 font-semibold" value={empForm.contractInfo.contractType} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractType: e.target.value}})}>
                        {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Số HĐLĐ</label><input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.contractNumber} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, contractNumber: e.target.value}})}/></div>
                    <div><label className="block text-sm font-medium mb-1">Chế độ bồi thường</label><input type="text" className="w-full border rounded-md p-2" value={empForm.contractInfo.compensationRegime} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, compensationRegime: e.target.value}})}/></div>
                  </div>

                  {/* THỜI HẠN NHẬP (SỐ VÀ DROP DOWN THÁNG/NĂM) */}
                  {empForm.contractInfo.contractType === "FIXED_TERM" && (
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Thời gian hiệu lực</label>
                        <div className="flex gap-2">
                          <input type="number" min="1" className="w-20 border rounded-md p-2 bg-white" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))}/>
                          <select className="flex-1 border rounded-md p-2 bg-white font-medium text-slate-700" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as any)}>
                            <option value="months">Tháng</option>
                            <option value="years">Năm</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-end text-sm text-indigo-700 italic pb-2 font-medium">
                        * Hệ thống sẽ tự tính Ngày kết thúc HĐ.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngày ký HĐ</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.signDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, signDate: e.target.value}})}/></div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày kết thúc HĐ</label>
                      <input 
                        type="date" 
                        className="w-full border rounded-md p-2 disabled:bg-slate-100 disabled:text-slate-500" 
                        value={empForm.contractInfo.endDate} 
                        disabled={empForm.contractInfo.contractType === "INDEFINITE"}
                        onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, endDate: e.target.value}})}
                      />
                    </div>
                  </div>

                  {empForm.contractInfo.contractType === "PROBATION" && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div><label className="block text-sm font-medium mb-1">Ngày bắt đầu thử việc</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationStartDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationStartDate: e.target.value}})}/></div>
                      <div><label className="block text-sm font-medium mb-1">Ngày kết thúc thử việc</label><input type="date" className="w-full border rounded-md p-2" value={empForm.contractInfo.probationEndDate} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, probationEndDate: e.target.value}})}/></div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3 --- */}
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
                </div>
              )}
            </form>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0"><Button type="button" variant="outline" onClick={() => setIsEmpModalOpen(false)}>Hủy bỏ</Button><Button type="submit" form="employee-form" className="bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</Button></div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DIALOG NHẬP EXCEL (GIỮ NGUYÊN 100% LOGIC CŨ) */}
      {/* ============================================================== */}
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