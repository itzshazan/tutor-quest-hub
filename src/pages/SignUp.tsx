import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { phoneSchema } from "@/lib/validations";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";

/* ─── Doodles ─── */
const PaperPlane = () => (
  <svg width="60" height="46" viewBox="0 0 72 56" fill="none">
    <path d="M4 46 L62 4 L48 52 L30 36 L4 46Z" fill="white" stroke="#555" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M30 36 L62 4" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M30 36 L24 52" stroke="#555" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx="8" cy="52" r="6" stroke="#aaa" strokeWidth="1.5" strokeDasharray="3 2.5" fill="none"/>
  </svg>
);

const Sparkle = ({ size = 13, color = "#ef4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 1 L9 6.5 L14.5 8 L9 9 L8 14.5 L7 9 L1.5 8 L7 6.5 Z" fill={color}/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}

const STATIC_SUBJECTS = [
  "Accountancy","Art","Biology","Chemistry","Computer Science",
  "Economics","English","French","Geography","Hindi",
  "History","Mathematics","Music","Physics","Political Science","Sanskrit"
];

const SignUp = () => {
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [phone, setPhone]                   = useState("");
  const [phoneError, setPhoneError]         = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [role, setRole]                     = useState<"student"|"tutor">("student");
  const [subject, setSubject]               = useState("");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [loading, setLoading]               = useState(false);
  const [subjectsList, setSubjectsList]     = useState<string[]>(STATIC_SUBJECTS);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("subjects").select("name").order("name").then(({ data }) => {
      if (data?.length) setSubjectsList(data.map(s => s.name));
    });
  }, []);

  const toggleSubject = (name: string) =>
    setPreferredSubjects(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);

  const validatePhone = (value: string) => {
    const result = phoneSchema.safeParse(value);
    if (!result.success) { setPhoneError(result.error.errors[0]?.message || "Invalid phone"); return false; }
    setPhoneError(""); return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
    if (phone.trim() && !validatePhone(phone)) { toast({ title: "Invalid phone", variant: "destructive" }); return; }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), role, ...(role === "tutor" ? { subject } : {}) },
      },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      if (signUpData.user) {
        const userId = signUpData.user.id;
        const saveExtras = async (retries = 5) => {
          const updates: Record<string, any> = {};
          if (phone.trim()) updates.phone = phone.trim();
          if (role === "student" && preferredSubjects.length > 0) updates.preferred_subjects = preferredSubjects;
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
            if (error && retries > 0) { await new Promise(r => setTimeout(r, 1000)); return saveExtras(retries - 1); }
          }
          if (navigator.geolocation) navigator.geolocation.getCurrentPosition(async pos => {
            await supabase.from("profiles").update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude } as any).eq("user_id", userId);
          }, () => {});
        };
        saveExtras();
      }
      toast({ title: "Account created!", description: "Check your email to confirm." });
      navigate("/login");
    }
    setLoading(false);
  };

  const { score: pwScore, label: pwLabel } = getPasswordStrength(password);
  const pwColors = ["", "#ef4444", "#f97316", "#84cc16", "#22c55e"];

  return (
    <div
      className="relative h-screen overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: "#fdf6f0",
        backgroundImage: "radial-gradient(circle, #c9b9a8 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <SEO title="Sign Up" description="Create your Tutor Quest account." url="/signup" noIndex />

      {/* Doodles */}
      <div className="pointer-events-none absolute left-[7%] top-[8%]"><PaperPlane /></div>
      <div className="pointer-events-none absolute" style={{ left: "5%", top: "42%", width: 65, height: 65, background: "#ffb3b3", borderRadius: "60% 40% 55% 50% / 50% 55% 45% 60%", opacity: 0.85 }}/>
      <div className="pointer-events-none absolute" style={{ right: "6%", top: "14%", width: 55, height: 55, background: "#fde68a", borderRadius: "45% 60% 50% 55% / 55% 45% 60% 50%", opacity: 0.9 }}/>
      <div className="pointer-events-none absolute" style={{ left: "16%", bottom: "22%" }}><Sparkle size={13} color="#ef4444"/></div>
      <div className="pointer-events-none absolute" style={{ right: "19%", top: "44%" }}><Sparkle size={15} color="#ef4444"/></div>
      <div className="pointer-events-none absolute" style={{ left: "43%", top: "4%" }}><Sparkle size={9} color="#bbb"/></div>

      {/* 3-column layout */}
      <div className="relative z-10 w-full max-w-[1200px] flex items-end justify-center gap-0 px-4 h-full">

        {/* LEFT */}
        <div className="hidden lg:flex flex-col justify-end items-end w-[300px] shrink-0 pb-0">
          <motion.img src="/signup-books.png?v=1" alt="Books" className="w-[290px] object-contain"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}/>
        </div>

        {/* CENTER CARD */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <motion.div className="relative w-full" style={{ maxWidth: 420 }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Tape */}
            <div className="absolute -top-3.5 left-1/2 z-20" style={{
              transform: "translateX(-50%)", width: 56, height: 26,
              background: "#fde68a", opacity: 0.93, borderRadius: 3, boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
            }}/>

            {/* Card */}
            <div className="bg-white px-7 pt-7 pb-5" style={{ border: "2px solid #222", borderRadius: 14, boxShadow: "5px 5px 0px #222" }}>

              {/* Brand */}
              <div className="flex flex-col items-center mb-3">
                <Link to="/" className="flex items-center gap-1.5 mb-0.5">
                  <img src="/logo.png?v=3" alt="Tutor Quest" className="w-6 h-6 object-contain"/>
                  <span className="font-kalam font-bold text-[17px] text-[#222]">Tutor Quest</span>
                </Link>
                <h1 className="font-kalam font-bold text-[25px] text-[#1a1a1a] leading-tight text-center">Create your account</h1>
                <p className="font-patrick text-[13px] text-gray-400">Join as a student or tutor</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-2.5">
                {/* Role Toggle */}
                <div className="flex rounded-lg overflow-hidden" style={{ border: "2px solid #222" }}>
                  {(["student", "tutor"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className="flex-1 py-2 font-kalam font-bold text-[15px] capitalize transition-all"
                      style={{ background: role === r ? "#222" : "white", color: role === r ? "white" : "#222" }}>
                      {r === "student" ? "Student" : "Tutor"}
                    </button>
                  ))}
                </div>

                {/* Inputs */}
                {[
                  { id: "signup-full-name", label: "Full Name", type: "text", val: fullName, set: setFullName, ph: "John Doe", Icon: User },
                  { id: "signup-email", label: "Email", type: "email", val: email, set: setEmail, ph: "you@example.com", Icon: Mail },
                  { id: "signup-phone", label: "Phone Number", type: "tel", val: phone, set: setPhone, ph: "+91 98765 43210", Icon: Phone },
                ].map(({ id, label, type, val, set, ph, Icon }) => (
                  <div key={label}>
                    <label htmlFor={id} className="font-patrick text-[12px] font-semibold text-[#333] block mb-1">{label}</label>
                    <div className="relative flex items-center">
                      <Icon className="absolute left-3 w-3.5 h-3.5 text-gray-400" strokeWidth={1.8}/>
                      <input id={id} type={type} placeholder={ph} value={val} onChange={e => set(e.target.value as any)}
                        required={label !== "Phone Number"}
                        className="w-full pl-9 pr-3 py-2 font-patrick text-[13px] text-[#333] placeholder:text-gray-300 bg-white focus:outline-none"
                        style={{ border: (label === "Phone Number" && phoneError) ? "1.8px solid #ef4444" : "1.8px solid #222", borderRadius: 7 }}/>
                    </div>
                    {label === "Phone Number" && phoneError && <p className="font-patrick text-[11px] text-red-500 mt-0.5">{phoneError}</p>}
                  </div>
                ))}

                {/* Password */}
                <div>
                  <label htmlFor="signup-password" className="font-patrick text-[12px] font-semibold text-[#333] block mb-1">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-3.5 h-3.5 text-gray-400" strokeWidth={1.8}/>
                    <input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-9 pr-9 py-2 font-patrick text-[13px] text-[#333] placeholder:text-gray-400 bg-white focus:outline-none"
                      style={{ border: "1.8px solid #222", borderRadius: 7 }}/>
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-[#222] transition-colors">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: i <= pwScore ? (pwColors[pwScore] || "#22c55e") : "#e5e7eb" }}/>
                      ))}
                      <span className="font-patrick text-[11px] font-semibold ml-1" style={{ color: pwColors[pwScore] }}>{pwLabel}</span>
                    </div>
                  )}
                </div>

                {/* Subject tags */}
                {role === "student" && (
                  <div>
                    <label className="font-patrick text-[12px] font-semibold text-[#333] block mb-1">Preferred Subjects (optional)</label>
                    <div className="flex flex-wrap gap-1">
                      {subjectsList.map(s => {
                        const sel = preferredSubjects.includes(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleSubject(s)}
                            className="font-patrick text-[11px] px-2.5 py-0.5 transition-all"
                            style={{ border: "1.5px solid #222", borderRadius: 20, background: sel ? "#222" : "white", color: sel ? "white" : "#222", boxShadow: sel ? "none" : "1px 1px 0px #222" }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {role === "tutor" && (
                  <div>
                    <label htmlFor="signup-subject" className="font-patrick text-[12px] font-semibold text-[#333] block mb-1">Primary Subject</label>
                    <select id="signup-subject" value={subject} onChange={e => setSubject(e.target.value)}
                      className="w-full px-3 py-2 font-patrick text-[13px] text-[#333] bg-white focus:outline-none"
                      style={{ border: "1.8px solid #222", borderRadius: 7 }}>
                      <option value="">Select a subject</option>
                      {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Sign Up */}
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 text-white font-kalam font-bold text-[18px] disabled:opacity-60 transition-all"
                  style={{ background: "#e8534a", border: "2px solid #222", borderRadius: 8, boxShadow: "3px 3px 0px #222" }}>
                  {loading ? "Creating..." : `Sign Up as ${role === "student" ? "Student" : "Tutor"}`}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ borderTop: "1px dashed #ccc" }}/>
                  <span className="font-patrick text-[10px] font-semibold uppercase tracking-widest text-gray-400">Or continue with</span>
                  <div className="flex-1 h-px" style={{ borderTop: "1px dashed #ccc" }}/>
                </div>

                {/* Google */}
                <motion.button type="button" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white font-kalam font-bold text-[15px] text-[#222] transition-all"
                  style={{ border: "1.8px solid #222", borderRadius: 8, boxShadow: "3px 3px 0px #222" }}
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: window.location.origin },
                    });
                    if (error) toast({ title: "Google sign up failed", description: error.message, variant: "destructive" });
                  }}>
                  <GoogleIcon/>
                  Continue with Google
                </motion.button>

                <p className="text-center font-patrick text-[13px] text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-[#e8534a] hover:underline">Sign in</Link>
                </p>
              </form>
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="hidden lg:flex flex-col justify-end items-start w-[300px] shrink-0 pb-0">
          <motion.img src="/signup-student.png?v=1" alt="Student" className="w-[290px] object-contain"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}/>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
