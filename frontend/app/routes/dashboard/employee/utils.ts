import { CheckCircle2, AlertTriangle, Briefcase, Clock, XCircle } from "lucide-react";

export const API_BASE_URL = `${import.meta.env.VITE_API_URL}/hrm`;

export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const formatDateForInput = (isoString?: string) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().split('T')[0];
};

export const formatDateForDisplay = (isoString?: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

export const initialEmpForm = {
  employeeCode: "", idCardNumber: "", fullName: "", email: "", phoneNumber: "", status: "active",
  personalInfo: { dateOfBirth: "", gender: "Nam", idCardIssueDate: "", idCardIssuePlace: "", nationality: "Việt Nam", ethnicity: "", hometown: "", permanentAddress: "" },
  workInfo: { department: "", position: "", title: "", profession: "", jobDescription: "", workingTime: "", joinDate: "", resignationDate: "" },
  contractInfo: { contractNumber: "", contractType: "PROBATION", contractDuration: "", signDate: "", endDate: "", probationStartDate: "", probationEndDate: "", compensationRegime: "" },
  salaryAndBenefits: {
    taxCode: "", socialInsuranceNumber: "", insuranceSalary: 0, baseSalary: 0, paymentMethod: "Chuyển khoản", paymentPeriod: "", bankName: "", bankAccountNumber: "",
    bonuses: { general: 0, performance: 0, responsibility: 0 }
  }
};

export const CONTRACT_TYPES = [
  { value: "PROBATION", label: "Thử việc" },
  { value: "FIXED_TERM", label: "Có thời hạn" },
  { value: "INDEFINITE", label: "Vô thời hạn" },
  { value: "FREELANCE", label: "Cộng tác viên / Thời vụ" },
  { value: "INTERNSHIP", label: "Thực tập sinh" },
];

export const EMPLOYEE_STATUSES = [
  { value: "active", label: "Chính thức" },
  { value: "probation", label: "Đang thử việc" },
  { value: "on_leave", label: "Nghỉ phép" },
  { value: "resigned", label: "Đã nghỉ việc" },
];

export const GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" }
];

export const PAYMENT_METHODS = [
  { value: "Chuyển khoản", label: "Chuyển khoản" },
  { value: "Tiền mặt", label: "Tiền mặt" }
];

