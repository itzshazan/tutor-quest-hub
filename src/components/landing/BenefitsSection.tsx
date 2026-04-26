import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { Check } from "lucide-react";



const studentBenefits = [
  "Access to verified, experienced tutors",
  "Find tutors near you, anytime",
  "Personalized learning experience",
  "Safe, secure, and easy to use",
];

const tutorBenefits = [
  "Reach more local students",
  "Grow your tutoring business",
  "Flexible hours and schedules",
  "Secure payments and payouts",
];

const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-transparent">
      <div className="container max-w-[1300px] mx-auto px-6">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
            <span className="bg-[#fef3c7] text-black px-3 py-1 rounded-md text-[10px] font-bold shadow-[2px_2px_0px_black] border border-black mb-4 uppercase tracking-wider">
              Benefits
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-kalam font-bold text-black">
              Why choose Tutor Quest?
            </h2>
            <p className="mt-2 font-sans text-xs md:text-sm text-gray-500 italic">
              We make tutoring simple and reliable.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-20 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-8 relative">

          {/* Left Illustration (Student) - Absolute on large screens, standard on small */}
          <div className="hidden lg:flex w-[200px] xl:w-[240px] shrink-0 translate-y-12 xl:-translate-x-4">
            <img src="/illustrations/students.png?v=2" alt="Student illustration" className="w-full h-auto object-contain mix-blend-multiply" style={{ filter: 'contrast(1.05) brightness(1.05)' }} />
          </div>

          {/* Center Cards Container */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-12 w-full max-w-4xl z-10">

            {/* For Students Card (Yellow) */}
            <ScrollReveal variant="fadeUp" delay={0.1} className="w-full md:w-1/2">
              <div 
                className="relative bg-[#fef3c7] border-[3px] border-[#2d2d2d] px-8 pt-12 pb-10 shadow-[6px_6px_0px_0px_#2d2d2d] h-full"
                style={{
                  borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
                  transform: "rotate(-1deg)",
                }}
              >
                {/* Title Badge */}
                <div 
                  className="absolute -top-[20px] left-8 bg-white border-[3px] border-[#2d2d2d] px-5 py-1.5 shadow-[3px_3px_0px_0px_#2d2d2d] font-kalam font-bold text-lg text-[#2d2d2d] whitespace-nowrap"
                  style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(1deg)" }}
                >
                  For Students
                </div>

                <ul className="space-y-5">
                  {studentBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="font-sans text-sm font-medium text-gray-800 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* For Tutors Card (White) */}
            <ScrollReveal variant="fadeUp" delay={0.2} className="w-full md:w-1/2">
              <div 
                className="relative bg-white border-[3px] border-[#2d2d2d] px-8 pt-12 pb-10 shadow-[6px_6px_0px_0px_#2d2d2d] h-full"
                style={{
                  borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
                  transform: "rotate(1deg)",
                }}
              >
                {/* Title Badge */}
                <div 
                  className="absolute -top-[20px] left-8 bg-white border-[3px] border-[#2d2d2d] px-5 py-1.5 shadow-[3px_3px_0px_0px_#2d2d2d] font-kalam font-bold text-lg text-[#2d2d2d] whitespace-nowrap"
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(-1deg)" }}
                >
                  For Tutors
                </div>

                <ul className="space-y-5">
                  {tutorBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="font-sans text-sm font-medium text-gray-800 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Illustration (Tutor) - Absolute on large screens, standard on small */}
          <div className="hidden lg:flex w-[200px] xl:w-[240px] shrink-0 translate-y-12 xl:translate-x-4">
            <img src="/illustrations/tutors.png?v=2" alt="Tutor illustration" className="w-full h-auto object-contain mix-blend-multiply" style={{ filter: 'contrast(1.05) brightness(1.05)' }} />
          </div>

        </div>
        
        {/* Mobile Illustrations (Visible only on smaller screens) */}
        <div className="flex lg:hidden justify-center items-center gap-8 mt-12">
          <div className="w-[140px]"><img src="/illustrations/students.png?v=2" alt="Student" className="w-full h-auto mix-blend-multiply" style={{ filter: 'contrast(1.05) brightness(1.05)' }} /></div>
          <div className="w-[140px]"><img src="/illustrations/tutors.png?v=2" alt="Tutor" className="w-full h-auto mix-blend-multiply" style={{ filter: 'contrast(1.05) brightness(1.05)' }} /></div>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;
