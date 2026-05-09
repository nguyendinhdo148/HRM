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
    route("dashboard", "routes/dashboard/index.tsx"),
    
    // ✅ Bảng lương
    route("PayrollBoard", "routes/dashboard/PayrollBoard.tsx"),
    route("PayrollManager", "routes/dashboard/PayrollManager.tsx"),
    // ✅ THÊM ROUTE CHO BẢNG TÍNH BẢO HIỂM TẠI ĐÂY
    route("insuranceBoard", "routes/dashboard/InsuranceBoard.tsx"),
    route("taxBoard", "routes/dashboard/TaxBoard.tsx"),
    route("overtimePayBoard", "routes/dashboard/OvertimePayBoard.tsx"),
    route("employee", "routes/dashboard/employee/index.tsx"),
    route("achieved", "routes/dashboard/achieved.tsx"),
    
    route("attendance", "routes/dashboard/AttendanceBoard.tsx"),  
    route("gui-ruou", "routes/dashboard/bar/guiruou.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
    route("payroll/slip/:id", "routes/dashboard/PayslipDetail.tsx"),
  ]),

] satisfies RouteConfig;