export interface CompanyInfo {
  name: string;
  address: string;
  taxCode: string;
  representative: string;
  representativePosition: string;
  phone: string;
  fax: string;
  workLocation: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "CÔNG TY TNHH [...]",
  address: "..........................................................",
  taxCode: "..........................................................",
  representative: "..........................................................",
  representativePosition: "Giám đốc",
  phone: "..........................................................",
  fax: "..........................................................",
  workLocation: "..........................................................",
};

export const getCompanyInfo = (): CompanyInfo => {
  try {
    const saved = localStorage.getItem("hrm_company_info");
    return saved ? { ...DEFAULT_COMPANY_INFO, ...JSON.parse(saved) } : DEFAULT_COMPANY_INFO;
  } catch {
    return DEFAULT_COMPANY_INFO;
  }
};

export const saveCompanyInfo = (info: CompanyInfo): void => {
  localStorage.setItem("hrm_company_info", JSON.stringify(info));
};