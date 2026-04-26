import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const TUTORS = [
  { name: "Emily Sharma", subject: "Maths Tutor", rating: 4.9, reviews: 128, price: 600, imgSrc: "/avatars/emily.png", bg: "#fef3c7" },
  { name: "Rohit Jain", subject: "Physics Tutor", rating: 4.8, reviews: 96, price: 700, imgSrc: "/avatars/rohit.png", bg: "#fef3c7" },
  { name: "Aisha Khan", subject: "English Tutor", rating: 4.9, reviews: 156, price: 500, imgSrc: "/avatars/aisha.png", bg: "#fef3c7" },
  { name: "Arjun Verma", subject: "Chemistry Tutor", rating: 4.7, reviews: 83, price: 650, imgSrc: "/avatars/arjun.png", bg: "#fef3c7" },
];

const BrowseTopTutors = () => (
  <section className="py-20 md:py-28 bg-transparent">
    <div className="container max-w-6xl mx-auto px-6">
      <ScrollReveal variant="fadeUp">
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
          <span 
            className="bg-white text-black px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-2 border-[#2d2d2d] mb-4 uppercase tracking-wider"
            style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(-2deg)" }}
          >
            Top
          </span>
          <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
            Browse Top Tutors
          </h2>
          <p className="mt-2 font-patrick text-sm md:text-base text-gray-600">
            Connect with highly rated tutors in your area.
          </p>
        </div>
      </ScrollReveal>

      <div className="relative mt-12 md:mt-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TUTORS.map((t, i) => (
            <ScrollReveal key={t.name} variant="fadeUp" delay={i * 0.1}>
              <motion.div
                className="bg-white border-[3px] border-[#2d2d2d] p-6 flex flex-col items-center shadow-[4px_4px_0px_#2d2d2d] h-full"
                style={{ 
                  borderRadius: i % 2 === 0 ? "15px 255px 15px 225px / 225px 15px 255px 15px" : "255px 15px 225px 15px / 15px 225px 15px 255px",
                  transform: i % 2 === 0 ? "rotate(1deg)" : "rotate(-1deg)" 
                }}
                whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #2d2d2d" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div 
                  className="w-20 h-20 rounded-full border-[2px] border-[#2d2d2d] overflow-hidden mb-5 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: t.bg }}
                >
                  <img src={t.imgSrc} alt={t.name} className="w-full h-full object-cover translate-y-1 scale-110" />
                </div>
                
                <h3 className="font-kalam font-bold text-[#2d2d2d] text-lg leading-tight">{t.name}</h3>
                <p className="font-sans text-[11px] font-medium text-gray-500 mb-2">{t.subject}</p>
                
                <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-gray-600 mb-3">
                  <Star className="w-3.5 h-3.5 fill-[#facc15] text-[#facc15]" />
                  <span>{t.rating}</span>
                  <span className="text-gray-400 font-normal">({t.reviews})</span>
                </div>

                <span className="font-kalam text-[22px] font-bold text-[#ef4444] mb-6 mt-auto">
                  ₹{t.price}/hr
                </span>

                <Link 
                  to="/find-tutors" 
                  className="w-full text-center font-sans text-[11px] font-bold px-4 py-2.5 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                  style={{ borderRadius: "255px 8px 225px 8px / 8px 225px 8px 255px" }}
                >
                  View Profile
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Carousel Right Arrow */}
        <button 
          className="hidden xl:flex absolute -right-16 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-[2px] border-[#2d2d2d] rounded-full items-center justify-center shadow-[2px_2px_0px_#2d2d2d] hover:bg-gray-50 transition-colors z-10" 
          aria-label="Next tutors"
        >
          <ChevronRight className="w-5 h-5 text-[#2d2d2d] ml-0.5" />
        </button>
      </div>
    </div>
  </section>
);

export default BrowseTopTutors;
