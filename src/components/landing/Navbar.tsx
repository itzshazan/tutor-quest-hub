import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X, LogOut, UserCog, MessageSquare, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Find Tutors", href: "/find-tutors", isRoute: true },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Become a Tutor", href: "#become-tutor" },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [incompleteProfile, setIncompleteProfile] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user || user.user_metadata?.role !== "tutor") {
      setIncompleteProfile(false);
      return;
    }
    supabase
      .from("tutor_profiles")
      .select("hourly_rate")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIncompleteProfile(!data?.hourly_rate || data.hourly_rate === 0);
      });
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <a href="#home" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <GraduationCap className="h-7 w-7" />
          Tutor Quest
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) =>
            'isRoute' in l && l.isRoute ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            )
          )}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/messages"><MessageSquare className="h-4 w-4" /> Messages</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/sessions"><CalendarDays className="h-4 w-4" /> Sessions</Link>
              </Button>
              {incompleteProfile && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 border-accent text-accent-foreground">
                  <Link to="/tutor/setup"><UserCog className="h-4 w-4" /> Complete Profile</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Login</Link></Button>
              <Button size="sm" asChild><Link to="/signup">Sign Up</Link></Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((l) =>
              'isRoute' in l && l.isRoute ? (
                <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link to="/messages" onClick={() => setMobileOpen(false)}>
                      <MessageSquare className="h-4 w-4" /> Messages
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link to="/sessions" onClick={() => setMobileOpen(false)}>
                      <CalendarDays className="h-4 w-4" /> Sessions
                    </Link>
                  </Button>
                  {incompleteProfile && (
                    <Button variant="outline" size="sm" className="gap-1.5 border-accent" asChild>
                      <Link to="/tutor/setup" onClick={() => setMobileOpen(false)}>
                        <UserCog className="h-4 w-4" /> Complete Profile
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link></Button>
                  <Button size="sm" className="flex-1" asChild><Link to="/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link></Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
