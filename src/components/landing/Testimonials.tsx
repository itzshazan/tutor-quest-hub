import { Star, ChevronRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const fallbackTestimonials = [
  {
    id: "1",
    rating: 5,
    review_text: `"Tutor Quest helped me find the perfect maths tutor near my home."`,
    student_name: "Ananya S.",
    avatarSrc: "/avatars/ananya.png",
  },
  {
    id: "2",
    rating: 5,
    review_text: `"Great platform! I got more students and flexible work opportunities."`,
    student_name: "Rahul M.",
    avatarSrc: "/avatars/rahul.png",
  },
  {
    id: "3",
    rating: 5,
    review_text: `"Easy to use, reliable, and safe. Highly recommended!"`,
    student_name: "Sneha T.",
    avatarSrc: "/avatars/sneha.png",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-transparent overflow-hidden">
      <div className="container max-w-[1000px] mx-auto px-6 relative">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
            <span 
              className="bg-[#fef3c7] text-[#2d2d2d] px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-4 uppercase tracking-wider"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(-1deg)" }}
            >
              Reviews
            </span>
            <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
              Loved by students and tutors
            </h2>
            <p className="mt-2 font-patrick text-sm md:text-base text-gray-500">
              Real stories from our happy community.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-12 md:mt-16">
          <div className="grid gap-6 md:grid-cols-3 relative z-10">
            {fallbackTestimonials.map((review, i) => (
              <ScrollReveal key={review.id} variant="fadeUp" delay={i * 0.1} className="h-full">
                <div 
                  className="bg-white border-[3px] border-[#2d2d2d] p-6 flex flex-col justify-between shadow-[4px_4px_0px_#2d2d2d] h-full hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#2d2d2d] transition-transform"
                  style={{ 
                    borderRadius: i % 2 === 0 ? "15px 255px 15px 225px / 225px 15px 255px 15px" : "255px 15px 225px 15px / 15px 225px 15px 255px",
                    transform: i === 1 ? "rotate(-1deg)" : (i === 0 ? "rotate(1deg)" : "rotate(0.5deg)")
                  }}
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-[#ef4444] text-[#ef4444]" />
                      ))}
                    </div>
                    <p className="font-patrick text-sm text-gray-600 leading-relaxed italic mb-8">
                      {review.review_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 border-[2px] border-[#2d2d2d] overflow-hidden flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#fef3c7", borderRadius: "50%" }}
                    >
                      <img src={review.avatarSrc} alt={review.student_name} className="w-full h-full object-cover translate-y-0.5 scale-110" />
                    </div>
                    <span className="font-kalam font-bold text-[#2d2d2d] text-sm">- {review.student_name}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Carousel Right Arrow */}
          <button 
            className="hidden xl:flex absolute -right-16 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-[2px] border-[#2d2d2d] rounded-full items-center justify-center shadow-[2px_2px_0px_#2d2d2d] hover:bg-gray-50 transition-colors z-10" 
            aria-label="Next testimonials"
          >
            <ChevronRight className="w-5 h-5 text-[#2d2d2d] ml-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
