import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  role: "student" | "tutor";
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({ role, title, children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // Fetch avatar from profiles table as fallback
  useEffect(() => {
    if (!user) return;
    const authAvatar = user.user_metadata?.avatar_url;
    if (authAvatar) {
      setProfileAvatar(authAvatar);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setProfileAvatar(data.avatar_url);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ee]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5a5a] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email || "User";
  const avatarSrc = profileAvatar || user.user_metadata?.avatar_url || undefined;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full font-sans bg-[#f7f3ee] bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:20px_20px]">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Subtle floating doodle in background */}
          <div className="absolute top-10 right-20 opacity-20 pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff5a5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          
          <header className="h-16 flex items-center justify-between border-b-2 border-hd-ink bg-[#fdfbf7]/80 backdrop-blur-sm px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <DashboardSidebarToggle />
              {title && (
                <div className="hidden md:flex items-center gap-2 font-display text-xl font-bold text-hd-ink">
                  {title}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white border-2 border-hd-ink shadow-hd-sm rounded-full py-1.5 px-2 pr-4">
                <Avatar className="h-8 w-8 border-2 border-hd-ink">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-[#ffd166] text-hd-ink font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-hd-ink hidden sm:inline">
                  {user.user_metadata?.full_name || "Student"}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut} 
                className="gap-2 border-2 border-hd-ink shadow-hd-sm bg-white hover:bg-[#ff5a5a] hover:text-white transition-all rounded-xl"
              >
                <LogOut className="h-4 w-4" /> 
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto z-0 relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardSidebarToggle() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const label = isMobile ? "Open navigation" : collapsed ? "Expand navigation" : "Collapse navigation";
  const Icon = collapsed || isMobile ? ChevronsRight : ChevronsLeft;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={isMobile ? undefined : !collapsed}
      onClick={toggleSidebar}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-hd-ink bg-white text-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:-translate-y-0.5 hover:bg-[#fff9c4] hover:shadow-[3px_3px_0px_0px_#2d2d2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a5a] focus-visible:ring-offset-2"
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
