import { TaxRecord } from "../models/TaxRecord.js";
import { Employee } from "../models/Employee.js";
import { PayrollRecord } from "../models/PayrollRecord.js";
import { InsuranceRecord } from "../models/InsuranceRecord.js";

// ===== HẰNG SỐ =====
const COMPANY_INSURANCE_SUPPORT = 88000;
const FIXED_INSURANCE_ADVANCE = 500000;   // ✅ THÊM

export const resolveInsuranceAdvance = ({
  existingInsuranceAdvance,
  payrollInsuranceAdvance,
  fallback = FIXED_INSURANCE_ADVANCE,
}) => {
  if (existingInsuranceAdvance !== null && existingInsuranceAdvance !== undefined && existingInsuranceAdvance !== "") {
    const existingValue = Number(existingInsuranceAdvance);
    if (Number.isFinite(existingValue) && existingValue >= 0) {
      return existingValue;
    }
  }

  if (payrollInsuranceAdvance !== null && payrollInsuranceAdvance !== undefined && payrollInsuranceAdvance !== "") {
    const payrollValue = Number(payrollInsuranceAdvance);
    if (Number.isFinite(payrollValue) && payrollValue >= 0) {
      return payrollValue;
    }
  }

  return fallback;
};

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
// ===== KHỞI TẠO BẢNG THUẾ =====
export const initializeTaxMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    // =====================================================
    // 1. LẤY DỮ LIỆU CŨ CỦA THÁNG NẾU ĐÃ TỒN TẠI
    // =====================================================
    const existingRecords = await TaxRecord.find({
      month: Number(month),
      year: Number(year),
    });

    // Lưu lại Tạm ứng BHXH cũ theo employee ID
    //
    // Ví dụ:
    // employeeId -> 300000
    // employeeId -> 700000
    //
    // Để khi tạo lại bảng không bị reset về 500.000.
    const existingInsuranceAdvance = new Map();

    existingRecords.forEach((record) => {
      if (record.employee) {
        existingInsuranceAdvance.set(
          record.employee.toString(),
          record.deductions?.insuranceAdvance ?? 500000
        );
      }
    });

    // =====================================================
    // 2. XÓA DỮ LIỆU CŨ
    // =====================================================
    if (existingRecords.length > 0) {
      await TaxRecord.deleteMany({
        month: Number(month),
        year: Number(year),
      });
    }

    // =====================================================
    // 3. LẤY NHÂN SỰ ĐANG HOẠT ĐỘNG
    // =====================================================
    const activeEmployees = await Employee.find({
      status: "active",
    });

    // =====================================================
    // 4. LẤY NHÂN SỰ ĐÃ NGHỈ TRONG THÁNG
    // =====================================================
    const start = new Date(
      Number(year),
      Number(month) - 1,
      1
    );

    const end = new Date(
      Number(year),
      Number(month),
      0,
      23,
      59,
      59
    );

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

    // =====================================================
    // 5. LẤY BẢNG LƯƠNG
    // =====================================================
    const payrolls = await PayrollRecord.find({
      month: Number(month),
      year: Number(year),
    });

    // =====================================================
    // 6. LẤY BẢNG BẢO HIỂM
    // =====================================================
    const insurances = await InsuranceRecord.find({
      month: Number(month),
      year: Number(year),
    });

    // =====================================================
    // 7. TẠO DỮ LIỆU THUẾ
    // =====================================================
    const taxDocs = allEmployees.map((emp) => {
      const employeeId = emp._id.toString();

      const payroll = payrolls.find(
        (p) =>
          p.employee?.toString() === employeeId
      );

      const insurance = insurances.find(
        (i) =>
          i.employee?.toString() === employeeId
      );

      const payrollAllowances =
        payroll?.incomes?.allowances || {};

      // ===================================================
      // LƯƠNG GROSS
      // ===================================================
      const grossFromPayroll = payroll
        ? payroll.incomes.totalGross
        : 0;

      // ===================================================
      // BHXH NHÂN VIÊN ĐÓNG
      // Trừ 88.000 công ty hỗ trợ
      // ===================================================
      const employeeInsuranceTotal =
        insurance?.employeePays?.total || 0;

      const insuranceAfterSupport = Math.max(
        0,
        employeeInsuranceTotal -
          COMPANY_INSURANCE_SUPPORT
      );

      // ===================================================
      // TIỀN Ở
      // ===================================================
      const housingAllowance =
        payrollAllowances.housingAllowance || 0;

      // ===================================================
      // TẠM ỨNG BHXH
      //
      // Nếu nhân viên đã có giá trị cũ:
      //     giữ nguyên giá trị cũ
      //
      // Nếu nhân viên chưa có:
      //     mặc định 500.000
      // ===================================================
      const payrollInsuranceAdvance = Number(payroll?.incomes?.insuranceAdvance);
      const insuranceAdvance = resolveInsuranceAdvance({
        existingInsuranceAdvance: existingInsuranceAdvance.get(employeeId),
        payrollInsuranceAdvance,
      });

      return {
        month: Number(month),
        year: Number(year),

        employee: emp._id,

        employeeSnapshot: {
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          position:
            emp.workInfo?.position || "Chưa có",
        },

        // =================================================
        // THU NHẬP CHỊU THUẾ
        // =================================================
        taxableIncome: grossFromPayroll,

        deductions: {
          // Giảm trừ bản thân
          personal: 15500000,

          // NPT sẽ được tính lại trong pre-save
          dependent: 0,

          // BHXH sau khi trừ 88k công ty hỗ trợ
          insurance: insuranceAfterSupport,

          // =================================================
          // TẠM ỨNG BHXH
          //
          // Quan trọng:
          // KHÔNG còn cố định 500.000 nữa.
          //
          // Nếu đã chỉnh trước đó -> giữ giá trị cũ.
          // Nếu chưa có -> 500.000.
          // =================================================
          insuranceAdvance: insuranceAdvance,

          // Tiền ở
          housingAllowance: housingAllowance,

          // pre-save sẽ tính lại
          total: 0,
        },
      };
    });

    // =====================================================
    // 8. INSERT DỮ LIỆU MỚI
    // =====================================================
    const createdRecords =
      await TaxRecord.insertMany(taxDocs);

    // =====================================================
    // 9. CHẠY PRE-SAVE ĐỂ TÍNH THUẾ
    // =====================================================
    for (const doc of createdRecords) {
      const record = await TaxRecord.findById(
        doc._id
      );

      if (record) {
        await record.save();
      }
    }

    // =====================================================
    // 10. TRẢ KẾT QUẢ
    // =====================================================
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

    // Cập nhật số người phụ thuộc
    if (dependents !== undefined) {
      record.dependents = Number(dependents);
    }

    // Cập nhật thu nhập chịu thuế
    if (taxableIncome !== undefined) {
      record.taxableIncome = Number(taxableIncome);
    }

    // Cập nhật Tạm ứng BHXH
    if (insuranceAdvance !== undefined) {
      const value = Number(insuranceAdvance);

      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({
          message:
            "Tạm ứng BHXH phải là số lớn hơn hoặc bằng 0",
        });
      }

      record.deductions.insuranceAdvance = value;
    }

    // pre("save") sẽ tính lại:
    // - deductions.total
    // - assessableIncome
    // - taxAmount
    await record.save();

    return res.status(200).json({
      message: "Cập nhật thành công",
      data: record,
    });
  } catch (error) {
    console.error(
      "Lỗi cập nhật Thuế:",
      error
    );

    return res.status(500).json({
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