import { Search, MessageCircle, CalendarCheck, BookOpen } from "lucide-react";
import { motion, useInView, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";
import { ScrollReveal } from "./ScrollReveal";

const steps = [
  { icon: Search, title: "Search", desc: "Find tutors by subject, location, or availability.", num: 1 },
  { icon: MessageCircle, title: "Connect", desc: "Chat with tutors and ask your questions.", num: 2 },
  { icon: CalendarCheck, title: "Schedule", desc: "Book a session at your preferred time.", num: 3 },
  { icon: BookOpen, title: "Learn", desc: "Start learning and achieve your goals.", num: 4 },
];

const AnimatedConnector = () => {
  const ref = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  useEffect(() => {
    if (isInView) {
      controls.start({
        strokeDashoffset: 0,
        transition: { duration: 1.4, ease: "easeOut", delay: 0.2 },
      });
    }
  }, [isInView, controls]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-x-0 top-10 hidden w-full lg:block z-0">
      <svg
        height="40"
        viewBox="0 0 900 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: "100%" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M1 1 L5 3 L1 5" />
          </marker>
        </defs>

        <motion.path
          ref={ref}
          // Arches up for all three connections to match the screenshot
          d="M160 30 Q200 10 240 25  M390 30 Q430 10 470 25  M620 30 Q660 10 700 25"
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
          initial={{ strokeDashoffset: 900 }}
          animate={controls}
        />
      </svg>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-20 md:py-28 bg-transparent">
      <div className="container max-w-5xl mx-auto px-6 relative">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
            <span 
              className="bg-[#fef3c7] text-[#2d2d2d] px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-4 uppercase tracking-wider"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(-1deg)" }}
            >
              Process
            </span>
            <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
              Get started in four simple steps
            </h2>
            <p className="mt-2 font-patrick text-sm md:text-base text-gray-500">
              It's quick, easy, and built for the way you learn.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-16 md:mt-20">
          <AnimatedConnector />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {steps.map((s, i) => (
              <ScrollReveal key={s.title} variant="fadeUp" delay={i * 0.15}>
                <div className="flex flex-col items-center text-center px-4">
                  
                  {/* Icon Square */}
                  <div 
                    className="relative w-[72px] h-[72px] bg-white border-[2px] border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] flex items-center justify-center mb-6"
                    style={{ 
                      borderRadius: i % 2 === 0 ? "255px 15px 225px 15px / 15px 225px 15px 255px" : "15px 255px 15px 225px / 225px 15px 255px 15px",
                      transform: i % 2 === 0 ? "rotate(2deg)" : "rotate(-2deg)" 
                    }}
                  >
                    <s.icon className="w-7 h-7 text-[#2d2d2d]" strokeWidth={2} />
                    
                    {/* Number Badge */}
                    <div 
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#ef4444] text-white border-[2px] border-[#2d2d2d] flex items-center justify-center text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d]"
                      style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
                    >
                      {s.num}
                    </div>
                  </div>
                  
                  <h3 className="font-kalam font-bold text-[#2d2d2d] text-xl mb-2">{s.title}</h3>
                  <p className="font-patrick text-sm text-gray-500 leading-snug max-w-[180px]">
                    {s.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
