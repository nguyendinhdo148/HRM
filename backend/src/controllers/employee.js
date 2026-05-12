import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../libs/send-email.js";
import { recordActivity } from "../libs/index.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, description, color, manager } = req.body;

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: "Tên phòng ban đã tồn tại!" });
    }

    const department = await Department.create({ name, description, color, manager });
    res.status(201).json(department);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi tạo phòng ban" });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("manager", "fullName employeeCode")
      .sort({ createdAt: -1 });
    res.status(200).json(departments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách phòng ban" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const updates = req.body;

    const department = await Department.findByIdAndUpdate(departmentId, updates, { new: true });
    if (!department) return res.status(404).json({ message: "Không tìm thấy phòng ban" });
    
    res.status(200).json(department);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật phòng ban" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

    const employeesInDept = await Employee.countDocuments({ "workInfo.department": dept.name });
    if (employeesInDept > 0) {
      return res.status(400).json({ message: "Không thể xóa! Có nhân viên đang thuộc phòng ban này." });
    }

    await Department.findByIdAndDelete(departmentId);
    res.status(200).json({ message: "Xóa phòng ban thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa phòng ban" });
  }
};

// ==========================================
// QUẢN LÝ NHÂN VIÊN & HỢP ĐỒNG (EMPLOYEE)
// ==========================================

export const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;

    // 1. Check điều kiện tiên quyết cho logic Thâm niên & Hợp đồng
    if (!employeeData.workInfo?.joinDate) {
      return res.status(400).json({ message: "Ngày bắt đầu đi làm (joinDate) là bắt buộc để tính thâm niên!" });
    }
    if (!employeeData.contractInfo?.contractType) {
      return res.status(400).json({ message: "Vui lòng chọn Loại Hợp Đồng!" });
    }

    // 2. Check trùng mã NV
    const existingEmployee = await Employee.findOne({ employeeCode: employeeData.employeeCode });
    if (existingEmployee) {
      return res.status(400).json({ message: "Mã nhân viên này đã tồn tại trong hệ thống!" });
    }

    // 3. Lưu vào DB
    const newEmployee = await Employee.create(employeeData);
    
    res.status(201).json(newEmployee);
  } catch (error) {
    console.log(error);
    // Bắt lỗi Validation của Mongoose (VD: truyền sai kiểu dữ liệu, sai Enum)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Lỗi hệ thống khi tạo hồ sơ nhân viên" });
  }
};


// ==========================================
// CẬP NHẬT NHÂN VIÊN / HỢP ĐỒNG
// ==========================================
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    // 1. Check nếu user cố tình đổi mã NV thành mã đã có của người khác
    if (updates.employeeCode) {
      const existing = await Employee.findOne({ 
        employeeCode: updates.employeeCode, 
        _id: { $ne: employeeId } 
      });
      if (existing) {
        return res.status(400).json({ message: "Mã nhân viên mới này đã bị trùng lặp với người khác!" });
      }
    }

    // 2. Cập nhật dữ liệu
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId, 
      updates, 
      { new: true, runValidators: true } // Bắt buộc có runValidators để nó check lại Enum Hợp đồng
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ nhân viên này" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật hồ sơ nhân viên" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    let query = {};
    if (department) query["workInfo.department"] = department;

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách nhân viên" });
  }
};

export const getEmployeeDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    
    res.status(200).json(employee);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin nhân viên" });
  }
};


export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const deletedEmployee = await Employee.findByIdAndDelete(employeeId);
    if (!deletedEmployee) return res.status(404).json({ message: "Không tìm thấy nhân viên để xóa" });

    res.status(200).json({ message: "Đã xóa nhân viên thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa nhân viên" });
  }
};

export const getHRStats = async (req, res) => {
  try {
    const [totalEmployees, activeEmployees, departments] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: "active" }),
      Department.find(),
    ]);

    const employees = await Employee.find();
    const departmentDistribution = departments.map((dept) => {
      const count = employees.filter(
        (emp) => emp.workInfo && emp.workInfo.department === dept.name
      ).length;
      return {
        name: dept.name,
        value: count,
        color: dept.color,
      };
    });

    const statusDistribution = [
      { name: "Chính thức (Active)", value: employees.filter(e => e.status === "active").length, color: "#10b981" },
      { name: "Thử việc (Probation)", value: employees.filter(e => e.status === "probation").length, color: "#3b82f6" },
      { name: "Nghỉ phép (On Leave)", value: employees.filter(e => e.status === "on_leave").length, color: "#f59e0b" },
      { name: "Đã nghỉ (Resigned)", value: employees.filter(e => e.status === "resigned").length, color: "#ef4444" },
    ];

    const stats = {
      totalEmployees,
      activeEmployees,
      totalDepartments: departments.length,
    };

    res.status(200).json({
      stats,
      departmentDistribution,
      statusDistribution,
      recentOnboards: employees.slice(-5).reverse(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy thống kê nhân sự" });
  }
};
// Cập nhật thông tin nhân viên


// Xóa nhân viên


