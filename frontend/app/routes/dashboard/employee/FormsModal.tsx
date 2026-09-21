import React, { useState } from "react";
import { X, Info, Briefcase, DollarSign, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYEE_STATUSES, CONTRACT_TYPES, GENDER_OPTIONS, PAYMENT_METHODS } from "./utils";

/**
 * Input số: khi focus vào mà giá trị đang là 0 thì tự xoá để user nhập luôn.
 * Khi blur mà để trống thì trả về 0.
 */
const NumberInput = ({ value, onChange, className, ...rest }: any) => {
  const [focused, setFocused] = useState(false);

  const displayValue =
    focused && (value === 0 || value === "0" || value === null || value === undefined)
      ? ""
      : (value ?? "");

  return (
    <input
      type="number"
      className={className}
      value={displayValue}
      onFocus={(e) => {
        setFocused(true);
        e.target.select?.();
      }}
      onBlur={(e) => {
        setFocused(false);
        if (e.target.value === "" || e.target.value === "-") {
          onChange(0);
        }
      }}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? 0 : Number(v));
      }}
      {...rest}
    />
  );
};

export const DepartmentModal = ({ isOpen, onClose, selectedDept, deptForm, setDeptForm, handleSaveDepartment }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{selectedDept ? "Sửa Phòng Ban" : "Thêm Phòng Ban"}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
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
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Lưu lại</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EmployeeModal = ({ isOpen, onClose, selectedEmp, empForm, setEmpForm, empFormTab, setEmpFormTab, handleSaveEmployee, departments, durationValue, setDurationValue, durationUnit, setDurationUnit }: any) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (empForm.status === "resigned" && !empForm.workInfo.resignationDate) {
      alert("Hồ sơ đang ở trạng thái 'Đã nghỉ việc'. Vui lòng điền 'Ngày nghỉ việc'!");
      setEmpFormTab("personal");
      return;
    }

    // ✅ ĐÃ BỎ điều kiện !empForm.email — Email không còn bắt buộc
    if (!empForm.employeeCode || !empForm.fullName || !empForm.idCardNumber || !empForm.phoneNumber) {
      if (empFormTab !== "personal") {
        alert("Vui lòng điền đầy đủ các trường bắt buộc (*) ở mục Định danh & Cá nhân!");
        setEmpFormTab("personal");
        return;
      }
    }

    const sb = empForm.salaryAndBenefits || {};

    let trainingAllowance = 0;
    if (sb.trainingAllowanceType === "FIXED") {
      trainingAllowance = Number(sb.trainingAllowanceFixed) || 0;
    }

    const housingCost = sb.housingCost || 1200000;
    const dormitoryDeduction = sb.dormitoryDeduction || 0;
    const housingAllowance = housingCost - dormitoryDeduction;

    const finalForm = {
      ...empForm,
      salaryAndBenefits: {
        ...sb,
        housingCost,
        dormitoryDeduction,
        housingAllowance,
        trainingAllowance,
      }
    };
    setEmpForm(finalForm);

    handleSaveEmployee(e, finalForm);
  };

  const handleHousingChange = (field: "housingCost" | "dormitoryDeduction", value: number) => {
    const newSalary = { ...empForm.salaryAndBenefits, [field]: value };
    const cost = field === "housingCost" ? (value || 1200000) : (newSalary.housingCost || 1200000);
    const deduction = field === "dormitoryDeduction" ? (value || 0) : (newSalary.dormitoryDeduction || 0);
    newSalary.housingAllowance = cost - deduction;
    setEmpForm({ ...empForm, salaryAndBenefits: newSalary });
  };

  const handleTrainingChange = (field: string, value: any) => {
    const sb = { ...empForm.salaryAndBenefits, [field]: value };
    let trainingAllowance = 0;
    if (sb.trainingAllowanceType === "FIXED") {
      trainingAllowance = Number(sb.trainingAllowanceFixed) || 0;
    }
    sb.trainingAllowance = trainingAllowance;
    setEmpForm({ ...empForm, salaryAndBenefits: sb });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h3 className="text-xl font-bold">{selectedEmp ? `Hồ sơ: ${empForm.fullName}` : "Thêm Nhân Viên Mới"}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex px-6 pt-4 gap-2 border-b shrink-0 bg-slate-50">
          <button type="button" onClick={() => setEmpFormTab("personal")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "personal" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Info className="w-4 h-4" /> 1. Định danh & Cá nhân</button>
          <button type="button" onClick={() => setEmpFormTab("work")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "work" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Briefcase className="w-4 h-4" /> 2. Công việc & Hợp đồng</button>
          <button type="button" onClick={() => setEmpFormTab("salary")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${empFormTab === "salary" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}><DollarSign className="w-4 h-4" /> 3. Lương & Bảo hiểm</button>
        </div>

        <form id="employee-form" onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: ĐỊNH DANH & CÁ NHÂN */}
          {empFormTab === "personal" && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700">Mã NV (*)</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.employeeCode} onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}/></div>
                <div><label className="block text-sm font-bold text-slate-700">Họ và tên (*)</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.fullName} onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-blue-600">Số CCCD/CMND *</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.idCardNumber} onChange={(e) => setEmpForm({ ...empForm, idCardNumber: e.target.value })} placeholder="Số định danh..."/></div>
                <div><label className="block text-sm font-medium mb-1 text-blue-600">Số điện thoại *</label><input required type="text" className="w-full border rounded-md p-2" value={empForm.phoneNumber} onChange={(e) => setEmpForm({ ...empForm, phoneNumber: e.target.value })} placeholder="VD: 0987654321"/></div>
              </div>
              {/* ✅ EMAIL: đã bỏ required và bỏ dấu (*) trên label */}
              <div><label className="block text-sm font-bold text-slate-700">Email</label><input type="email" className="w-full border rounded-md p-2" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} placeholder="example@gmail.com"/></div>
              
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Ngày sinh</label><input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.dateOfBirth} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, dateOfBirth: e.target.value}})}/></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới tính</label>
                  <select className="w-full border rounded-md p-2 bg-white" value={empForm.personalInfo.gender} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, gender: e.target.value}})}>
                    {GENDER_OPTIONS.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái nhân sự</label>
                  <select className="w-full border rounded-md p-2 font-medium bg-white focus:ring-2 focus:ring-blue-500/20" value={empForm.status} onChange={(e) => setEmpForm({...empForm, status: e.target.value})}>
                    {EMPLOYEE_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>
              </div>

              {empForm.status === "resigned" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg animate-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-rose-800">Ngày Nghỉ Việc (* Bắt buộc)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <input required type="date" className="flex-1 border-rose-300 border rounded-md p-2 bg-white" value={empForm.workInfo.resignationDate} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, resignationDate: e.target.value}})}/>
                    <p className="text-xs text-rose-600 italic flex-1">Hồ sơ đã chuyển sang trạng thái nghỉ việc, vui lòng điền ngày chính thức nghỉ.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Ngày cấp CMT/CCCD</label><input type="date" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssueDate} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssueDate: e.target.value}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Nơi cấp</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.idCardIssuePlace} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, idCardIssuePlace: e.target.value}})}/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Quốc tịch</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.nationality} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, nationality: e.target.value}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Dân tộc</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.ethnicity} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, ethnicity: e.target.value}})}/></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nguyên quán</label>
                <input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.hometown} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, hometown: e.target.value}})}/>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Địa chỉ thường trú (Khai sinh)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Số nhà + Tên đường</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.permanentAddress?.houseStreet || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: {...empForm.personalInfo.permanentAddress, houseStreet: e.target.value}}})} placeholder="VD: 123 Lê Lợi"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Phường/Xã</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.permanentAddress?.ward || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: {...empForm.personalInfo.permanentAddress, ward: e.target.value}}})} placeholder="VD: Phường Bến Nghé"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Tỉnh/TP</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.permanentAddress?.province || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: {...empForm.personalInfo.permanentAddress, province: e.target.value}}})} placeholder="VD: TP. Hồ Chí Minh"/>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Địa chỉ hiện tại</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Số nhà + Tên đường</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.currentAddress?.houseStreet || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, currentAddress: {...empForm.personalInfo.currentAddress, houseStreet: e.target.value}}})} placeholder="VD: 456 Nguyễn Huệ"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Phường/Xã</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.currentAddress?.ward || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, currentAddress: {...empForm.personalInfo.currentAddress, ward: e.target.value}}})} placeholder="VD: Phường Đa Kao"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Tỉnh/TP</label>
                    <input type="text" className="w-full border rounded-md p-2 text-sm" value={empForm.personalInfo.currentAddress?.province || ""} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, currentAddress: {...empForm.personalInfo.currentAddress, province: e.target.value}}})} placeholder="VD: TP. Hồ Chí Minh"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÔNG VIỆC & HỢP ĐỒNG */}
          {empFormTab === "work" && (
            <div className="space-y-8 animate-in fade-in-50">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-4"><Calendar className="w-4 h-4"/> Mốc thời gian làm việc</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-amber-800">Ngày Bắt Đầu Đi Làm (Join Date)</label>
                    <input type="date" className="w-full border-amber-200 border rounded-md p-2 bg-white" value={empForm.workInfo.joinDate} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, joinDate: e.target.value}})}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phòng ban</label>
                    <select className="w-full border rounded-md p-2 bg-white" value={empForm.workInfo.department} onChange={(e) => setEmpForm({...empForm, workInfo: {...empForm.workInfo, department: e.target.value}})}>
                      <option value="">-- Chọn phòng ban --</option>
                      {departments.map((d: any) => <option key={d._id} value={d.name}>{d.name}</option>)}
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

              {empForm.contractInfo.contractType === "FIXED_TERM" && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-bold text-indigo-900 mb-1">Thời gian hiệu lực</label>
                    <div className="flex gap-2">
                      <NumberInput min="1" className="w-20 border rounded-md p-2 bg-white" value={durationValue} onChange={(v: number) => setDurationValue(v)}/>
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
                  <input type="date" className="w-full border rounded-md p-2 disabled:bg-slate-100 disabled:text-slate-500" value={empForm.contractInfo.endDate} disabled={empForm.contractInfo.contractType === "INDEFINITE"} onChange={(e) => setEmpForm({...empForm, contractInfo: {...empForm.contractInfo, endDate: e.target.value}})}/>
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

          {/* TAB 3: LƯƠNG & BẢO HIỂM */}
          {empFormTab === "salary" && (
            <div className="space-y-6 animate-in fade-in-50">
              <h4 className="font-semibold text-slate-800 border-b pb-2">Lương, Bảo hiểm & Ngân hàng</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tên Ngân hàng</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bankName} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bankName: e.target.value}})} placeholder="VD: Vietcombank, MBBank..."/></div>
                <div><label className="block text-sm font-medium mb-1">Số Tài Khoản</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bankAccountNumber} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bankAccountNumber: e.target.value}})}/></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Lương cơ bản (VNĐ)</label><NumberInput className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.baseSalary} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, baseSalary: v}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Lương tham gia BH (VNĐ)</label><NumberInput className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.insuranceSalary} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, insuranceSalary: v}})}/></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Mã số thuế</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.taxCode} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, taxCode: e.target.value}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Số người phụ thuộc</label><NumberInput min="0" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.dependents ?? 0} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, dependents: v}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Sổ BHXH</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.socialInsuranceNumber} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, socialInsuranceNumber: e.target.value}})}/></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hình thức trả lương</label>
                  <select className="w-full border rounded-md p-2 bg-white" value={empForm.salaryAndBenefits.paymentMethod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentMethod: e.target.value}})}>
                    {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Thời gian trả lương</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.paymentPeriod} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, paymentPeriod: e.target.value}})} placeholder="VD: Mùng 5 hàng tháng"/></div>
              </div>

              <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Đơn giá Show &amp; Tiền Ăn Ca</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 p-2 rounded border border-purple-200">
                  <label className="block text-sm font-bold text-purple-800 mb-1">Đơn giá Mini Show (VNĐ)</label>
                  <NumberInput className="w-full border border-purple-300 rounded-md p-2" value={empForm.salaryAndBenefits.minishowRate || 65000} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, minishowRate: v}})}/>
                  <p className="text-[10px] text-purple-600 mt-1 leading-tight">Mặc định: 65.000</p>
                </div>
                <div className="bg-purple-50 p-2 rounded border border-purple-200">
                  <label className="block text-sm font-bold text-purple-800 mb-1">Đơn giá Big Show (VNĐ)</label>
                  <NumberInput className="w-full border border-purple-300 rounded-md p-2" value={empForm.salaryAndBenefits.bigshowRate || 213462} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bigshowRate: v}})}/>
                  <p className="text-[10px] text-purple-600 mt-1 leading-tight">Mặc định: 213.462</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                  <label className="block text-sm font-bold text-emerald-800 mb-1">Tiền ăn / Công (VNĐ)</label>
                  <NumberInput className="w-full border border-emerald-300 rounded-md p-2" value={empForm.salaryAndBenefits.mealRate ?? 0} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, mealRate: v}})}/>
                  <p className="text-[10px] text-emerald-600 mt-1 leading-tight">Để 0 = dùng mặc định 1.800.000/26 ≈ 69.231</p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Phụ cấp Ca tập</h4>
              <div className="grid grid-cols-4 gap-4 items-end">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-indigo-800 mb-1">Hình thức</label>
                  <select 
                    className="w-full border border-indigo-300 rounded-md p-2 bg-white font-medium"
                    value={empForm.salaryAndBenefits.trainingAllowanceType || "NONE"}
                    onChange={(e) => handleTrainingChange("trainingAllowanceType", e.target.value)}
                  >
                    <option value="NONE">Không có</option>
                    <option value="FIXED">Nhập số tiền cố định</option>
                    <option value="PER_SESSION">Đơn giá × Số buổi (chấm công)</option>
                  </select>
                </div>

                {empForm.salaryAndBenefits.trainingAllowanceType === "FIXED" && (
                  <div className="col-span-2 bg-indigo-50 p-2 rounded border border-indigo-200">
                    <label className="block text-sm font-bold text-indigo-800 mb-1">Số tiền (VNĐ)</label>
                    <NumberInput 
                      className="w-full border border-indigo-300 rounded-md p-2" 
                      value={empForm.salaryAndBenefits.trainingAllowanceFixed || 0} 
                      onChange={(v: number) => handleTrainingChange("trainingAllowanceFixed", v)}
                      placeholder="VD: 500000"
                    />
                  </div>
                )}

                {empForm.salaryAndBenefits.trainingAllowanceType === "PER_SESSION" && (
                  <div className="col-span-2 bg-indigo-50 p-2 rounded border border-indigo-200">
                    <label className="block text-sm font-bold text-indigo-800 mb-1">Đơn giá / buổi (VNĐ)</label>
                    <NumberInput 
                      className="w-full border border-indigo-300 rounded-md p-2" 
                      value={empForm.salaryAndBenefits.trainingAllowanceRate || 0} 
                      onChange={(v: number) => handleTrainingChange("trainingAllowanceRate", v)}
                      placeholder="VD: 39000"
                    />
                    <p className="text-[10px] text-indigo-600 mt-1 leading-tight">
                      Số buổi sẽ tự động lấy từ bảng chấm công khi gom lương
                    </p>
                  </div>
                )}

                <div className="col-span-1 bg-green-50 p-2 rounded border border-green-200">
                  <label className="block text-sm font-bold text-green-800 mb-1">
                    {empForm.salaryAndBenefits.trainingAllowanceType === "PER_SESSION" ? "Tạm tính" : "Thành tiền"} (VNĐ)
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    className="w-full border border-green-300 rounded-md p-2 bg-slate-100 text-slate-700 font-semibold" 
                    value={empForm.salaryAndBenefits.trainingAllowance || 0} 
                  />
                  <p className="text-[10px] text-green-600 mt-1 leading-tight">
                    {empForm.salaryAndBenefits.trainingAllowanceType === "PER_SESSION" 
                      ? "Sẽ tính theo số buổi chấm công" 
                      : "Tự tính"}
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Phụ cấp Ở</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                  <label className="block text-sm font-bold text-amber-800 mb-1">Chi phí ở (VNĐ)</label>
                  <NumberInput
                    className="w-full border border-amber-300 rounded-md p-2"
                    value={empForm.salaryAndBenefits.housingCost || 1200000}
                    onChange={(v: number) => handleHousingChange("housingCost", v)}
                  />
                  <p className="text-[10px] text-amber-600 mt-1 leading-tight">Mặc định: 1.200.000</p>
                </div>
                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                  <label className="block text-sm font-bold text-amber-800 mb-1">KTX tt VS (VNĐ)</label>
                  <NumberInput
                    className="w-full border border-amber-300 rounded-md p-2"
                    value={empForm.salaryAndBenefits.dormitoryDeduction || 0}
                    onChange={(v: number) => handleHousingChange("dormitoryDeduction", v)}
                  />
                </div>
                <div className="bg-green-50 p-2 rounded border border-green-200">
                  <label className="block text-sm font-bold text-green-800 mb-1">Phụ cấp Ở (VNĐ)</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full border border-green-300 rounded-md p-2 bg-slate-100 text-slate-700 font-semibold"
                    value={(empForm.salaryAndBenefits.housingCost || 1200000) - (empForm.salaryAndBenefits.dormitoryDeduction || 0)}
                  />
                  <p className="text-[10px] text-green-600 mt-1 leading-tight">= Chi phí ở - KTX tt VS</p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Chính sách Thưởng</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-teal-50 p-2 rounded border border-teal-200">
                  <label className="block text-sm font-bold text-teal-800 mb-1">Mức thưởng Trách nhiệm</label>
                  <NumberInput className="w-full border border-teal-300 rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.responsibility || 0} onChange={(v: number) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, responsibility: v}}})}/>
                  <p className="text-[10px] text-teal-600 mt-1 leading-tight">Dùng để tính ra Thưởng T.Nhiệm thực nhận dựa trên KPI (Mini/Big Show)</p>
                </div>
              </div>
            </div>
          )}
        </form>
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" form="employee-form" className="bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</Button>
        </div>
      </div>
    </div>
  );
};