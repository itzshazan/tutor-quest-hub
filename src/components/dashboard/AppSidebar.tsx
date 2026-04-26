import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Search,
  UserCog,
  CreditCard,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const studentItems = [
  { title: "Dashboard", url: "/dashboard/student", icon: LayoutDashboard },
  { title: "Sessions", url: "/sessions", icon: CalendarDays },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Find Tutors", url: "/find-tutors", icon: Search },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

const tutorItems = [
  { title: "Dashboard", url: "/dashboard/tutor", icon: LayoutDashboard },
  { title: "Sessions", url: "/sessions", icon: CalendarDays },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Earnings", url: "/earnings", icon: Wallet },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Edit Profile", url: "/tutor/setup", icon: UserCog },
];

interface AppSidebarProps {
  role: "student" | "tutor";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const items = role === "tutor" ? tutorItems : studentItems;

  // On desktop, hide completely when collapsed
  if (collapsed && !isMobile) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-hd-ink border-dashed bg-transparent shadow-none">
      <SidebarHeader className="p-4 pt-6">
        {!collapsed && (
          <div className="flex items-center gap-3 font-kalam text-2xl font-bold text-hd-ink">
            <img
              src="/logo.png?v=3"
              alt="Tutor Quest Logo"
              className="w-[38px] h-[38px] object-contain drop-shadow-[2px_2px_0px_rgba(45,45,45,0.2)]"
            />
            Tutor Quest
          </div>
        )}
        {collapsed && (
          <img
            src="/logo.png?v=3"
            alt="Tutor Quest Logo"
            className="w-[32px] h-[32px] object-contain mx-auto drop-shadow-[1px_1px_0px_rgba(45,45,45,0.2)]"
          />
        )}
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="font-kalam text-lg text-hd-ink font-bold mb-2">
            {role === "tutor" ? "Tutor Menu" : "Student Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center w-full px-4 py-2.5 rounded-xl font-bold transition-all text-[15px] ${
                          isActive
                            ? "bg-[#ffebed] text-[#d32f2f] border-2 border-[#d32f2f] hover:bg-[#ffebed]"
                            : "text-hd-ink hover:bg-black/5 border-2 border-transparent"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-[#d32f2f]" : "text-hd-ink"}`} />
                          {!collapsed && <span>{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Lamp and Books illustration at the bottom of the sidebar */}
      {!collapsed && (
        <div className="mt-auto relative w-full flex justify-center p-4 min-h-[250px] overflow-hidden pointer-events-none">
          {/* Trailing Star Doodle */}
          <div className="absolute top-10 right-4 opacity-80 z-10">
            <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4">
              <path d="M10,50 Q40,55 55,20" />
              <path d="M55,20 L53,13 L60,11 L59,18 Z" fill="white" stroke="#2d2d2d" strokeDasharray="none" />
            </svg>
          </div>
          <img 
            src="/ref-books.png" 
            alt="Lamp and Books" 
            className="absolute bottom-0 max-w-[85%] object-contain"
          />
        </div>
      )}
    </Sidebar>
  );
}
