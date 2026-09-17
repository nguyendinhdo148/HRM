import React from "react";
// @ts-ignore - contractTemplate declaration is unavailable in this workspace
import { CONTRACT_TYPE_LABEL } from "./contractTemplate";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (n?: number) =>
  n ? Number(n).toLocaleString("vi-VN") + " đồng" : "...............";

const formatDate = (d?: string) => {
  if (!d) return "...............";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "...............";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const formatAddress = (addr: any) => {
  if (!addr) return "...............";
  if (typeof addr === "string") return addr || "...............";
  const parts = [addr.houseStreet, addr.ward, addr.province].filter(Boolean);
  return parts.length ? parts.join(", ") : "...............";
};

interface Props {
  employee: any;
  companyInfo: any;
  template: any;
  overrides: {
    contractNumber: string;
    signDate: string;
  };
}

// ============================================================
// COMPONENT
// ============================================================

export const ContractA4Template: React.FC<Props> = ({
  employee,
  companyInfo,
  template,
  overrides,
}) => {
  const signDate = overrides.signDate ? new Date(overrides.signDate) : new Date();
  const signDay = String(signDate.getDate()).padStart(2, "0");
  const signMonth = String(signDate.getMonth() + 1).padStart(2, "0");
  const signYear = String(signDate.getFullYear());

  const map: Record<string, string> = {
    // Công ty
    companyName: companyInfo.name || "...............",
    companyAddress: companyInfo.address || "...............",
    companyTaxCode: companyInfo.taxCode || "...............",
    companyRepresentative: companyInfo.representative || "...............",
    companyRepresentativePosition: companyInfo.representativePosition || "...............",
    companyPhone: companyInfo.phone || "...............",
    companyFax: companyInfo.fax || "...............",
    workLocation: companyInfo.workLocation || companyInfo.address || "...............",

    // Người lao động
    fullName: employee.fullName || "...............",
    dateOfBirth: formatDate(employee.personalInfo?.dateOfBirth),
    idCardNumber: employee.idCardNumber || "...............",
    idCardIssueDate: formatDate(employee.personalInfo?.idCardIssueDate),
    idCardIssuePlace: employee.personalInfo?.idCardIssuePlace || "...............",
    permanentAddress: formatAddress(employee.personalInfo?.permanentAddress),
    currentAddress: formatAddress(employee.personalInfo?.currentAddress),
    phoneNumber: employee.phoneNumber || "...............",
    position: employee.workInfo?.position || employee.workInfo?.title || "...............",
    jobDescription: employee.workInfo?.jobDescription || "Theo sự phân công của Công ty.",
    workingTime: employee.workInfo?.workingTime || "8 tiếng/ngày, từ thứ 2 đến thứ 7",

    // Hợp đồng
    contractNumber: overrides.contractNumber || "......",
    contractTypeLabel: CONTRACT_TYPE_LABEL[template.key] || template.title,
    startDate: formatDate(employee.workInfo?.joinDate),
    endDate: employee.contractInfo?.endDate
      ? formatDate(employee.contractInfo.endDate)
      : "Không xác định thời hạn",

    // Lương
    baseSalary: formatCurrency(employee.salaryAndBenefits?.baseSalary),
    insuranceSalary: formatCurrency(employee.salaryAndBenefits?.insuranceSalary),
    paymentMethod: employee.salaryAndBenefits?.paymentMethod || "Chuyển khoản",
    paymentPeriod: employee.salaryAndBenefits?.paymentPeriod || "Mùng 5 hàng tháng",

    // Ngày ký
    signDay,
    signMonth,
    signYear,
  };

  const fill = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] ?? `{{${key}}}`);

  return (
    <div className="contract-a4" style={{ color: "#000" }}>
      {/* ===== HEADER QUỐC HIỆU ===== */}
      <div style={{ textAlign: "center", lineHeight: 1.3, marginBottom: "16pt" }}>
        <div style={{ fontWeight: "bold", fontSize: "13pt" }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div style={{ fontWeight: "bold", fontSize: "13pt" }}>
          Độc lập – Tự do – Hạnh phúc
        </div>
        <div style={{ marginTop: "4pt" }}>---------------o0o---------------</div>
      </div>

      {/* ===== TÊN HỢP ĐỒNG ===== */}
      <div style={{ textAlign: "center", margin: "20pt 0 16pt 0" }}>
        <div
          style={{
            fontSize: "15pt",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5pt",
          }}
        >
          {template.title}
        </div>
        <div style={{ fontStyle: "italic", marginTop: "6pt" }}>
          {fill(template.number)}
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div
        className="contract-body"
        style={{
          whiteSpace: "pre-wrap",
          textAlign: "justify",
          lineHeight: 1.55,
          fontSize: "13pt",
        }}
      >
        {fill(template.body)}
      </div>

      {/* ===== CHỮ KÝ ===== */}
      <div
        className="signature-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20pt",
          marginTop: "32pt",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", fontSize: "13pt" }}>NGƯỜI LAO ĐỘNG</div>
          <div style={{ fontStyle: "italic", fontSize: "11pt", marginTop: "2pt" }}>
            (Ký tên, ghi rõ họ tên)
          </div>
          <div style={{ height: "80pt" }}></div>
          <div style={{ fontWeight: "bold", fontSize: "13pt" }}>
            {employee.fullName || "..............."}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", fontSize: "13pt" }}>
            NGƯỜI SỬ DỤNG LAO ĐỘNG
          </div>
          <div style={{ fontStyle: "italic", fontSize: "11pt", marginTop: "2pt" }}>
            (Ký tên, ghi rõ họ tên, đóng dấu)
          </div>
          <div style={{ height: "80pt" }}></div>
          <div style={{ fontWeight: "bold", fontSize: "13pt" }}>
            {companyInfo.representative || "..............."}
          </div>
        </div>
      </div>
    </div>
  );
};