import React, { useState } from "react";
import { X, Settings2, Check, Download, UploadCloud, FileUp, File, AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_BASE_URL, getAuthHeaders, ALL_FIELDS, initialEmpForm, EMPLOYEE_STATUSES, CONTRACT_TYPES, GENDER_OPTIONS, PAYMENT_METHODS } from "./utils";
import * as XLSX from "xlsx";

// Xây dựng mảng cấu hình Cột riêng cho Excel (Lọc bỏ Thưởng năng lực, Lễ Tết và Thêm NPT)
const EXCEL_FIELDS = (() => {
  let fields = ALL_FIELDS.filter(f => 
    f.path !== "salaryAndBenefits.bonuses.performance" && 
    f.path !== "salaryAndBenefits.bonuses.general"
  );
  
  const taxCodeIndex = fields.findIndex(f => f.id === "taxCode" || f.path === "salaryAndBenefits.taxCode");
  
  const dependentsField = {
    id: "dependents",
    label: "Số người phụ thuộc",
    path: "salaryAndBenefits.dependents",
    type: "number"
  };

  // Chèn cột "Số người phụ thuộc" vào ngay sau cột Mã số thuế (nếu tìm thấy)
  if (taxCodeIndex !== -1) {
    fields.splice(taxCodeIndex + 1, 0, dependentsField);
  } else {
    fields.push(dependentsField);
  }
  
  return fields;
})();

