import { cn } from "@/lib/utils";
import { useAuth } from "@/provider/auth-context";
import { useChatUnreadCount } from "@/hooks/use-chat";
import type { Workspace } from "@/types";
import {
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Users,
  MessageCircle,
  Wine,
  CalendarCheck,      // Icon cho Chấm công
  Timer,              // Icon cho Tăng ca
  Calculator,         // Icon cho Tính lương Gross
  ShieldCheck,        // Icon cho Bảo hiểm (An toàn/Bảo vệ)
  Landmark,           // Icon cho Thuế (Cơ quan nhà nước)
  HandCoins,          // Icon cho Thực lĩnh Net (Nhận tiền)
  FileSpreadsheet,    // Icon cho Tổng hợp kỳ lương
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";

export const SidebarComponent = ({
  currentWorkspace,
  onMobileMenuClose,
}: {
  currentWorkspace: Workspace | null;
  onMobileMenuClose?: () => void;
}) => {
  const { user, logout, hasRole } = useAuth();
  const { totalUnreadCount } = useChatUnreadCount();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Đã tối ưu lại tên và Icon cho chuyên nghiệp, bám sát luồng tính lương
  const allNavItems = [
    { title: "Hồ sơ Nhân sự", href: "/employee", icon: Users },
    { title: "Quản lý Chấm công", href: "/attendance", icon: CalendarCheck },
    { title: "Quản lý Tăng ca", href: "/overtimePayBoard", icon: Timer },
    { title: "Bảng lương Gross", href: "/payrollBoard", icon: Calculator },
    { title: "Khấu trừ Bảo hiểm", href: "/insuranceBoard", icon: ShieldCheck },
    { title: "Khấu trừ Thuế (TNCN)", href: "/taxBoard", icon: Landmark },
    { title: "Bảng Thực lĩnh (Net)", href: "/payrollBoardNet", icon: HandCoins },
    { title: "Tổng hợp Kỳ lương", href: "/PayrollManager", icon: FileSpreadsheet },
    
    // <-- CHỨC NĂNG RIÊNG CHO QUÁN -->
    { title: "Quản lý Gửi Rượu", href: "/gui-ruou", icon: Wine, roles: ["bar", "admin"] },
    
    { title: "Tin nhắn nội bộ", href: "/achieved", icon: MessageCircle },
    { title: "Cài đặt hệ thống", href: "/settings", icon: Settings },
  ];

  const userAllowedRoutes = [
    "/employee",
    "/attendance",
    "/overtimePayBoard",
    "/achieved",
    "/settings",
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter((item) => {
    if (!user) {
      return false;
    }

    if (user.role === "user") {
      return userAllowedRoutes.includes(item.href);
    }

    // Handle commonly accessible items for other roles
    if (["Hồ sơ Nhân sự", "Tin nhắn nội bộ", "Cài đặt hệ thống"].includes(item.title)) {
      return true;
    }

    // If item has specific roles requirement, check against those
    if ((item as any).roles) {
      return hasRole((item as any).roles);
    }

    // Cashier and admin see all other items
    if (hasRole(["cashier", "admin"])) {
      return true;
    }

    // Bar sees only the common ones (already included above)
    return false;
  });

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-32" : "w-64",
      )}
    >
      <div className="group relative flex items-center px-3 py-4 border-b border-border">
        <Link
          to="/employee"
          className="flex items-center gap-3 flex-1 overflow-hidden"
        >
          {!isCollapsed ? (
            <>
              {/* Logo thay cho icon */}
              <img 
                src="/logo.png" 
                alt="Lighthouse Logo" 
                className="shrink-0 w-10 h-10 object-contain rounded-md" 
              />

              <span className="text-lg font-bold text-amber-600 tracking-wide">
                Lighthouse
              </span>
            </>
          ) : (
            <div className="flex justify-center w-full">
              {/* Logo thay cho icon khi thu gọn Sidebar */}
              <img 
                src="/logo.png" 
                alt="Lighthouse Logo" 
                className="w-10 h-10 object-contain rounded-md" 
              />
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            h-7 w-7 hidden md:flex
            opacity-0 group-hover:opacity-100
            transition-all duration-200
            bg-muted/50 hover:bg-muted
          "
        >
          {isCollapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-2 py-3">
          <SidebarNav
            items={navItems}
            isCollapsed={isCollapsed}
            className={cn(isCollapsed && "items-center space-y-1")}
            currentWorkspace={currentWorkspace}
            onNavigate={onMobileMenuClose}
            unreadMessageCount={totalUnreadCount}
          />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-3">
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="px-2 py-2 rounded-lg bg-surface border border-border/50">
            <p className="text-xs font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          onClick={logout}
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-9",
            isCollapsed && "justify-center px-0",
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  );
};