import { TaxRecord } from "../models/TaxRecord.js";
import { Employee } from "../models/Employee.js";
import { PayrollRecord } from "../models/PayrollRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";

// ===== HẰNG SỐ =====
const COMPANY_INSURANCE_SUPPORT = 88000;
const FIXED_INSURANCE_ADVANCE = 500000;   // ✅ THÊM

export const getTaxMonths = async (req, res) => {
  try {
    const months = await TaxRecord.aggregate([
      { $group: { _id: { month: "$month", year: "$year" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $project: { _id: 0, month: "$_id.month", year: "$_id.year" } }
    ]);
    res.status(200).json(months);
  } catch (error) { 
    res.status(500).json({ message: "Lỗi lấy danh sách kỳ Thuế" }); 
  }
};

export const getTaxByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const records = await TaxRecord.find({ month: Number(month), year: Number(year) })
      .sort({ "employeeSnapshot.employeeCode": 1 });
    res.status(200).json(records);
  } catch (error) { 
    res.status(500).json({ message: "Lỗi lấy dữ liệu Thuế" }); 
  }
};

// ===== KHỞI TẠO BẢNG THUẾ =====
// ===== KHỞI TẠO BẢNG THUẾ =====
export const initializeTaxMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    const existingData = await TaxRecord.findOne({ month, year });

    if (existingData) {
      await TaxRecord.deleteMany({ month, year });
    }

    const activeEmployees = await Employee.find({
      status: "active",
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const resignedThisMonth = await Employee.find({
      status: "resigned",
      "workInfo.resignationDate": {
        $gte: start,
        $lte: end,
      },
    });

    const allEmployees = [
      ...activeEmployees,
      ...resignedThisMonth,
    ];

    const payrolls = await PayrollRecord.find({
      month,
      year,
    });

    const insurances = await InsuranceRecord.find({
      month,
      year,
    });

    const taxDocs = allEmployees.map((emp) => {
      const payroll = payrolls.find(
        (p) =>
          p.employee?.toString() === emp._id.toString()
      );

      const insurance = insurances.find(
        (i) =>
          i.employee?.toString() === emp._id.toString()
      );

      const payrollAllowances =
        payroll?.incomes?.allowances || {};

      // ===== 1. LƯƠNG GROSS =====
      const grossFromPayroll = payroll
        ? payroll.incomes.totalGross
        : 0;

      // ===== 2. BHXH NHÂN VIÊN ĐÓNG =====
      const employeeInsuranceTotal =
        insurance?.employeePays?.total || 0;

      const insuranceAfterSupport = Math.max(
        0,
        employeeInsuranceTotal - COMPANY_INSURANCE_SUPPORT
      );

      // ===== 3. TIỀN Ở =====
      const housingAllowance =
        payrollAllowances.housingAllowance || 0;

      return {
        month,
        year,

        employee: emp._id,

        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position:
            emp.workInfo?.position || "Chưa có",
        },

        // ===== THU NHẬP CHỊU THUẾ =====
        taxableIncome: grossFromPayroll,

        deductions: {
          personal: 15500000,

          dependent: 0,

          // BHXH sau khi trừ 88k công ty hỗ trợ
          insurance: insuranceAfterSupport,

          // ===== MẶC ĐỊNH TẠM ỨNG BHXH = 500.000 =====
          // Sau này người dùng có thể chỉnh sửa
          // và giá trị mới sẽ được lưu vào DB.
          insuranceAdvance: 500000,

          // Tiền ở
          housingAllowance,

          // Model pre("save") sẽ tính lại
          total: 0,
        },
      };
    });

    const createdRecords = await TaxRecord.insertMany(
      taxDocs
    );

    // Chạy pre("save") để tính:
    // - total
    // - assessableIncome
    // - taxAmount
    for (const doc of createdRecords) {
      const record = await TaxRecord.findById(doc._id);

      if (record) {
        await record.save();
      }
    }

    res.status(201).json({
      message: `Đã khởi tạo Bảng Thuế TNCN tháng ${month}/${year} cho ${allEmployees.length} nhân sự.`,
    });
  } catch (error) {
    console.error(
      "Lỗi khởi tạo Bảng Thuế:",
      error
    );

    res.status(500).json({
      message: "Lỗi khởi tạo Bảng Thuế",
    });
  }
};

export const updateTaxRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const {
      dependents,
      taxableIncome,
      insuranceAdvance,
    } = req.body;

    const record = await TaxRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi",
      });
    }

    // ===== CẬP NHẬT SỐ NGƯỜI PHỤ THUỘC =====
    if (dependents !== undefined) {
      record.dependents = Number(dependents);
    }

    // ===== CẬP NHẬT LƯƠNG CHỊU THUẾ =====
    if (taxableIncome !== undefined) {
      record.taxableIncome = Number(taxableIncome);
    }

    // ===== CẬP NHẬT TẠM ỨNG BHXH =====
    if (insuranceAdvance !== undefined) {
      const value = Number(insuranceAdvance);

      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({
          message:
            "Tạm ứng BHXH phải là số lớn hơn hoặc bằng 0",
        });
      }

      // Giá trị người dùng sửa sẽ được lưu vào DB
      record.deductions.insuranceAdvance = value;
    }

    // ===== SAVE =====
    // pre("save") trong TaxRecord sẽ tự động tính lại:
    // - deductions.total
    // - assessableIncome
    // - taxAmount
    await record.save();

    res.status(200).json({
      message: "Cập nhật thành công",
      data: record,
    });
  } catch (error) {
    console.error(
      "Lỗi cập nhật Thuế:",
      error
    );

    res.status(500).json({
      message: "Lỗi cập nhật Thuế",
    });
  }
};

export const deleteTaxMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    await TaxRecord.deleteMany({ month: Number(month), year: Number(year) });
    res.status(200).json({ message: "Đã xóa toàn bộ Bảng Thuế TNCN" });
  } catch (error) { 
    res.status(500).json({ message: "Lỗi xóa bảng Thuế" }); 
  }
};