import { Link } from "react-router-dom";
import { Star, ShieldCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const TUTORS = [
  { name: "Neha Patel",   subject: "Biology Tutor",          rating: 4.9, reviews: 110, price: 550, imgSrc: "/avatars/aisha.png", bg: "#fef3c7" },
  { name: "Vikram Rao",   subject: "Computer Science Tutor", rating: 4.8, reviews: 91,  price: 750, imgSrc: "/avatars/arjun.png", bg: "#fef3c7" },
  { name: "Priya Singh",  subject: "Accounts Tutor",         rating: 4.9, reviews: 102, price: 600, imgSrc: "/avatars/emily.png", bg: "#fef3c7" },
];

const FeaturedTutorsScroll = () => {
  return (
    <section className="py-20 md:py-28 bg-transparent overflow-hidden">
      <div className="container max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto text-center flex flex-col items-center">
            {/* Popular Badge */}
            <span 
              className="bg-[#ef4444] text-white px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-4 uppercase tracking-wider flex items-center gap-1.5"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(-1deg)" }}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Popular
            </span>
            
            <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
              Featured Tutors
            </h2>
            <p className="mt-2 font-patrick text-sm md:text-base text-gray-500">
              Handpicked tutors you might love.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-12 md:mt-16">
          {/* Card Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {TUTORS.map((t, i) => (
              <ScrollReveal key={t.name} variant="fadeUp" delay={i * 0.1}>
                <motion.div
                  className="bg-white border-[3px] border-[#2d2d2d] p-5 flex flex-col gap-5 shadow-[4px_4px_0px_#2d2d2d] h-full"
                  style={{ 
                    borderRadius: i % 2 === 0 ? "15px 255px 15px 225px / 225px 15px 255px 15px" : "255px 15px 225px 15px / 15px 225px 15px 255px",
                    transform: i % 2 === 0 ? "rotate(1deg)" : "rotate(-1deg)" 
                  }}
                  whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #2d2d2d" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Top Row: Avatar + Info */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-[60px] h-[60px] border-[2px] border-[#2d2d2d] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: t.bg, borderRadius: "50%" }}
                    >
                      <img src={t.imgSrc} alt={t.name} className="w-full h-full object-cover translate-y-1 scale-110" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-kalam font-bold text-[#2d2d2d] text-lg leading-tight mb-0.5">{t.name}</h3>
                      <p className="font-sans text-[11px] md:text-xs text-gray-500 font-medium">{t.subject}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs font-sans font-medium text-gray-600">
                        <Star className="w-3.5 h-3.5 fill-[#ef4444] text-[#ef4444]" />
                        <span>{t.rating}</span>
                        <span className="text-gray-400 font-normal">({t.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Price + Buttons */}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-kalam text-[20px] font-bold text-[#ef4444]">
                      ₹{t.price}/hr
                    </span>
                    <div className="flex gap-2">
                      <Link 
                        to="/find-tutors" 
                        className="font-sans text-[11px] font-bold px-3 py-1.5 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-center"
                        style={{ borderRadius: "255px 8px 225px 8px / 8px 225px 8px 255px" }}
                      >
                        View Profile
                      </Link>
                      <Link 
                        to="/find-tutors" 
                        className="font-sans text-[11px] font-bold px-3 py-1.5 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-center"
                        style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px" }}
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>

          {/* Carousel Right Arrow */}
          <button 
            className="hidden xl:flex absolute -right-16 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-[2px] border-[#2d2d2d] rounded-full items-center justify-center shadow-[2px_2px_0px_#2d2d2d] hover:bg-gray-50 transition-colors z-10" 
            aria-label="Next featured tutors"
          >
            <ChevronRight className="w-5 h-5 text-[#2d2d2d] ml-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTutorsScroll;
