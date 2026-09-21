import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const brevoUser = process.env.BREVO_USER;
const brevoPassword = process.env.BREVO_PASS;

if (!brevoUser || !brevoPassword) {
  console.error("Missing BREVO_USER or BREVO_PASS in environment variables.");
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: { user: brevoUser, pass: brevoPassword },
});

export const sendEmail = async (to, subject, html) => {
  if (!brevoUser || !brevoPassword) {
    console.error("Email not sent because environment vars are not configured.");
    return false;
  }
  try {
    const info = await transporter.sendMail({
      from: { name: "LighHouse HR", address: "nguyendinhdo2k4@gmail.com" },
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Full email error:", error);
    return false;
  }
};

const formatMoney = (amount) => {
  if (!amount || Number(amount) === 0) return "0";
  return Number(amount).toLocaleString("vi-VN");
};

const hasValue = (value) => {
  const num = Number(value);
  if (!Number.isNaN(num)) return num > 0;
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
};

// ==================================================
// TEMPLATE PHIẾU LƯƠNG — CÓ GHI RÕ CÔNG THỨC SHOW
// ==================================================
export const buildPayslipTemplate = (record, companyName = "CÔNG TY CỔ PHẦN XYZ") => {
  const emp = record.employeeSnapshot || {};
  const inc = record.incomes || {};
  const ded = record.deductions || {};
  const allw = inc.allowances || {};
  const housingValue = Number(allw.housingAllowance ?? allw.housing ?? 0);
  const payslipCode = `${record.year}${String(record.month).padStart(2, "0")}${emp.employeeCode || ""}`;

  // ===== CHI TIẾT THU NHẬP =====
  const incomeRows = [];

  if (hasValue(inc.timeSalary))
    incomeRows.push([
      "Lương theo ngày công",
      formatMoney(inc.timeSalary),
      `Lương cơ bản × ${record.actualDays || 0} / ${record.standardDays || 26} ngày`
    ]);

  if (hasValue(inc.overtime))
    incomeRows.push([
      "Lương làm thêm giờ",
      formatMoney(inc.overtime),
      "Tiền làm thêm ngoài giờ hành chính"
    ]);

  // ✅ MINI SHOW — có ghi rõ SL × Đơn giá
  if (hasValue(inc.miniShowMoney)) {
    const cnt = Number(inc.miniShowCount || 0);
    const rate = Number(inc.miniShowRate || 0);
    const note = (cnt > 0 && rate > 0)
      ? `${cnt} show × ${formatMoney(rate)} đ/show`
      : "Số lượng mini show × đơn giá";
    incomeRows.push(["Tiền Mini Show", formatMoney(inc.miniShowMoney), note]);
  }

  // ✅ BIG SHOW — có ghi rõ SL × Đơn giá
  if (hasValue(inc.bigShowMoney)) {
    const cnt = Number(inc.bigShowCount || 0);
    const rate = Number(inc.bigShowRate || 0);
    const note = (cnt > 0 && rate > 0)
      ? `${cnt} show × ${formatMoney(rate)} đ/show`
      : "Số lượng big show × đơn giá";
    incomeRows.push(["Tiền Big Show", formatMoney(inc.bigShowMoney), note]);
  }

  if (hasValue(inc.kpiBonus))
    incomeRows.push([
      "Thưởng KPI",
      formatMoney(inc.kpiBonus),
      "Thưởng hiệu suất theo số công và show"
    ]);

  if (hasValue(allw.meal))
    incomeRows.push([
      "Tiền ăn ca",
      formatMoney(allw.meal),
      "Theo số ngày công, tối đa 1.800.000đ/tháng"
    ]);

  if (hasValue(allw.housingAllowance))
    incomeRows.push([
      "Phụ cấp nhà ở",
      formatMoney(allw.housingAllowance),
      "Chi phí ở trừ KTX (nếu có)"
    ]);

  // ✅ CA TẬP — có ghi rõ SL × Đơn giá
  if (hasValue(allw.trainingAllowance)) {
    const rate = Number(allw.trainingAllowanceRate || 0);
    const cnt = Number(inc.bigShowCount || 0);
    const note = (cnt > 0 && rate > 0)
      ? `${cnt} buổi × ${formatMoney(rate)} đ/buổi`
      : "Đơn giá × số buổi ca tập";
    incomeRows.push(["Phụ cấp ca tập", formatMoney(allw.trainingAllowance), note]);
  }

  if (hasValue(allw.transport))
    incomeRows.push(["Phụ cấp xăng xe", formatMoney(allw.transport), ""]);
  if (hasValue(allw.phone))
    incomeRows.push(["Phụ cấp điện thoại", formatMoney(allw.phone), ""]);
  if (hasValue(allw.clothing))
    incomeRows.push(["Phụ cấp trang phục", formatMoney(allw.clothing), ""]);
  if (hasValue(inc.bonus))
    incomeRows.push(["Thưởng khác", formatMoney(inc.bonus), ""]);

  // ===== CHI TIẾT GIẢM TRỪ =====
  const deductionRows = [];
  if (hasValue(ded.insurance?.bhxh))
    deductionRows.push(["BHXH (8%)", formatMoney(ded.insurance.bhxh), "Đã trừ vào Tổng thu nhập"]);
  if (hasValue(ded.insurance?.bhyt))
    deductionRows.push(["BHYT (1.5%)", formatMoney(ded.insurance.bhyt), "Đã trừ vào Tổng thu nhập"]);
  if (hasValue(ded.insurance?.bhtn))
    deductionRows.push(["BHTN (1%)", formatMoney(ded.insurance.bhtn), "Đã trừ vào Tổng thu nhập"]);
  if (hasValue(ded.taxTNCN))
    deductionRows.push(["Thuế TNCN", formatMoney(ded.taxTNCN), "Công ty hỗ trợ 100%"]);
  if (hasValue(ded.advance))
    deductionRows.push(["Tạm ứng lương", formatMoney(ded.advance), "Đã tạm ứng trong kỳ"]);

  const totalDeductions = Number(ded.totalDeductions || 0);
  const adjustment = Number(inc.adjustment || 0);
const finalNet = Number(record.netSalary || 0) + adjustment;
  const totalGross = Number(inc.totalGross || 0);

  // ===== BUILD ROWS HTML =====
  const incomeRowsHtml = incomeRows
    .map(([label, value, note], idx) => `
      <tr style="background-color:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#374151; font-family:Arial,Helvetica,sans-serif;">
          <div style="font-weight:600;">${label}</div>
          ${note ? `<div style="font-size:11px; color:#9ca3af; margin-top:2px; font-style:italic;">${note}</div>` : ""}
        </td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:13px; font-weight:700; color:#111827; font-family:Arial,Helvetica,sans-serif; white-space:nowrap; vertical-align:top;">${value}</td>
      </tr>`).join("");

  const deductionRowsHtml = deductionRows
    .map(([label, value, note], idx) => `
      <tr style="background-color:${idx % 2 === 0 ? "#ffffff" : "#fef2f2"};">
        <td style="padding:8px 12px; border-bottom:1px solid #fecaca; font-size:13px; color:#7f1d1d; font-family:Arial,Helvetica,sans-serif;">
          <div style="font-weight:600;">${label}</div>
          ${note ? `<div style="font-size:11px; color:#f87171; margin-top:2px; font-style:italic;">${note}</div>` : ""}
        </td>
        <td style="padding:8px 12px; border-bottom:1px solid #fecaca; text-align:right; font-size:13px; font-weight:700; color:#991b1b; font-family:Arial,Helvetica,sans-serif; white-space:nowrap; vertical-align:top;">${value}</td>
      </tr>`).join("");

  return `
  <div style="margin:0; padding:12px; background-color:#f1f5f9; font-family:Arial,Helvetica,sans-serif;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:10px; border:1px solid #e2e8f0; font-family:Arial,Helvetica,sans-serif;">

      <!-- HEADER -->
      <tr>
        <td style="background-color:#1e40af; padding:14px 18px; border-radius:10px 10px 0 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="color:#ffffff; font-size:14px; font-weight:700; font-family:Arial,Helvetica,sans-serif;">${companyName}</td></tr>
            <tr><td style="color:#bfdbfe; font-size:11px; padding-top:4px; font-family:Arial,Helvetica,sans-serif;">Mã phiếu: <span style="color:#ffffff; font-weight:700;">${payslipCode}</span></td></tr>
          </table>
        </td>
      </tr>

      <!-- TIÊU ĐỀ -->
      <tr>
        <td style="text-align:center; padding:18px 18px 12px 18px;">
          <div style="font-size:18px; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:0.5px; font-family:Arial,Helvetica,sans-serif;">PHIẾU LƯƠNG NHÂN VIÊN</div>
          <div style="font-size:12px; color:#64748b; margin-top:5px; font-family:Arial,Helvetica,sans-serif;">Tháng ${record.month < 10 ? "0" + record.month : record.month} / ${record.year}</div>
        </td>
      </tr>

      <!-- THÔNG TIN NV -->
      <tr>
        <td style="padding:6px 18px 14px 18px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="padding:4px 0; font-size:13px; color:#64748b; width:90px;">Họ và tên:</td>
              <td style="padding:4px 0; font-size:13px; color:#111827; font-weight:700;">${emp.fullName || "-"}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; font-size:13px; color:#64748b;">Mã NV:</td>
              <td style="padding:4px 0; font-size:13px; color:#111827; font-weight:700;">${emp.employeeCode || "-"}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; font-size:13px; color:#64748b;">Phòng ban:</td>
              <td style="padding:4px 0; font-size:13px; color:#374151;">${emp.department || "-"}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; font-size:13px; color:#64748b;">Chức vụ:</td>
              <td style="padding:4px 0; font-size:13px; color:#374151;">${emp.position || "-"}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; font-size:13px; color:#64748b;">Ngày công:</td>
              <td style="padding:4px 0; font-size:13px; color:#374151;">${record.actualDays || 0} / ${record.standardDays || 26} ngày</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ===== PHẦN A: CHI TIẾT THU NHẬP ===== -->
      <tr>
        <td style="padding:0 18px;">
          <div style="background-color:#1e40af; color:#ffffff; padding:8px 14px; font-size:12px; font-weight:700; text-transform:uppercase; border-radius:6px 6px 0 0; font-family:Arial,Helvetica,sans-serif;">
            (A) Chi tiết thu nhập
          </div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; border:1px solid #cbd5e1; border-top:none; font-family:Arial,Helvetica,sans-serif;">
            ${incomeRowsHtml}
            <tr style="background-color:#fef3c7;">
              <td style="padding:10px 14px; font-weight:700; color:#92400e; font-size:13px; font-family:Arial,Helvetica,sans-serif;">TỔNG THU NHẬP (A)</td>
              <td style="padding:10px 14px; text-align:right; font-weight:700; color:#92400e; font-size:14px; font-family:Arial,Helvetica,sans-serif; white-space:nowrap;">${formatMoney(totalGross)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ===== PHẦN B: CHI TIẾT GIẢM TRỪ ===== -->
      ${
        deductionRows.length > 0
          ? `
      <tr>
        <td style="padding:14px 18px 0 18px;">
          <div style="background-color:#b91c1c; color:#ffffff; padding:8px 14px; font-size:12px; font-weight:700; text-transform:uppercase; border-radius:6px 6px 0 0; font-family:Arial,Helvetica,sans-serif;">
            (B) Chi tiết các khoản giảm trừ
          </div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; border:1px solid #fecaca; border-top:none; font-family:Arial,Helvetica,sans-serif;">
            ${deductionRowsHtml}
            <tr style="background-color:#fee2e2;">
              <td style="padding:10px 14px; font-weight:700; color:#991b1b; font-size:13px; font-family:Arial,Helvetica,sans-serif;">TỔNG GIẢM TRỪ (B)</td>
              <td style="padding:10px 14px; text-align:right; font-weight:700; color:#991b1b; font-size:14px; font-family:Arial,Helvetica,sans-serif; white-space:nowrap;">${formatMoney(totalDeductions)}</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#9ca3af; font-style:italic; padding:6px 4px 0 4px; font-family:Arial,Helvetica,sans-serif;">
            * BHXH/BHYT/BHTN đã được trừ vào Tổng thu nhập (A), hiển thị ở đây để tham khảo.
          </div>
        </td>
      </tr>`
          : ""
      }

      <!-- ===== PHẦN C: THỰC LĨNH ===== -->
      <tr>
        <td style="padding:14px 18px 0 18px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; border:2px solid #10b981; border-radius:8px; overflow:hidden; background-color:#ecfdf5; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="padding:14px; font-family:Arial,Helvetica,sans-serif;">
                <div style="font-weight:700; color:#065f46; font-size:13px; text-transform:uppercase;">(C) TỔNG THỰC LĨNH</div>
                <div style="font-size:11px; color:#059669; margin-top:3px; font-style:italic;">Công thức: (C) = (A) - (B)</div>
              </td>
              <td style="padding:14px; text-align:right; font-weight:700; color:#047857; font-size:18px; font-family:Arial,Helvetica,sans-serif; white-space:nowrap; vertical-align:middle;">
                ${formatMoney(finalNet)} <span style="font-size:11px; font-weight:500;">VNĐ</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ===== BẢNG TÓM TẮT ===== -->
      <tr>
        <td style="padding:14px 18px 0 18px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="padding:10px 14px; font-size:12px; color:#475569; font-family:Arial,Helvetica,sans-serif;">Tổng thu nhập (A)</td>
              <td style="padding:10px 14px; text-align:right; font-size:12px; color:#0f172a; font-weight:700; font-family:Arial,Helvetica,sans-serif; white-space:nowrap;">${formatMoney(totalGross)}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:10px 14px; font-size:12px; color:#475569; font-family:Arial,Helvetica,sans-serif;">− Tổng giảm trừ (B)</td>
              <td style="padding:10px 14px; text-align:right; font-size:12px; color:#b91c1c; font-weight:700; font-family:Arial,Helvetica,sans-serif; white-space:nowrap;">${formatMoney(totalDeductions)}</td>
            </tr>
            <tr style="border-top:2px solid #10b981; background-color:#ecfdf5;">
              <td style="padding:10px 14px; font-size:13px; color:#065f46; font-weight:700; font-family:Arial,Helvetica,sans-serif;">= Thực lĩnh (C)</td>
              <td style="padding:10px 14px; text-align:right; font-size:14px; color:#047857; font-weight:700; font-family:Arial,Helvetica,sans-serif; white-space:nowrap;">${formatMoney(finalNet)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CHỮ KÝ -->
      <tr>
        <td style="padding:22px 18px 18px 18px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="text-align:center; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td width="50%" style="padding:0 4px;">
                <div style="font-weight:700; color:#334155; font-size:12px; text-transform:uppercase; font-family:Arial,Helvetica,sans-serif;">NGƯỜI LẬP PHIẾU</div>
                <div style="font-size:11px; color:#94a3b8; font-style:italic; margin-top:3px; font-family:Arial,Helvetica,sans-serif;">(Ký, ghi rõ họ tên)</div>
                <div style="height:50px;"></div>
                <div style="border-top:1px solid #cbd5e1; width:100px; margin:0 auto;"></div>
              </td>
              <td width="50%" style="padding:0 4px;">
                <div style="font-weight:700; color:#334155; font-size:12px; text-transform:uppercase; font-family:Arial,Helvetica,sans-serif;">NGƯỜI NHẬN</div>
                <div style="font-size:11px; color:#94a3b8; font-style:italic; margin-top:3px; font-family:Arial,Helvetica,sans-serif;">(Ký, ghi rõ họ tên)</div>
                <div style="height:50px;"></div>
                <div style="border-top:1px solid #cbd5e1; width:100px; margin:0 auto;"></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:12px 18px; text-align:center; border-radius:0 0 10px 10px;">
          <div style="font-size:11px; color:#94a3b8; font-style:italic; font-family:Arial,Helvetica,sans-serif;">
            Mọi thắc mắc về phiếu lương, vui lòng liên hệ phòng Nhân sự.<br>
            Email gửi tự động, vui lòng không trả lời.
          </div>
        </td>
      </tr>

    </table>
  </div>
  `;
};