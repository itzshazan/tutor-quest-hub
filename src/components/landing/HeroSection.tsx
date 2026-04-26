import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, ShieldCheck, CalendarCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const trustItems = [
  { icon: ShieldCheck, label: "Verified Tutors", color: "#ef4444" },
  { icon: MapPin, label: "Local & Nearby", color: "#ef4444" },
  { icon: CalendarCheck, label: "Easy Booking", color: "#ef4444" },
  { icon: Lock, label: "Safe & Secure", color: "#3b82f6" },
];

const HandDrawnUnderline = () => (
  <svg className="absolute -bottom-3 left-0 w-[105%] h-3 text-[#ef4444]" preserveAspectRatio="none" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,8 Q100,0 200,8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const PencilDoodle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-10 left-1/2 -translate-x-4 rotate-[15deg]">
    <path d="M16 4L20 8L8 20H4V16L16 4Z" fill="#facc15" stroke="#2d2d2d" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M16 4L20 8L18 10L14 6L16 4Z" fill="#ef4444" stroke="#2d2d2d" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 20L4 20L4 16L7 17L8 20Z" fill="#fef3c7" stroke="#2d2d2d" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M4 20L5.5 18.5" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HeroSection = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [stats, setStats] = useState({ students: 0 });

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")
      .then(({ count }) => setStats({ students: count || 0 }));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (subject.trim()) params.set("subject", subject.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/find-tutors?${params.toString()}`);
  };

  const badgeText = stats.students > 0
    ? `Trusted by ${stats.students.toLocaleString()}+ students`
    : "Trusted by 6+ students";

  return (
    <section id="home" className="relative pb-12 pt-28 md:pt-32 bg-transparent overflow-hidden">
      
      {/* Floating Shapes */}
      {/* Dashed line top left */}
      <svg className="absolute left-[8%] top-24 hidden md:block opacity-60" width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 70 Q 30 40, 70 50 T 90 10" stroke="#2d2d2d" strokeWidth="2" strokeDasharray="5 5" fill="none" strokeLinecap="round" />
      </svg>
      {/* Pink blob mid left */}
      <motion.div 
        className="pointer-events-none absolute left-[12%] top-60 hidden md:block w-14 h-14 bg-[#fecdd3] border-[3px] border-[#2d2d2d]"
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
      />
      {/* Yellow square top right */}
      <motion.div 
        className="pointer-events-none absolute right-[10%] top-48 hidden md:block w-20 h-20 bg-[#fef3c7] border-[3px] border-[#2d2d2d]"
        style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
        animate={{ y: [0, -15, 0], rotate: [5, -5, 5] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
      />
      {/* 4-pointed star mid right */}
      <svg className="absolute right-[15%] top-72 hidden md:block" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C12 0 12 10 24 12C24 12 14 12 12 24C12 24 12 14 0 12C0 12 10 12 12 0Z" fill="white" stroke="#2d2d2d" strokeWidth="2" />
      </svg>
      {/* Tiny red star right edge */}
      <svg className="absolute right-[8%] top-96 hidden md:block" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C12 0 12 10 24 12C24 12 14 12 12 24C12 24 12 14 0 12C0 12 10 12 12 0Z" fill="#ef4444" />
      </svg>

      <div className="container max-w-[1000px] mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        <ScrollReveal variant="fadeUp" className="w-full flex flex-col items-center">
          
          {/* Badge */}
          <span 
            className="bg-[#fef3c7] text-[#2d2d2d] px-5 py-2 text-[15px] font-patrick font-bold tracking-wide flex items-center gap-2.5 shadow-[3px_3px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-6"
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(-1deg)" }}
          >
            <ShieldCheck className="w-5 h-5 text-[#ef4444]" strokeWidth={2.5} /> 
            {badgeText}
          </span>

          {/* Main Headline */}
          <h1 className="text-[2.75rem] md:text-6xl lg:text-[4.5rem] font-kalam font-bold text-[#2d2d2d] leading-[1.1] tracking-tight relative z-10">
            Find the perfect tutor,
            <br />
            <span className="text-[#ef4444] relative inline-block mt-3 md:mt-4">
              right in your neighborhood
              <HandDrawnUnderline />
            </span>
            <PencilDoodle />
          </h1>

          {/* Subtitle */}
          <p className="mt-8 md:mt-10 text-gray-600 font-patrick text-sm md:text-[17px] max-w-xl mx-auto leading-relaxed">
            Connect with qualified, verified tutors for personalized learning. <br className="hidden md:block" /> Search by subject, location, and schedule.
          </p>

          {/* Search Bar Container */}
          <div 
            className="mt-8 w-full max-w-[850px] bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-2 flex flex-col md:flex-row items-center gap-2 relative z-20"
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          >
            {/* Subject Input */}
            <div className="flex-1 flex items-center px-4 py-2.5 bg-white border-[2px] border-gray-200 rounded-[8px] w-full">
              <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Subject (e.g. Mathematics)" 
                className="w-full bg-transparent border-none focus:outline-none px-3 font-patrick text-base text-[#2d2d2d] placeholder:text-gray-400"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            {/* Location Input */}
            <div className="flex-1 flex items-center px-4 py-2.5 bg-white border-[2px] border-gray-200 rounded-[8px] w-full">
              <MapPin className="w-5 h-5 text-[#ef4444] shrink-0" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Location (e.g. Delhi)" 
                className="w-full bg-transparent border-none focus:outline-none px-3 font-patrick text-base text-[#2d2d2d] placeholder:text-gray-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="w-full md:w-auto bg-white text-[#2d2d2d] font-sans text-sm font-bold px-8 py-3 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] hover:-translate-y-0.5 hover:bg-gray-50 transition-all shrink-0"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
            >
              Search
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-5 relative z-20">
            <motion.button 
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/find-tutors')} 
              className="bg-white text-[#2d2d2d] font-sans text-sm font-bold px-8 py-3.5 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] hover:-translate-y-0.5 hover:bg-gray-50 transition-all flex items-center gap-2"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(-1deg)" }}
            >
              Find Tutors <span className="text-xl leading-none font-normal">→</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')} 
              className="bg-[#ffccb3] text-[#2d2d2d] font-sans text-sm font-bold px-8 py-3.5 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] hover:-translate-y-0.5 hover:opacity-90 transition-all"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(1deg)" }}
            >
              Become a Tutor
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-4 flex flex-wrap justify-center items-center gap-4 md:gap-8 pb-4">
            {trustItems.map((item, idx) => (
              <motion.div 
                key={idx} 
                className="flex items-center gap-2 cursor-default"
                whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
              >
                <item.icon className="w-[18px] h-[18px]" style={{ color: item.color }} strokeWidth={2.5} />
                <span className="font-patrick font-medium text-[15px] text-[#2d2d2d] tracking-wide">{item.label}</span>
                {idx < trustItems.length - 1 && <span className="hidden md:inline-block ml-4 md:ml-8 text-gray-300">|</span>}
              </motion.div>
            ))}
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
};

export default HeroSection;
