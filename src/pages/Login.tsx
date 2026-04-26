import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";

/* ─── SVG Doodle Components ─── */
const PaperPlane = () => (
  <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 46 L62 4 L48 52 L30 36 L4 46Z" fill="white" stroke="#555" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M30 36 L62 4" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M30 36 L24 52" stroke="#555" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    {/* dashed trail circle */}
    <circle cx="8" cy="52" r="6" stroke="#aaa" strokeWidth="1.5" strokeDasharray="3 2.5" fill="none"/>
    <path d="M14 52 Q16 49 12 46" stroke="#aaa" strokeWidth="1.5" strokeDasharray="3 2.5" fill="none" strokeLinecap="round"/>
  </svg>
);

const Sparkle4 = ({ size = 14, color = "#ef4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 1 L9 6.5 L14.5 8 L9 9 L8 14.5 L7 9 L1.5 8 L7 6.5 Z" fill={color}/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ─── Main Login ─── */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (error) {
      toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification email sent!", description: "Please check your inbox." });
      setShowResendOption(false);
    }
    setResendLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) setShowResendOption(true);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      setShowResendOption(false);
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser?.user_metadata?.role === "tutor") {
        const { data: tp } = await supabase.from("tutor_profiles").select("hourly_rate").eq("user_id", loggedUser.id).single();
        if (!tp?.hourly_rate || tp.hourly_rate === 0) {
          toast({ title: "Welcome! Let's complete your profile." });
          navigate("/tutor/setup");
          setLoading(false);
          return;
        }
      }
      toast({ title: "Welcome back!" });
      const role = loggedUser?.user_metadata?.role;
      navigate(role === "tutor" ? "/dashboard/tutor" : "/dashboard/student");
    }
    setLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#fdf6f0",
        backgroundImage: "radial-gradient(circle, #c9b9a8 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <SEO title="Login" description="Sign in to your Tutor Quest account." url="/login" noIndex />

      {/* ── Floating background doodles ── */}
      {/* Paper plane — top left */}
      <div className="pointer-events-none absolute left-[7%] top-[10%]">
        <PaperPlane />
      </div>

      {/* Pink blob — mid left */}
      <div
        className="pointer-events-none absolute"
        style={{ left: "5%", top: "40%", width: 80, height: 80, background: "#ffb3b3", borderRadius: "60% 40% 55% 50% / 50% 55% 45% 60%", opacity: 0.85 }}
      />

      {/* Yellow blob — right */}
      <div
        className="pointer-events-none absolute"
        style={{ right: "6%", top: "17%", width: 68, height: 68, background: "#fde68a", borderRadius: "45% 60% 50% 55% / 55% 45% 60% 50%", opacity: 0.9 }}
      />

      {/* Sparkles */}
      <div className="pointer-events-none absolute" style={{ left: "18%", bottom: "28%" }}><Sparkle4 size={15} color="#ef4444"/></div>
      <div className="pointer-events-none absolute" style={{ right: "20%", top: "44%" }}><Sparkle4 size={17} color="#ef4444"/></div>
      <div className="pointer-events-none absolute" style={{ right: "32%", bottom: "16%" }}><Sparkle4 size={11} color="#bbb"/></div>
      <div className="pointer-events-none absolute" style={{ left: "42%", top: "6%" }}><Sparkle4 size={10} color="#bbb"/></div>

      {/* ── 3-column layout — books | card | student ── */}
      <div className="relative z-10 w-full max-w-[1200px] flex items-center justify-center gap-0 px-4" style={{ minHeight: '90vh' }}>

        {/* ── LEFT: Books + plant illustration ── */}
        <div className="hidden lg:flex flex-col justify-end items-end w-[380px] shrink-0" style={{ alignSelf: 'flex-end', paddingBottom: '60px' }}>
          <motion.img
            src="/login-books.png?v=2"
            alt="Books and plant"
            className="w-[370px] object-contain"
            style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.08))" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>

        {/* ── CENTER: The Card ── */}
        <div className="flex-1 flex justify-center items-center py-16 min-w-0">
          <motion.div
            className="relative w-full"
            style={{ maxWidth: 430 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Tape strip */}
            <div className="absolute -top-4 left-1/2 z-20" style={{
              transform: "translateX(-50%) rotate(-1deg)",
              width: 60, height: 32,
              background: "#fde68a",
              opacity: 0.92,
              borderRadius: 3,
              boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
            }}/>

            {/* Card */}
            <div
              className="bg-white px-9 pt-10 pb-8"
              style={{
                border: "2px solid #222",
                borderRadius: 14,
                boxShadow: "5px 5px 0px #222",
                transform: "rotate(-0.4deg)",
              }}
            >
              {/* Brand header */}
              <div className="flex flex-col items-center mb-5">
                <Link to="/" className="flex items-center gap-2 mb-1">
                  <img src="/logo.png?v=3" alt="Tutor Quest" className="w-7 h-7 object-contain" />
                  <span className="font-kalam font-bold text-[19px] text-[#222]">Tutor Quest</span>
                </Link>
                <h1 className="font-kalam font-bold text-[30px] text-[#1a1a1a] mt-1 leading-tight">Welcome back</h1>
                <p className="font-patrick text-[15px] text-gray-400 mt-0.5">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="font-patrick text-[14px] font-semibold text-[#333] block mb-1.5">Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-[17px] h-[17px] text-gray-400 shrink-0" strokeWidth={1.8}/>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-[11px] font-patrick text-[15px] text-[#333] placeholder:text-gray-300 bg-white rounded-lg focus:outline-none transition-all"
                      style={{ border: "1.8px solid #222", borderRadius: 8 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="font-patrick text-[14px] font-semibold text-[#333] block mb-1.5">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-[17px] h-[17px] text-gray-400 shrink-0" strokeWidth={1.8}/>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-[11px] font-patrick text-[15px] text-[#333] placeholder:text-gray-400 bg-white rounded-lg focus:outline-none transition-all"
                      style={{ border: "1.8px solid #222", borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-gray-400 hover:text-[#222] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-[17px] h-[17px]"/> : <Eye className="w-[17px] h-[17px]"/>}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 mt-1 text-white font-kalam font-bold text-[20px] disabled:opacity-60 transition-all"
                  style={{
                    background: "#e8534a",
                    border: "2px solid #222",
                    borderRadius: 8,
                    boxShadow: "3px 3px 0px #222",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-0.5">
                  <div className="flex-1 h-px bg-gray-200"/>
                  <span className="font-patrick text-[11px] font-semibold uppercase tracking-widest text-gray-400">Or continue with</span>
                  <div className="flex-1 h-px bg-gray-200"/>
                </div>

                {/* Google Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white font-kalam font-bold text-[17px] text-[#222] transition-all"
                  style={{
                    border: "1.8px solid #222",
                    borderRadius: 8,
                    boxShadow: "3px 3px 0px #222",
                  }}
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: window.location.origin },
                    });
                    if (error) toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
                  }}
                >
                  <GoogleIcon/>
                  Continue with Google
                </motion.button>

                {/* Links */}
                <div className="text-center space-y-2 pt-1">
                  <p className="font-patrick text-[14px] text-gray-500">
                    Don't have an account?{" "}
                    <Link to="/signup" className="font-semibold text-[#e8534a] hover:underline">Sign up</Link>
                  </p>
                  <Link to="/forgot-password" className="block font-patrick text-[14px] text-gray-400 hover:text-[#222] transition-colors">
                    Forgot your password?
                  </Link>

                  {showResendOption && (
                    <button
                      type="button"
                      disabled={resendLoading}
                      onClick={handleResendVerification}
                      className="w-full mt-2 py-2.5 font-patrick text-sm text-[#222] transition-all disabled:opacity-60"
                      style={{ border: "1.8px solid #222", borderRadius: 8, boxShadow: "2px 2px 0px #222" }}
                    >
                      <Mail className="inline w-4 h-4 mr-2"/>
                      {resendLoading ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Student with laptop ── */}
        <div className="hidden lg:flex flex-col justify-end items-start w-[380px] shrink-0" style={{ alignSelf: 'flex-end', paddingBottom: '40px' }}>
          <motion.img
            src="/login-student.png?v=2"
            alt="Student with laptop"
            className="w-[370px] object-contain"
            style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.08))" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
