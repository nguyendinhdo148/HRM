import { cn } from "@/lib/utils";
import { useAuth } from "@/provider/auth-context";
import { useChatUnreadCount } from "@/hooks/use-chat";
import type { Workspace } from "@/types";
import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Settings,
  Users,
  Wrench,
  FolderTree,
  MessageCircle,
  GlassWater,
  FileWarning,
  Wine, // <-- THÊM ICON NÀY CHO TRANG GUI RƯỢU
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

  const allNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Công nợ", href: "/workspaces", icon: Users },
    { title: "Báo cáo doanh thu", href: "/my-tasks", icon: ListCheck },
    { title: "Đã post & Chưa post", href: "/backlog", icon: FolderTree },
    { title: "Chia Tips", href: "/members", icon: Users },
    { title: "Hoa Hồng Rượu", href: "/wine-commission", icon: GlassWater },
    
    // <-- THÊM DÒNG QUẢN LÝ HỦY MÓN VÀO MENU -->
    { title: "Hệ Thống Hủy Món", href: "/cancel-report", icon: FileWarning },
    
    // <-- THÊM DÒNG GUI RƯỢU CHO BAR ROLE -->
    { title: "GUI Rượu", href: "/gui-ruou", icon: Wine, roles: ["bar", "admin"] },
    
    { title: "Messenger", href: "/achieved", icon: MessageCircle },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter((item) => {
    // Everyone can see Dashboard, Messenger, and Settings
    if (["Dashboard", "Messenger", "Settings"].includes(item.title)) {
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
          to="/dashboard"
          className="flex items-center gap-3 flex-1 overflow-hidden"
        >
          {!isCollapsed ? (
            <>
              {/* Logo */}
              <div
                className="shrink-0 w-9 h-9 rounded-xl 
                bg-linear-to-tr from-indigo-500 to-purple-600 
                flex items-center justify-center shadow-md"
              >
                <Wrench className="size-5 text-white" />
              </div>

              <span className="text-lg font-bold bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
                botdev789
              </span>
            </>
          ) : (
            <div className="flex justify-center w-full">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="size-5 text-primary" />
              </div>
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