import React from "react";
import { X, Info, Briefcase, DollarSign, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYEE_STATUSES, CONTRACT_TYPES, GENDER_OPTIONS, PAYMENT_METHODS } from "./utils";

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

  // =========================================================================
  // HÀM CHẶN VÀ KIỂM TRA DỮ LIỆU XUYÊN TAB TRƯỚC KHI GỌI API LƯU
  // =========================================================================
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra ràng buộc cực mạnh cho "Ngày nghỉ việc"
    if (empForm.status === "resigned" && !empForm.workInfo.resignationDate) {
      alert("Hồ sơ đang ở trạng thái 'Đã nghỉ việc'. Vui lòng điền 'Ngày nghỉ việc'!");
      setEmpFormTab("personal"); // Tự động nhảy về Tab 1
      return;
    }

    // 2. Ràng buộc các trường bắt buộc ở Tab 1 (Nếu user đang đứng ở Tab 2,3 mà bấm Lưu)
    if (!empForm.employeeCode || !empForm.fullName || !empForm.idCardNumber || !empForm.phoneNumber || !empForm.email) {
      if (empFormTab !== "personal") {
        alert("Vui lòng điền đầy đủ các trường bắt buộc (*) ở mục Định danh & Cá nhân!");
        setEmpFormTab("personal");
        return;
      }
    }

    // 3. Ràng buộc các trường bắt buộc ở Tab 2
    if (!empForm.workInfo.joinDate) {
      if (empFormTab !== "work") {
        alert("Vui lòng điền 'Ngày Bắt Đầu Đi Làm' ở mục Công việc & Hợp đồng!");
        setEmpFormTab("work");
        return;
      }
    }

    // Nếu mọi thứ đều ổn, tiến hành gọi API lưu dữ liệu
    handleSaveEmployee(e);
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

        {/* THAY onSubmit thành hàm handleFormSubmit chặn logic 3 tab */}
        <form id="employee-form" onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1">
          
          {/* ============================================================== */}
          {/* TAB 1: ĐỊNH DANH & CÁ NHÂN */}
          {/* ============================================================== */}
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
              <div><label className="block text-sm font-bold text-slate-700">Email (*)</label><input required type="email" className="w-full border rounded-md p-2" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} placeholder="example@gmail.com"/></div>
              
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

              {/* ĐÃ DỜI Ô NGÀY NGHỈ VỀ TAB 1 - HIỂN THỊ KHI CHỌN TRẠNG THÁI "ĐÃ NGHỈ VIỆC" */}
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
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Nguyên quán</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.hometown} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, hometown: e.target.value}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label><input type="text" className="w-full border rounded-md p-2" value={empForm.personalInfo.permanentAddress} onChange={(e) => setEmpForm({...empForm, personalInfo: {...empForm.personalInfo, permanentAddress: e.target.value}})}/></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CÔNG VIỆC & HỢP ĐỒNG */}
          {/* ============================================================== */}
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

          {/* ============================================================== */}
          {/* TAB 3: LƯƠNG & BẢO HIỂM */}
          {/* ============================================================== */}
          {empFormTab === "salary" && (
            <div className="space-y-6 animate-in fade-in-50">
              <h4 className="font-semibold text-slate-800 border-b pb-2">Lương, Bảo hiểm & Ngân hàng</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tên Ngân hàng</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bankName} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bankName: e.target.value}})} placeholder="VD: Vietcombank, MBBank..."/></div>
                <div><label className="block text-sm font-medium mb-1">Số Tài Khoản</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.bankAccountNumber} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bankAccountNumber: e.target.value}})}/></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Lương cơ bản (VNĐ)</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.baseSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, baseSalary: Number(e.target.value)}})}/></div>
                <div><label className="block text-sm font-medium mb-1">Lương tham gia BH (VNĐ)</label><input type="number" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.insuranceSalary} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, insuranceSalary: Number(e.target.value)}})}/></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Mã số thuế</label><input type="text" className="w-full border rounded-md p-2" value={empForm.salaryAndBenefits.taxCode} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, taxCode: e.target.value}})}/></div>
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
              
              <h4 className="font-semibold text-slate-800 border-b pb-2 mt-8">Chính sách Thưởng</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-teal-50 p-2 rounded border border-teal-200">
                  <label className="block text-sm font-bold text-teal-800 mb-1">Mức thưởng Trách nhiệm</label>
                  <input type="number" className="w-full border border-teal-300 rounded-md p-2" value={empForm.salaryAndBenefits.bonuses.responsibility} onChange={(e) => setEmpForm({...empForm, salaryAndBenefits: {...empForm.salaryAndBenefits, bonuses: {...empForm.salaryAndBenefits.bonuses, responsibility: Number(e.target.value)}}})}/>
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