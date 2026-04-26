import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, LogOut, MessageSquare, CalendarDays, Bell, LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

const navLinks = [
  { label: "Home",          href: "#home", isRoute: false },
  { label: "Find Tutors",   href: "/find-tutors", isRoute: true },
  { label: "How It Works",  href: "#how-it-works", isRoute: false },
  { label: "Pricing",       href: "#pricing", isRoute: false },
  { label: "Become a Tutor",href: "#become-tutor", isRoute: false },
];

const HandDrawnUnderline = () => (
  <svg
    className="absolute -bottom-2 left-0 w-full h-2 text-[#ef4444]"
    preserveAspectRatio="none"
    viewBox="0 0 100 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 5 Q 25 8, 50 5 T 100 4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="110"
      strokeDashoffset="110"
      style={{
        animation: "draw-underline 0.35s ease-out forwards",
      }}
    />
  </svg>
);

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        scrolled ? "bg-white/90 backdrop-blur-md border-b-[2px] border-[#2d2d2d]" : "bg-transparent"
      }`}
    >
      <div className="container max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png?v=3" alt="Tutor Quest Logo" className="w-[52px] h-[52px] object-contain drop-shadow-[2px_2px_0px_rgba(45,45,45,0.2)] -ml-2" />
          <span className="font-kalam text-[28px] font-bold text-[#2d2d2d] tracking-tight">
            Tutor Quest
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = activeLink === link.label;
            const className = `relative font-patrick text-[17px] font-medium transition-colors group ${
              isActive ? "text-[#ef4444]" : "text-gray-600 hover:text-[#2d2d2d]"
            }`;
            
            const content = (
              <>
                {link.label}
                <span className={`absolute -bottom-2 left-0 w-full h-2 text-[#ef4444] transition-opacity duration-150 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <HandDrawnUnderline />
                </span>
              </>
            );

            return link.isRoute ? (
              <Link key={link.label} to={link.href} className={className} onClick={() => setActiveLink(link.label)}>
                {content}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={className} onClick={() => setActiveLink(link.label)}>
                {content}
              </a>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-end gap-5 border-r-[2px] border-[#2d2d2d] pr-6">
            {user && (
              <Link to={user.user_metadata?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"} className="flex flex-col items-center text-[#2d2d2d] hover:-translate-y-0.5 transition-transform">
                <LayoutDashboard className="w-[22px] h-[22px] mb-0.5" strokeWidth={2.5} />
                <span className="text-[11px] font-patrick font-medium leading-none">Dashboard</span>
              </Link>
            )}
            <NotificationBell />
            <Link to="/messages" className="text-[#2d2d2d] hover:-translate-y-0.5 transition-transform pb-1">
              <MessageSquare className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </Link>
            <Link to="/sessions" className="flex flex-col items-center text-[#2d2d2d] hover:-translate-y-0.5 transition-transform">
              <CalendarDays className="w-[22px] h-[22px] mb-0.5" strokeWidth={2.5} />
              <span className="text-[11px] font-patrick font-medium leading-none">Sessions</span>
            </Link>
          </div>

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-white text-[#2d2d2d] font-sans text-xs font-bold px-4 py-2 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] hover:bg-gray-50 transition-all hover:-translate-y-0.5"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              className="flex items-center gap-2 bg-white text-[#2d2d2d] font-sans text-xs font-bold px-4 py-2 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] hover:bg-gray-50 transition-all hover:-translate-y-0.5"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-[#2d2d2d]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" strokeWidth={2.5} /> : <Menu className="w-6 h-6" strokeWidth={2.5} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-24 left-0 w-full bg-white border-b-[2px] border-[#2d2d2d] p-6 flex flex-col gap-4 shadow-lg">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="font-patrick text-[18px] font-medium text-[#2d2d2d]">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
