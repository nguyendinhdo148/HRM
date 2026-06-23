import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailPassword) {
  console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.");
}

// Khởi tạo Transporter cho Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

export const sendEmail = async (to, subject, html) => {
  if (!gmailUser || !gmailPassword) {
    console.error("Email not sent because environment vars are not configured.");
    return false;
  }

  const mailOptions = {
    from: `"LighHouse" <${gmailUser}>`, // Tên hiển thị khi gửi
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully. Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error.message || error);
    return false;
  }
};

// Hàm format tiền tệ (Ví dụ: 25000000 -> 25.000.000, 0 -> "-")
const formatMoney = (amount) => {
  if (!amount || amount === 0) return "-";
  return amount.toLocaleString("vi-VN");
};

export const buildPayslipTemplate = (record, companyName = "CÔNG TY CỦA BẠN") => {
  // Rút gọn đường dẫn object để code dễ đọc hơn
  const emp = record.employeeSnapshot;
  const inc = record.incomes;
  const ded = record.deductions;
  const allw = inc.allowances;

  return `
    <div style="font-family: 'Times New Roman', Times, serif; color: #000; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">PHIẾU LƯƠNG NHÂN VIÊN</h1>
      </div>

      <div style="margin-bottom: 30px;">
        <div style="font-size: 16px; text-transform: uppercase;">${companyName}</div>
        <h2 style="text-align: center; margin: 20px 0 5px 0; font-size: 20px;">PHIẾU LƯƠNG</h2>
        <div style="text-align: center; font-size: 16px;">Tháng ${
          record.month < 10 ? "0" + record.month : record.month
        } năm ${record.year}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td colspan="2" style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; font-weight: bold;">
            Thông tin người lĩnh
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 3px 0;">Họ và tên: ${emp.fullName}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 3px 0; border-bottom: 1px solid #000;">Mã nhân viên: ${emp.employeeCode}</td>
        </tr>

        <tr>
          <td style="padding: 5px 0; font-weight: bold; border-bottom: 1px solid #ddd;">Tiền lương chi tiết (1)</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">
            ${formatMoney(inc.totalGross)}
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Số công làm việc ngày thường</td>
          <td style="padding: 3px 0; text-align: right;">${record.actualDays}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Tiền lương làm việc ngày thường</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(inc.timeSalary)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Tiền lương làm thêm giờ</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(inc.overtime)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Tiền ăn ca.</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(allw.meal)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Phụ cấp xăng xe.</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(allw.transport)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Phụ cấp điện thoại.</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(allw.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Phụ cấp trang phục.</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(allw.clothing)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; border-bottom: 1px solid #000;">Phụ cấp nhà ở.</td>
          <td style="padding: 3px 0; text-align: right; border-bottom: 1px solid #000;">${formatMoney(allw.housing)}</td>
        </tr>

        <tr>
          <td style="padding: 5px 0; font-weight: bold; border-bottom: 1px solid #ddd;">Tổng các khoản giảm trừ (2)</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">
            ${formatMoney(ded.totalDeductions)}
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Bảo hiểm (công ty hỗ trợ 88.000VNĐ)</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(ded.insurance.total)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">Thuế TNCN (công ty hỗ trợ 100%)</td>
          <td style="padding: 3px 0; text-align: right;">${formatMoney(ded.taxTNCN)}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; border-bottom: 1px solid #000;">Tạm ứng</td>
          <td style="padding: 3px 0; text-align: right; border-bottom: 1px solid #000;">${formatMoney(ded.advance)}</td>
        </tr>

        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #000;">Tổng số thực lĩnh (3) = (1) - (2)</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #000; font-size: 16px;">
            ${formatMoney(record.netSalary)}
          </td>
        </tr>

        <tr>
          <td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; border-bottom: 1px solid #000;">Ghi chú:</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 5px 0; height: 50px;"></td>
        </tr>
      </table>
      
      <p style="text-align: center; color: #555; font-size: 13px; font-family: Arial, sans-serif; margin-top: 30px;">
        Email này được gửi tự động từ hệ thống quản lý nhân sự. Vui lòng không trả lời email này.
      </p>
    </div>
  `;
};