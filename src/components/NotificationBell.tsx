import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  session: "📅",
  message: "💬",
  payment: "💰",
  info: "ℹ️",
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="relative cursor-pointer hover:-translate-y-0.5 transition-transform pb-1"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        role="button"
        tabIndex={0}
      >
        <Bell className="w-[22px] h-[22px] text-[#2d2d2d]" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-[#ef4444] text-white rounded-full flex items-center justify-center text-[9px] font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>

      {open && (
        <div 
          className="absolute right-0 top-full z-50 mt-4 w-[300px] bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] animate-in fade-in-0 zoom-in-95 overflow-hidden flex flex-col"
          style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", maxHeight: "400px" }}
        >
          <div className="flex items-center justify-between border-b-[2px] border-[#2d2d2d] px-3 py-2.5 bg-white shrink-0">
            <h3 className="font-kalam text-lg font-bold text-[#2d2d2d]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="flex items-center text-[13px] font-patrick font-medium text-gray-600 hover:text-[#2d2d2d] transition-colors"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2d2d2d] border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-[14px] font-patrick text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y-[2px] divide-[#2d2d2d]/10">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3 py-3 text-left transition-colors hover:bg-gray-50",
                      !notif.read_at ? "bg-[#fef3c7]" : "bg-white"
                    )}
                  >
                    <span className="mt-1 text-xl">
                      {TYPE_ICONS[notif.type] || TYPE_ICONS.info}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-kalam text-[16px] text-[#2d2d2d] leading-tight", !notif.read_at && "font-bold")}>
                        {notif.title}
                      </p>
                      <p className="font-patrick text-[14px] text-gray-600 leading-snug mt-0.5">
                        {notif.message}
                      </p>
                      <p className="mt-1 font-patrick text-[12px] text-gray-500">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {notif.link && (
                      <ExternalLink className="h-3.5 w-3.5 text-[#2d2d2d] shrink-0 mt-1" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
