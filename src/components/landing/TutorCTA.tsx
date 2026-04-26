import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "./ScrollReveal";

const FloatingDoodles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: "inherit" }}>
    {/* Red Pencil (top left) */}
    <svg viewBox="0 0 24 24" fill="none" className="absolute top-[15%] left-[8%] w-8 h-8 -rotate-45" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 4L20 5C20.5523 5.55228 20.5523 6.44772 20 7L18.5 8.5L15.5 5.5L17 4C17.5523 3.44772 18.4477 3.44772 19 4Z" fill="#ef4444" stroke="#2d2d2d" strokeWidth="1.5" />
      <path d="M15.5 5.5L4.5 16.5L3 21L7.5 19.5L18.5 8.5L15.5 5.5Z" fill="#fca5a5" stroke="#2d2d2d" strokeWidth="1.5" />
      <path d="M4.5 16.5L7.5 19.5" stroke="#2d2d2d" strokeWidth="1.5" />
      <path d="M15.5 5.5L18.5 8.5" stroke="#2d2d2d" strokeWidth="1.5" />
    </svg>

    {/* Green Star (bottom left) */}
    <svg viewBox="0 0 24 24" fill="none" className="absolute bottom-[20%] left-[12%] w-6 h-6 rotate-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" fill="#86efac" stroke="#2d2d2d" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>

    {/* Yellow Star (top right) */}
    <svg viewBox="0 0 24 24" fill="none" className="absolute top-[20%] right-[10%] w-6 h-6 -rotate-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" fill="#facc15" stroke="#2d2d2d" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>

    {/* Pink Flower/Shape (bottom right) */}
    <svg viewBox="0 0 24 24" fill="none" className="absolute bottom-[25%] right-[5%] w-7 h-7 rotate-[20deg]" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C14.5 2 16.5 4 16.5 6.5C16.5 7.2 16.3 7.8 16 8.3C18.2 9.1 19.5 11.2 19.5 13.5C19.5 16.5 17 19 14 19H10C7 19 4.5 16.5 4.5 13.5C4.5 11.2 5.8 9.1 8 8.3C7.7 7.8 7.5 7.2 7.5 6.5C7.5 4 9.5 2 12 2Z" fill="#f9a8d4" stroke="#2d2d2d" strokeWidth="1.5" />
    </svg>
  </div>
);

const TutorCTA = () => {
  const navigate = useNavigate();

  return (
    <section id="become-tutor" className="py-20 md:py-28 bg-transparent">
      <div className="container max-w-[1200px] mx-auto px-6">
        <ScrollReveal variant="fadeUp">
          <div 
            className="relative bg-[#fef3c7] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] px-8 pt-16 pb-12 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
              transform: "rotate(1deg)",
            }}
          >
            <FloatingDoodles />
            
            {/* Top Label Pill */}
            <div 
              className="absolute -top-[16px] left-1/2 -translate-x-1/2 font-kalam text-sm font-bold bg-white border-[3px] border-[#2d2d2d] px-6 py-1 shadow-[2px_2px_0px_#2d2d2d] z-10 whitespace-nowrap text-[#2d2d2d]"
              style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(-1deg) translateX(-50%)" }}
            >
              Join Now
            </div>

            <div className="flex-1 text-center flex flex-col items-center justify-center z-10">
              <h2 className="font-kalam font-bold text-3xl md:text-[2.5rem] text-[#2d2d2d] leading-tight">
                Start teaching students <br/>
                <span className="text-[#ef4444] italic">in your area</span>
              </h2>
              <p className="mt-4 font-sans text-sm text-[#2d2d2d] max-w-sm mx-auto font-medium">
                Join thousands of tutors on Tutor Quest and make a difference in your community.
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => navigate('/find-tutors')} 
                  className="bg-white text-[#2d2d2d] font-sans text-sm font-bold px-8 py-2.5 border-[2px] border-[#2d2d2d] rounded-md shadow-[2px_2px_0px_#2d2d2d] hover:-translate-y-0.5 hover:bg-gray-50 transition-all"
                  style={{ borderRadius: "8px 255px 8px 225px / 225px 8px 255px 8px" }}
                >
                  Search Tutors
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="bg-white text-[#2d2d2d] font-sans text-sm font-bold px-8 py-2.5 border-[2px] border-[#2d2d2d] rounded-md shadow-[2px_2px_0px_#2d2d2d] hover:-translate-y-0.5 hover:bg-gray-50 transition-all"
                  style={{ borderRadius: "255px 8px 225px 8px / 8px 225px 8px 255px" }}
                >
                  Become a Tutor
                </button>
              </div>
            </div>

            <div className="w-full max-w-[280px] shrink-0 mt-auto relative z-10 hidden md:block">
              <img src="/illustrations/cta.png?v=2" alt="Tutor CTA Illustration" className="w-full h-auto object-contain mix-blend-multiply" style={{ filter: 'contrast(1.05) brightness(1.05)' }} />
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TutorCTA;
