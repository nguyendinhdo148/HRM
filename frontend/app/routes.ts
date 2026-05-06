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
    route("backlog", "routes/dashboard/backlog.tsx"),
    route("workspaces", "routes/dashboard/workspaces/index.tsx"),
    route(
      "workspaces/:workspaceId",
      "routes/dashboard/workspaces/workspace-details.tsx",
    ),
    route(
      "workspaces/:workspaceId/projects/:projectId",
      "routes/dashboard/project/project-details.tsx",
    ),
    route(
      "workspaces/:workspaceId/projects/:projectId/tasks/:taskId",
      "routes/dashboard/task/task-details.tsx",
    ),

    route("my-tasks", "routes/dashboard/my-tasks.tsx"),
    route("daily-report/:reportId", "routes/dashboard/DailyReport.tsx"),
    route("members", "routes/dashboard/members.tsx"),
    
    // <-- THÊM ROUTE CHO HOA HỒNG RƯỢU TẠI ĐÂY -->
    route("wine-commission", "routes/dashboard/WineCommission.tsx"),

    // <-- THÊM ROUTE CHO QUẢN LÝ HỦY MÓN TẠI ĐÂY -->
    route("cancel-report", "routes/dashboard/cancel-report.tsx"),

    // <-- THÊM ROUTE CHO GUI RƯỢU (BAR ROLE) -->
    route("gui-ruou", "routes/dashboard/bar/guiruou.tsx"),

    route("achieved", "routes/dashboard/achieved.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),

] satisfies RouteConfig;