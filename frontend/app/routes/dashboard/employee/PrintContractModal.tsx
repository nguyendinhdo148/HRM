import React, { useState, useRef } from "react";
import { X, Printer, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTRACT_TEMPLATES } from "./contractTemplate";
import { getCompanyInfo, saveCompanyInfo } from "./companyInfo";
import { ContractA4Template } from "./ContractA4Template";

export const PrintContractModal = ({ isOpen, onClose, employee }: any) => {
  if (!isOpen || !employee) return null;

  const [companyInfo, setCompanyInfo] = useState(getCompanyInfo());
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [templateKey, setTemplateKey] = useState(
    employee.contractInfo?.contractType || "FIXED_TERM"
  );
  const [overrides, setOverrides] = useState({
    contractNumber: employee.contractInfo?.contractNumber || "",
    signDate: new Date().toISOString().split("T")[0],
  });
  const printRef = useRef<HTMLDivElement>(null);

  const template = CONTRACT_TEMPLATES[templateKey];

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return alert("Vui lòng cho phép popup để in!");

    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hợp đồng lao động - ${employee.fullName || ""}</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 15mm 25mm; }
            * { box-sizing: border-box; }
            body {
              font-family: "Times New Roman", Times, serif;
              font-size: 13pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
            }
            .contract-a4 { width: 100%; }
            .contract-body {
              white-space: pre-wrap;
              text-align: justify;
            }
            .text-center { text-align: center; }
            .text-xs { font-size: 10pt; }
            .text-lg { font-size: 15pt; }
            .font-bold { font-weight: bold; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .mb-4 { margin-bottom: 12pt; }
            .my-4 { margin: 12pt 0; }
            .mt-8 { margin-top: 24pt; }
            .leading-tight { line-height: 1.25; }
            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20pt;
            }
            .signature-space { height: 80pt; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      // Không tự close để user có thể in lại
    }, 400);
  };

  const handleSaveCompanyInfo = (key: string, value: string) => {
    const next = { ...companyInfo, [key]: value };
    setCompanyInfo(next);
    saveCompanyInfo(next);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold">
            📄 In Hợp đồng lao động — {employee.fullName || "Chưa có tên"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b bg-slate-50 flex flex-wrap items-center gap-3 text-sm">
          <label className="font-medium">Loại HĐ:</label>
          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {Object.values(CONTRACT_TEMPLATES).map((t: any) => (
              <option key={t.key} value={t.key}>{t.title}</option>
            ))}
          </select>

          <label className="font-medium ml-2">Số HĐ:</label>
          <input
            type="text"
            value={overrides.contractNumber}
            onChange={(e) => setOverrides({ ...overrides, contractNumber: e.target.value })}
            className="border rounded px-2 py-1 w-28"
            placeholder="VD: 01"
          />

          <label className="font-medium ml-2">Ngày ký:</label>
          <input
            type="date"
            value={overrides.signDate}
            onChange={(e) => setOverrides({ ...overrides, signDate: e.target.value })}
            className="border rounded px-2 py-1"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompanyForm((v) => !v)}
            className="ml-2"
          >
            <Settings className="w-3 h-3 mr-1" /> Thông tin Công ty
          </Button>

          <Button onClick={handlePrint} className="ml-auto bg-teal-600 hover:bg-teal-700">
            <Printer className="w-4 h-4 mr-2" /> In / Xuất PDF
          </Button>
        </div>

        {/* Form Công ty (collapsible) */}
        {showCompanyForm && (
          <div className="p-4 border-b bg-amber-50 grid grid-cols-2 gap-3 text-sm">
            {[
              { key: "name", label: "Tên Công ty" },
              { key: "address", label: "Địa chỉ" },
              { key: "taxCode", label: "Mã số doanh nghiệp" },
              { key: "representative", label: "Người đại diện" },
              { key: "representativePosition", label: "Chức vụ" },
              { key: "phone", label: "Số điện thoại" },
              { key: "fax", label: "Fax" },
              { key: "workLocation", label: "Địa điểm làm việc" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-0.5">{f.label}</label>
                <input
                  type="text"
                  value={(companyInfo as any)[f.key] || ""}
                  onChange={(e) => handleSaveCompanyInfo(f.key, e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* Preview A4 */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200">
          <div
            ref={printRef}
            className="mx-auto bg-white shadow-lg"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "15mm 15mm 15mm 25mm",
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: "13pt",
            }}
          >
            <ContractA4Template
              employee={employee}
              companyInfo={companyInfo}
              template={template}
              overrides={overrides}
            />
          </div>
        </div>

        <div className="p-3 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
};