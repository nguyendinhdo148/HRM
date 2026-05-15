import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/auth/auth-layout.tsx", [
    index("routes/root/home.tsx"),
    route("sign-in", "routes/auth/sign-in.tsx"),
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("reset-password", "routes/auth/reset-password.tsx"),
    route("verify-email", "routes/auth/verify-email.tsx"),
  ]),

  layout("routes/dashboard/dashboard-layout.tsx", [
    
    // ✅ Bảng lương
    route("PayrollBoard", "routes/dashboard/PayrollBoard.tsx"),
    route("PayrollBoardNet", "routes/dashboard/PayrollNetBoard.tsx"), // ✅ ĐÃ THÊM ROUTE LƯƠNG NET TẠI ĐÂY
    route("PayrollManager", "routes/dashboard/PayrollManager.tsx"),
    
    // ✅ Bảng tính Bảo Hiểm & Thuế
    route("insuranceBoard", "routes/dashboard/InsuranceBoard.tsx"),
    route("taxBoard", "routes/dashboard/TaxBoard.tsx"),
    route("overtimePayBoard", "routes/dashboard/OvertimePayBoard.tsx"),
    
    // ✅ Quản lý nhân sự & khác
    route("employee", "routes/dashboard/employee/index.tsx"),
    route("achieved", "routes/dashboard/achieved.tsx"),
    route("attendance", "routes/dashboard/AttendanceBoard.tsx"),  
    route("gui-ruou", "routes/dashboard/bar/guiruou.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
    route("payroll/slip/:id", "routes/dashboard/PayslipDetail.tsx"),
    
  ]),

] satisfies RouteConfig;