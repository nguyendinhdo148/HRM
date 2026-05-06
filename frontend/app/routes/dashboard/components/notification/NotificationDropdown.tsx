// components/notification/NotificationDropdown.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  MessageCircle,
  FolderKanban,
  Users,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router";
import { fetchData, patchData, deleteData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Notification {
  _id: string;
  type: "message" | "project" | "workspace";
  content: string;
  isRead: boolean;
  conversationId?: {
    _id: string;
    type: string;
  };
  projectId?: {
    _id: string;
    title: string;
  };
  workspaceId?: {
    _id: string;
    name: string;
  };
  sender?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  createdAt: string;
  metadata?: any;
}

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown = ({
  className,
}: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetchData<{
        notifications: Notification[];
        unreadCount: number;
      }>("/notifications?limit=20");
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updatedNotifications = notifications.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
      const newUnreadCount = updatedNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(newUnreadCount);

      await patchData(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error("Error marking as read:", error);
      fetchNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedNotifications = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);

      await patchData("/notifications/read-all", {});
    } catch (error) {
      console.error("Error marking all as read:", error);
      fetchNotifications();
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteData(`/notifications/${notificationId}`);
      setNotifications((prev) => {
        const deleted = prev.find((n) => n._id === notificationId);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification._id);
    setIsOpen(false);

    if (notification.type === "message" && notification.conversationId) {
      navigate(`/achieved?conversationId=${notification.conversationId._id}`);
    } else if (notification.type === "project" && notification.projectId) {
      navigate(`/projects/${notification.projectId._id}`);
    } else if (
      notification.type === "workspace" &&
      notification.workspaceId &&
      notification.metadata?.inviteToken
    ) {
      navigate(
        `/workspace-invite/${notification.workspaceId._id}?tk=${notification.metadata.inviteToken}`
      );
    }
  };

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => {
        const updated = [{ ...notification, isRead: false }, ...prev];
        const newUnreadCount = updated.filter((n) => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return updated;
      });

      // Show browser notification
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("Thông báo mới", {
          body: notification.content,
          icon: "/logo.png",
        });
      }
    };

    const handleNotificationRead = (notificationId: string) => {
      setNotifications((prev) => {
        const notification = prev.find((n) => n._id === notificationId);
        if (notification?.isRead) return prev;

        const updated = prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        const newUnreadCount = updated.filter((n) => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return updated;
      });
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);
    socket.on("all_notifications_read", handleAllNotificationsRead);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
      socket.off("all_notifications_read", handleAllNotificationsRead);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setShowPermissionDialog(true);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "vừa xong";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "project":
        return <FolderKanban className="h-5 w-5 text-emerald-500" />;
      case "workspace":
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (!isRead) return "bg-gradient-to-r from-blue-50/80 to-transparent";
    return "";
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200",
          "hover:bg-gray-100 active:scale-95",
          isOpen && "bg-gray-100"
        )}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Notifications List with Scroll */}
            <div 
              ref={scrollRef}
              className="max-h-[480px] overflow-y-auto overscroll-contain"
              style={{ scrollBehavior: "smooth" }}
            >
              {loading ? (
                <div className="py-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
                  <p className="mt-3 text-sm text-gray-500">Đang tải...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
                  <p className="text-xs text-gray-400 mt-1">Khi có thông báo mới sẽ hiển thị ở đây</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "group relative px-5 py-4 cursor-pointer transition-all duration-200",
                        "hover:bg-gray-50/80",
                        !notification.isRead && "bg-gradient-to-r from-blue-50/40 to-transparent",
                        "active:bg-gray-100"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Avatar/Icon */}
                        <div className="flex-shrink-0">
                          {notification.sender?.profilePicture ? (
                            <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                              <AvatarImage src={notification.sender.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                                {notification.sender.name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={cn(
                              "h-11 w-11 rounded-full flex items-center justify-center shadow-sm",
                              !notification.isRead && "ring-2 ring-blue-200"
                            )}>
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              {notification.sender && (
                                <span className="font-semibold text-sm text-gray-900">
                                  {notification.sender.name}
                                </span>
                              )}
                              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                                {notification.content}
                              </p>
                              {notification.metadata?.messagePreview && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                                  "{notification.metadata.messagePreview}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              )}
                              <button
                                onClick={(e) => deleteNotification(notification._id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all duration-200"
                              >
                                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Hover effect line */}
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

           
          </div>
        </>
      )}

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permission Request</DialogTitle>
            <DialogDescription>
              Allow notifications to stay updated with your tasks and messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Not Now
            </Button>
            <Button onClick={() => {
              Notification.requestPermission().catch(() => {});
              setShowPermissionDialog(false);
            }}>
              Allow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};