export const ImportExcelModal = ({ isOpen, onClose, onSuccess, departmentsList }: any) => {
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]); 
  const [step, setStep] = useState<1 | 2>(1); 

  if (!isOpen) return null;

  // ==============================================================
  // 1. XUẤT FILE MẪU CHUẨN KÈM HƯỚNG DẪN DÒNG 2
  // ==============================================================
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = EXCEL_FIELDS.map(c => c.label);
    
    // Tạo dòng hướng dẫn chi tiết
    const instructions = EXCEL_FIELDS.map(c => {
      if (c.id === "bankAccountNumber" || c.id === "idCardNumber" || c.id === "phoneNumber") {
        return "Nhập số (Nên thêm dấu ' trước số)";
      }
      
      if (c.type === "date") return "Nhập: DD/MM/YYYY";
      if (c.type === "number") return "Chỉ nhập số";
      
      if (c.type === "select") {
        let optionsList: string[] = [];
        if ((c as any).isDepartment) {
          optionsList = departmentsList.map((d: any) => d.name);
        } else if ((c as any).options) {
          optionsList = ((c as any).options as any[]).map(o => o.label);
        }
        
        if (optionsList.length > 0) {
          return `Nhập 1 trong: ${optionsList.join(" | ")}`;
        }
      }
      
      return "Nhập văn bản...";
    });

    const wsData = [headers, instructions];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style Header (Dòng 1)
    for (let c = 0; c < headers.length; c++) {
      const hRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[hRef]) {
        ws[hRef].s = { 
          font: { bold: true, color: { rgb: "FFFFFF" } }, 
          fill: { fgColor: { rgb: "1E40AF" } }, 
          alignment: { horizontal: "center", vertical: "center" } 
        };
      }
    }

    // Style Instruction (Dòng 2)
    for (let c = 0; c < headers.length; c++) {
      const iRef = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[iRef]) {
        ws[iRef].s = { 
          font: { italic: true, color: { rgb: "64748B" } }, 
          fill: { fgColor: { rgb: "F1F5F9" } }, 
          alignment: { horizontal: "center", vertical: "center" } 
        };
      }
    }

    ws["!cols"] = headers.map(() => ({ wch: 25 }));

    XLSX.utils.book_append_sheet(wb, ws, "Nhan_Su");
    XLSX.writeFile(wb, `Template_HRM_NhanSu.xlsx`);
  };

  // ==============================================================
  // 2. XỬ LÝ UPLOAD VÀ ĐỌC FILE KÉP
  // ==============================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true }); 
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rowsFormatted = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: "" }) as any[][];
        const rowsRaw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" }) as any[][];

        processExcelData(rowsFormatted, rowsRaw);
      } catch (error) {
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
        setFileName(null);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

// ==============================================================
  // 3. PARSE DỮ LIỆU TỪ EXCEL -> DB (CÓ CHECK TRÙNG LẶP TRONG FILE)
  // ==============================================================
  const processExcelData = (rowsFormatted: any[][], rowsRaw: any[][]) => {
    if (rowsFormatted.length <= 2) {
      alert("File Excel chưa có dữ liệu nhân sự! Hãy nhập từ dòng số 3.");
      setFileName(null);
      return;
    }

    const actualDataRows = rowsFormatted.slice(2); 
    const actualRawRows = rowsRaw.slice(2); 
    const parsedData: any[] = [];

    // Tạo 2 bộ nhớ tạm để check trùng lặp ngay trong lúc đọc file
    const seenCodes = new Set<string>();

    const parseDateVN = (rawVal: any, formattedVal: string) => {
      if (!rawVal && !formattedVal) return null;
      if (rawVal instanceof Date) {
        const y = rawVal.getFullYear();
        const m = String(rawVal.getMonth() + 1).padStart(2, '0');
        const d = String(rawVal.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      let str = String(formattedVal).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
      
      const match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (match) {
        let year = match[3];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
      return null;
    };

    const getEnumValueFromLabel = (labelStr: string, optionsArray: any[], defaultValue: string) => {
      if (!labelStr || String(labelStr).trim() === "") return defaultValue;
      const normalizedInput = String(labelStr).toLowerCase().trim();
      const found = optionsArray.find(o => String(o.label).toLowerCase().trim() === normalizedInput);
      return found ? found.value : defaultValue;
    };

    actualDataRows.forEach((rowCols, rowIndex) => {
      if (rowCols.length === 0 || rowCols.every(c => String(c).trim() === "")) return;

      const newEmployee = JSON.parse(JSON.stringify(initialEmpForm));
      const errors: Record<string, string> = {}; 

      EXCEL_FIELDS.forEach((colDef, idx) => {
        let val = String(rowCols[idx] || "").trim();
        let rawVal = actualRawRows[rowIndex]?.[idx];

        if ((colDef.id === 'bankAccountNumber' || colDef.id === 'idCardNumber' || colDef.id === 'phoneNumber') && typeof rawVal === 'number') {
            val = rawVal.toLocaleString('fullwide', { useGrouping: false }); 
        }

        const keys = colDef.path.split('.');
        let currentObj = newEmployee;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!currentObj[keys[i]]) currentObj[keys[i]] = {}; // Đảm bảo node luôn tồn tại
          currentObj = currentObj[keys[i]];
        }
        const lastKey = keys[keys.length - 1];

        // GÁN DATA CHUẨN
        if (colDef.type === 'select') {
            if (colDef.id === 'status') {
              if (!val || val.trim() === "") {
                currentObj[lastKey] = "active";
              } else {
                currentObj[lastKey] = getEnumValueFromLabel(val, EMPLOYEE_STATUSES, "active");
              }
            } else if (colDef.id === 'contractType') {
              if (!val || val.trim() === "") {
                currentObj[lastKey] = "PROBATION";
              } else {
                currentObj[lastKey] = getEnumValueFromLabel(val, CONTRACT_TYPES, "PROBATION");
              }
            } else if (colDef.id === 'gender') {
              currentObj[lastKey] = getEnumValueFromLabel(val, GENDER_OPTIONS, "Nam");
            } else if (colDef.id === 'paymentMethod') {
              currentObj[lastKey] = getEnumValueFromLabel(val, PAYMENT_METHODS, "Chuyển khoản");
            } else if ((colDef as any).isDepartment) {
              currentObj[lastKey] = val; 
            }
        } else if (val === "") {
            if (colDef.type === 'number' || colDef.type === 'date') currentObj[lastKey] = null;
            else currentObj[lastKey] = "";
        } else if (colDef.type === 'number') {
            const num = Number(val.replace(/[^0-9]/g, ''));
            if (isNaN(num)) errors[colDef.path] = "Phải là số";
            currentObj[lastKey] = num;
        } else if (colDef.type === 'date') {
            const date = parseDateVN(rawVal, val);
            if (val && !date) errors[colDef.path] = "Sai định dạng ngày";
            currentObj[lastKey] = date;
        } else {
            currentObj[lastKey] = val;
        }
      });

      // VALIDATE BẮT BUỘC & KIỂM TRA TRÙNG LẶP TRONG FILE EXCEL
      if (!newEmployee.employeeCode) {
        errors["employeeCode"] = "Bắt buộc";
      } else {
        if (seenCodes.has(newEmployee.employeeCode)) errors["employeeCode"] = "Trùng Mã NV trong file";
        seenCodes.add(newEmployee.employeeCode);
      }

      if (!newEmployee.fullName) errors["fullName"] = "Bắt buộc";
      if (!newEmployee.idCardNumber) errors["idCardNumber"] = "Bắt buộc";
      if (!newEmployee.phoneNumber) errors["phoneNumber"] = "Bắt buộc";

      if (!newEmployee.email) {
        errors["email"] = "Bắt buộc";
      } else if (!/^\S+@\S+\.\S+$/.test(newEmployee.email)) {
        errors["email"] = "Email sai định dạng";
      }

      if (!newEmployee.workInfo.joinDate) errors["workInfo.joinDate"] = "Bắt buộc";
      
      const employeeStatus = String(newEmployee.status || "").toLowerCase();
      if (employeeStatus !== "resigned") {
        newEmployee.workInfo.resignationDate = null;
        delete errors["workInfo.resignationDate"];
      } else if (employeeStatus === "resigned" && !newEmployee.workInfo?.resignationDate) {
        errors["workInfo.resignationDate"] = "Đã nghỉ phải có Ngày nghỉ";
      }

      parsedData.push({ id: rowIndex, data: newEmployee, errors, isSuccess: false });
    });

    if (parsedData.length === 0) {
      alert("Không tìm thấy dữ liệu!");
      setFileName(null);
      return;
    }

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
    if (hasErrors) return alert("Vẫn còn ô dữ liệu bị lỗi (màu đỏ). Vui lòng sửa lại trực tiếp trên bảng dưới trước khi lưu!");

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
          updatedRows[i].errors["employeeCode"] = "Trùng Mã NV / Lỗi";
        }
      } catch (error) { 
        hasBackendErrors = true;
        updatedRows[i].errors["employeeCode"] = "Lỗi kết nối Server";
      }
    }

    setIsImporting(false);

    if (hasBackendErrors) {
      setPreviewRows(updatedRows);
      alert(`Đã lưu ${successCount} nhân sự. Có một số dòng bị lỗi (Trùng Mã NV / Căn cước). Vui lòng kiểm tra lại!`);
    } else {
      alert(`Hoàn tất! Đã lưu toàn bộ thành công.`);
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setPreviewRows([]);
    setFileName(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b shrink-0 bg-slate-50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Settings2 className="w-5 h-5 text-blue-600"/> Nhập Hồ Sơ Nhân Sự (Excel)</h3>
            <p className="text-sm text-slate-500 mt-1">Hệ thống áp dụng format Chuẩn {EXCEL_FIELDS.length} trường thông tin.</p>
          </div>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-800"><X className="w-6 h-6"/></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-white">
          {step === 1 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-2xl text-center">
                <h4 className="font-bold text-blue-800 mb-2">Bước 1: Tải file mẫu chuẩn</h4>
                <p className="text-sm text-blue-600 mb-4">Bạn vui lòng tải file Template này về máy, làm theo dòng hướng dẫn để điền dữ liệu. Sau đó tải file đã điền lên hệ thống.</p>
                <Button onClick={handleDownloadTemplate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Download className="w-4 h-4 mr-2"/> Tải File Mẫu Excel ({EXCEL_FIELDS.length} cột)
                </Button>
              </div>

              <div className="w-full max-w-2xl bg-white p-10 rounded-xl border border-dashed border-2 border-slate-300 flex flex-col items-center justify-center transition-colors hover:bg-slate-50">
                <UploadCloud className="w-14 h-14 text-teal-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">Bước 2: Tải lên file Excel đã điền</h3>
                <p className="text-sm text-slate-500 mb-6">Hệ thống sẽ tự động quét và báo lỗi nếu có dữ liệu sai định dạng.</p>
                
                <input type="file" id="excel-upload" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="excel-upload" className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all flex items-center gap-2">
                  <FileUp className="w-5 h-5" /> Chọn file Excel tải lên
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Kiểm tra dữ liệu ({previewRows.length} nhân sự)</h3>
                  <p className="text-sm text-slate-500">{fileName}</p>
                </div>
                {previewRows.some(row => Object.keys(row.errors).length > 0) && (
                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 px-3 py-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4"/> Phát hiện lỗi (Ô màu đỏ)
                  </Badge>
                )}
              </div>
              
              <div className="overflow-auto border rounded-lg custom-scrollbar">
                <Table className="w-max min-w-full">
                  <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[50px] border-r border-slate-200">STT</TableHead>
                      {EXCEL_FIELDS.map(col => (
                        <TableHead key={col.id} className="border-r border-slate-200 whitespace-nowrap font-bold text-slate-700">{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="border-r border-slate-200 font-medium text-center bg-slate-50">
                          {row.isSuccess ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : index + 1}
                        </TableCell>
                        {EXCEL_FIELDS.map(col => {
                          const hasError = row.errors[col.path];
                          const keys = col.path.split('.');
                          let val = row.data;
                          // Dùng try-catch ẩn hoặc optional chaining đảm bảo không chết UI nếu obj bị thiếu node
                          for(let k of keys) {
                            val = val?.[k];
                          }
                          
                          return (
                            <TableCell key={col.id} className={`border-r p-0 border-slate-200 ${hasError ? 'bg-rose-50' : ''} ${row.isSuccess ? 'bg-emerald-50 opacity-60' : ''}`}>
                              {col.type === 'select' ? (
                                <select 
                                  disabled={row.isSuccess}
                                  value={val || ""}
                                  onChange={(e) => handleUpdateCell(index, col.path, e.target.value)}
                                  className={`w-full min-w-[150px] h-10 p-2 text-sm outline-none bg-transparent transition-colors cursor-pointer
                                    ${hasError ? 'border-[1.5px] border-rose-500 text-rose-900 font-bold' : 'border border-transparent hover:border-slate-300'}
                                  `}
                                >
                                  <option value="">-- Chọn --</option>
                                  {(col as any).isDepartment 
                                    ? departmentsList.map((d:any) => <option key={d._id} value={d.name}>{d.name}</option>)
                                    : ((col as any).options as any[]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                                  }
                                </select>
                              ) : (
                                <input 
                                  type={col.type === 'date' ? "date" : "text"} 
                                  disabled={row.isSuccess}
                                  value={val || ""}
                                  title={hasError || ""}
                                  onChange={(e) => handleUpdateCell(index, col.path, e.target.value)}
                                  className={`w-full min-w-[120px] h-10 p-2 text-sm outline-none bg-transparent transition-colors
                                    ${hasError ? 'border-[1.5px] border-rose-500 text-rose-900 font-bold' : 'border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500'}
                                    ${row.isSuccess ? 'cursor-not-allowed' : ''}
                                  `}
                                />
                              )}
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

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>Đóng</Button>
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => { setStep(1); setFileName(null); setPreviewRows([]); }} disabled={isImporting}>
                &larr; Chọn file khác
              </Button>
              <Button 
                onClick={handleSubmitValidatedData} 
                className="bg-teal-600 hover:bg-teal-700 shadow-md px-8" 
                disabled={isImporting || previewRows.some(r => Object.keys(r.errors).length > 0 && !r.isSuccess) || previewRows.every(r => r.isSuccess)}
              >
                {isImporting ? "Đang lưu..." : "LƯU VÀO HỆ THỐNG"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};