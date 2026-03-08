import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Search,
  UserCog,
  GraduationCap,
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const items = role === "tutor" ? tutorItems : studentItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <GraduationCap className="h-6 w-6 shrink-0" />
            Tutor Quest
          </div>
        )}
        {collapsed && <GraduationCap className="h-6 w-6 text-primary mx-auto" />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role === "tutor" ? "Tutor Menu" : "Student Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
