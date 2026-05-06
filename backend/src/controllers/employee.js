import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../libs/send-email.js";
import { recordActivity } from "../libs/index.js";

// ==========================================
// QUẢN LÝ PHÒNG BAN (DEPARTMENT CRUD)
// ==========================================

export const createDepartment = async (req, res) => {
  try {
    const { name, description, color, manager } = req.body;

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: "Tên phòng ban đã tồn tại!" });
    }

    const department = await Department.create({
      name,
      description,
      color,
      manager,
    });

    // TODO (Sau này): Lưu lịch sử hoạt động người dùng tạo phòng ban
    // await recordActivity(req.user._id, "created_department", "Department", department._id, {
    //   description: `Đã tạo phòng ban mới: ${department.name}`,
    // });

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

    const department = await Department.findByIdAndUpdate(departmentId, updates, {
      new: true,
    });

    if (!department) {
      return res.status(404).json({ message: "Không tìm thấy phòng ban" });
    }

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
      return res.status(400).json({ 
        message: "Không thể xóa! Có nhân viên đang thuộc phòng ban này." 
      });
    }

    await Department.findByIdAndDelete(departmentId);
    
    // TODO (Sau này): Lưu lịch sử xóa phòng ban
    // await recordActivity(req.user._id, "deleted_department", "Department", departmentId, {
    //   description: `Đã xóa phòng ban: ${dept.name}`,
    // });

    res.status(200).json({ message: "Xóa phòng ban thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa phòng ban" });
  }
};

// ==========================================
// QUẢN LÝ NHÂN VIÊN & THỐNG KÊ (EMPLOYEE)
// ==========================================

export const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;

    const existingEmployee = await Employee.findOne({ employeeCode: employeeData.employeeCode });
    if (existingEmployee) {
      return res.status(400).json({ message: "Mã nhân viên đã tồn tại!" });
    }

    const newEmployee = await Employee.create(employeeData);

    // TODO (Sau này): Gửi email Welcome cho nhân viên mới
    // if (employeeData.email) {
    //   await sendEmail({
    //     to: employeeData.email,
    //     subject: "Chào mừng gia nhập công ty!",
    //     text: `Xin chào ${newEmployee.fullName}, chào mừng bạn...`
    //   });
    // }

    // TODO (Sau này): Lưu vết hoạt động tạo hồ sơ nhân sự
    // await recordActivity(req.user._id, "created_employee", "Employee", newEmployee._id, {
    //   description: `Đã thêm hồ sơ nhân viên: ${newEmployee.fullName} (${newEmployee.employeeCode})`,
    // });

    res.status(201).json(newEmployee);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi tạo nhân viên" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    let query = {};
    
    if (department) {
      query["workInfo.department"] = department;
    }

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

    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin nhân viên" });
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
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    // Tránh việc user tự ý đổi mã nhân viên thành mã đã tồn tại
    if (updates.employeeCode) {
      const existing = await Employee.findOne({ 
        employeeCode: updates.employeeCode, 
        _id: { $ne: employeeId } 
      });
      if (existing) {
        return res.status(400).json({ message: "Mã nhân viên mới này đã bị trùng lặp!" });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId, 
      updates, 
      { new: true, runValidators: true } // new: true để trả về data sau khi update
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật nhân viên" });
  }
};

// Xóa nhân viên
export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const deletedEmployee = await Employee.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên để xóa" });
    }

    // TODO: Có thể thêm logic kiểm tra xem nhân viên có đang giữ chức vụ Trưởng phòng ở Department nào không.
    // Nếu có, cần set manager của Department đó về null.

    res.status(200).json({ message: "Đã xóa nhân viên thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa nhân viên" });
  }
};