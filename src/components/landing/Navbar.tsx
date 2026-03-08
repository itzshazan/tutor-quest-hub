import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X, LogOut, UserCog, MessageSquare, CalendarDays, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { motion, useScroll, useSpring } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Find Tutors", href: "/find-tutors", isRoute: true },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Become a Tutor", href: "#become-tutor" },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [incompleteProfile, setIncompleteProfile] = useState(false);
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b bg-background/95 backdrop-blur-xl shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Tutor Quest</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) =>
            "isRoute" in l && l.isRoute ? (
              <Link
                key={l.href}
                to={l.href}
                className="nav-link-underline text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="nav-link-underline text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            )
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-full"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Link to={user.user_metadata?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Link to="/messages"><MessageSquare className="h-4 w-4" /> Messages</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Link to="/sessions"><CalendarDays className="h-4 w-4" /> Sessions</Link>
              </Button>
              {incompleteProfile && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 border-accent text-accent-foreground">
                  <Link to="/tutor/setup"><UserCog className="h-4 w-4" /> Complete Profile</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full px-5">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full">
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="p-1">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t bg-background px-6 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((l) =>
              "isRoute" in l && l.isRoute ? (
                <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="py-1.5 text-body-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="py-1.5 text-body-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              )
            )}
            <div className="mt-2 flex flex-col gap-2 border-t pt-4">
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="justify-start gap-1.5" asChild>
                    <Link to={user.user_metadata?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"} onClick={() => setMobileOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start gap-1.5" asChild>
                    <Link to="/messages" onClick={() => setMobileOpen(false)}><MessageSquare className="h-4 w-4" /> Messages</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start gap-1.5" asChild>
                    <Link to="/sessions" onClick={() => setMobileOpen(false)}><CalendarDays className="h-4 w-4" /> Sessions</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-1.5 text-muted-foreground" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                  </Button>
                  <Button size="sm" className="flex-1 rounded-full" asChild>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
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