export const EMPLOYEE_STATUS_UI: Record<string, { label: string, color: string }> = {
  active: { label: "Chính thức", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  probation: { label: "Đang thử việc", color: "bg-blue-100 text-blue-700 border-blue-200" },
  on_leave: { label: "Nghỉ phép", color: "bg-amber-100 text-amber-700 border-amber-200" },
  resigned: { label: "Đã nghỉ", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

export const CONTRACT_STATUSES: Record<string, { label: string, color: string, icon: any }> = {
  CON_HAN: { label: "Còn hạn", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  HET_HAN: { label: "Đã hết hạn", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle },
  KHONG_THOI_HAN: { label: "Không thời hạn", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Briefcase },
  CHUA_XAC_DINH: { label: "Chưa xác định", color: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
};

export const ALL_FIELDS = [
  { id: "employeeCode", label: "Mã NV (*)", path: "employeeCode", type: "string" },
  { id: "idCardNumber", label: "Số CCCD/CMND (*)", path: "idCardNumber", type: "string" },
  { id: "fullName", label: "Họ Tên (*)", path: "fullName", type: "string" },
  { id: "email", label: "Email (*)", path: "email", type: "string" },
  { id: "phoneNumber", label: "SĐT (*)", path: "phoneNumber", type: "string" },
  { id: "status", label: "Trạng thái", path: "status", type: "select", options: EMPLOYEE_STATUSES },
  { id: "dateOfBirth", label: "Ngày sinh", path: "personalInfo.dateOfBirth", type: "date" },
  { id: "gender", label: "Giới tính", path: "personalInfo.gender", type: "select", options: GENDER_OPTIONS },
  { id: "idCardIssueDate", label: "Ngày cấp CMT", path: "personalInfo.idCardIssueDate", type: "date" },
  { id: "idCardIssuePlace", label: "Nơi cấp", path: "personalInfo.idCardIssuePlace", type: "string" },
  { id: "nationality", label: "Quốc tịch", path: "personalInfo.nationality", type: "string" },
  { id: "ethnicity", label: "Dân tộc", path: "personalInfo.ethnicity", type: "string" },
  { id: "hometown", label: "Nguyên quán", path: "personalInfo.hometown", type: "string" },
  { id: "permanentAddress", label: "Địa chỉ TT", path: "personalInfo.permanentAddress", type: "string" },
  { id: "department", label: "Phòng ban", path: "workInfo.department", type: "select", isDepartment: true },
  { id: "position", label: "Chức vụ", path: "workInfo.position", type: "string" },
  { id: "title", label: "Chức danh", path: "workInfo.title", type: "string" },
  { id: "profession", label: "Nghề nghiệp", path: "workInfo.profession", type: "string" },
  { id: "jobDescription", label: "Mô tả CV", path: "workInfo.jobDescription", type: "string" },
  { id: "workingTime", label: "Thời gian LV", path: "workInfo.workingTime", type: "string" },
  { id: "joinDate", label: "Ngày vào làm (*)", path: "workInfo.joinDate", type: "date" },
  { id: "resignationDate", label: "Ngày nghỉ việc", path: "workInfo.resignationDate", type: "date" },
  { id: "contractNumber", label: "Số HĐ", path: "contractInfo.contractNumber", type: "string" },
  { id: "contractType", label: "Loại HĐ", path: "contractInfo.contractType", type: "select", options: CONTRACT_TYPES },
  { id: "signDate", label: "Ngày ký", path: "contractInfo.signDate", type: "date" },
  { id: "endDate", label: "Ngày KT", path: "contractInfo.endDate", type: "date" },
  { id: "probationStartDate", label: "BĐ Thử việc", path: "contractInfo.probationStartDate", type: "date" },
  { id: "probationEndDate", label: "KT Thử việc", path: "contractInfo.probationEndDate", type: "date" },
  { id: "compensationRegime", label: "Chế độ BT", path: "contractInfo.compensationRegime", type: "string" },
  { id: "taxCode", label: "Mã Số Thuế", path: "salaryAndBenefits.taxCode", type: "string" },
  { id: "socialInsuranceNumber", label: "Số BHXH", path: "salaryAndBenefits.socialInsuranceNumber", type: "string" },
  { id: "baseSalary", label: "Lương CB", path: "salaryAndBenefits.baseSalary", type: "number" },
  { id: "insuranceSalary", label: "Lương BH", path: "salaryAndBenefits.insuranceSalary", type: "number" },
  { id: "paymentMethod", label: "HT Trả Lương", path: "salaryAndBenefits.paymentMethod", type: "select", options: PAYMENT_METHODS },
  { id: "paymentPeriod", label: "Kỳ Trả Lương", path: "salaryAndBenefits.paymentPeriod", type: "string" },
  { id: "bankName", label: "Tên Ngân hàng", path: "salaryAndBenefits.bankName", type: "string" },
  { id: "bankAccountNumber", label: "Số Tài Khoản", path: "salaryAndBenefits.bankAccountNumber", type: "string" },
  { id: "generalBonus", label: "Thưởng Lễ tết", path: "salaryAndBenefits.bonuses.general", type: "number" },
  { id: "performanceBonus", label: "Thưởng Năng lực", path: "salaryAndBenefits.bonuses.performance", type: "number" },
  { id: "responsibilityBonus", label: "Thưởng Trách nhiệm", path: "salaryAndBenefits.bonuses.responsibility", type: "number" }
];

export const calculateAge = (dateString?: string) => {
  if (!dateString) return "?";
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return "?";
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};