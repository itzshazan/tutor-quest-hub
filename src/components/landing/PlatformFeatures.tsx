import { ShieldCheck, Star, MessageSquare, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified & Trusted",
    desc: "All tutors are verified for quality teaching and safety.",
  },
  {
    icon: Star,
    title: "Profile & Reviews",
    desc: "View profiles, ratings, and reviews to choose the best tutor.",
  },
  {
    icon: MessageSquare,
    title: "Easy Communication",
    desc: "Chat directly with tutors for quick and easy communication.",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    desc: "Book and reschedule sessions that fit your time.",
  },
];

const PlatformFeatures = () => {
  return (
    <section className="py-20 md:py-28 bg-transparent">
      <div className="container max-w-[1300px] mx-auto px-6">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
            <span 
              className="bg-[#fef3c7] text-[#2d2d2d] px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-4 uppercase tracking-wider"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(-1deg)" }}
            >
              Features
            </span>
            <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
              Everything you need for better learning
            </h2>
            <p className="mt-2 font-patrick text-sm md:text-base text-gray-500">
              Tools and features to support your learning journey.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 md:mt-16 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} variant="fadeUp" delay={i * 0.1}>
              <motion.div
                className="bg-white border-[3px] border-[#2d2d2d] p-5 md:p-6 flex items-start gap-4 shadow-[4px_4px_0px_#2d2d2d] h-full"
                style={{ 
                  borderRadius: i % 2 === 0 ? "255px 15px 225px 15px / 15px 225px 15px 255px" : "15px 255px 15px 225px / 225px 15px 255px 15px",
                  transform: i % 2 === 0 ? "rotate(1deg)" : "rotate(-1deg)" 
                }}
                whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #2d2d2d" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Icon Container */}
                <div 
                  className="w-10 h-10 shrink-0 bg-[#fef3c7] border-[2px] border-[#2d2d2d] flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d]"
                  style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
                >
                  <f.icon className="w-5 h-5 text-[#2d2d2d]" strokeWidth={2.5} />
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col">
                  <h3 className="font-kalam font-bold text-[#2d2d2d] text-base md:text-lg leading-tight mb-1">{f.title}</h3>
                  <p className="font-patrick text-sm text-gray-500 leading-snug">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
