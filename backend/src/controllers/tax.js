import { TaxRecord } from "../models/TaxRecord.js";
import { Employee } from "../models/Employee.js";
import { PayrollRecord } from "../models/PayrollRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";

export const getTaxMonths = async (req, res) => {
  try {
    const months = await TaxRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year" } }
    ]);
    res.status(200).json(months);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy danh sách kỳ Thuế" }); }
};

export const getTaxByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const records = await TaxRecord.find({ month: Number(month), year: Number(year) }).sort({ "employeeSnapshot.employeeCode": 1 });
    res.status(200).json(records);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy dữ liệu Thuế" }); }
};

// LIÊN KẾT CHÉO CÁC MODEL KHỞI TẠO BẢNG THUẾ
export const initializeTaxMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    const existingData = await TaxRecord.findOne({ month, year });
    if (existingData) {
      await TaxRecord.deleteMany({ month, year });
    }

    const activeEmployees = await Employee.find({ status: "active" });

    // Kéo dữ liệu từ Bảng Lương và Bảng Bảo Hiểm CÙNG THÁNG/NĂM
    const payrolls = await PayrollRecord.find({ month, year });
    const insurances = await InsuranceRecord.find({ month, year });

    // ... bên trong hàm initializeTaxMonth
const taxDocs = activeEmployees.map((emp) => {
  const payroll = payrolls.find(p => p.employee?.toString() === emp._id.toString());
  const insurance = insurances.find(i => i.employee?.toString() === emp._id.toString());

  return {
    month, year, employee: emp._id,
    employeeSnapshot: {
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      position: emp.workInfo?.position || "Chưa có" // ✅ Sửa ở đây
    },
    taxableIncome: payroll ? payroll.incomes.totalGross : (emp.salaryAndBenefits?.baseSalary || 0),
    dependents: emp.personalInfo?.dependents || 0,
    deductions: { insurance: insurance ? insurance.employeePays.total : 0 }
  };
});

    const createdRecords = await TaxRecord.insertMany(taxDocs);
    for (const doc of createdRecords) {
      const record = await TaxRecord.findById(doc._id);
      await record.save(); // Gọi Hook để tính ra kết quả Thuế
    }

    res.status(201).json({ message: `Tạo Bảng Thuế TNCN thành công cho ${activeEmployees.length} nhân sự.` });
  } catch (error) { res.status(500).json({ message: "Lỗi khởi tạo Bảng Thuế" }); }
};

export const updateTaxRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { dependents, taxableIncome } = req.body;

    const record = await TaxRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    if (dependents !== undefined) record.dependents = Number(dependents);
    if (taxableIncome !== undefined) record.taxableIncome = Number(taxableIncome);

    await record.save();
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) { res.status(500).json({ message: "Lỗi cập nhật Thuế" }); }
};

export const deleteTaxMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    await TaxRecord.deleteMany({ month: Number(month), year: Number(year) });
    res.status(200).json({ message: "Đã xóa toàn bộ Bảng Thuế TNCN" });
  } catch (error) { res.status(500).json({ message: "Lỗi xóa bảng Thuế" }); }
};