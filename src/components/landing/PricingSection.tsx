import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const LoopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="M9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12Z" />
  </svg>
);

const HandDrawnArrow = () => (
  <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden xl:block opacity-70">
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 C 30 10, 50 40, 10 70" stroke="#2d2d2d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 70 L 25 65 M10 70 L 15 55" stroke="#2d2d2d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const plans = [
  {
    name: "Student",
    price: "Free",
    features: [
      "Search & connect with tutors",
      "Chat with tutors",
      "Book sessions",
      "No hidden fees",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Tutor",
    price: "Free",
    features: [
      "Create tutor profile",
      "Connect with students",
      "Manage sessions",
      "Secure payments",
      "Grow your reach",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Premium Tutor",
    price: "₹499/mo",
    features: [
      "All Free features",
      "Priority listing",
      "Advanced analytics",
      "Profile boost",
      "More visibility",
    ],
    cta: "Upgrade Now",
    href: "#",
    highlighted: false,
    useAltIcon: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-transparent">
      <div className="container max-w-[1000px] mx-auto px-6 relative">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
            <span 
              className="bg-[#fef3c7] text-[#2d2d2d] px-4 py-1 text-[10px] font-bold shadow-[2px_2px_0px_#2d2d2d] border-[2px] border-[#2d2d2d] mb-4 uppercase tracking-wider"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", transform: "rotate(-1deg)" }}
            >
              Pricing
            </span>
            <h2 className="mt-2 text-3xl md:text-[2.5rem] font-kalam font-bold text-[#2d2d2d]">
              Simple, transparent pricing
            </h2>
            <p className="mt-2 font-patrick text-sm md:text-base text-gray-500">
              Choose the plan that works best for you.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3 relative z-10">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} variant="fadeUp" delay={i * 0.1} className="relative h-full">
              <div 
                className={`relative h-full flex flex-col bg-white border-[3px] border-[#2d2d2d] p-8 shadow-[4px_4px_0px_#2d2d2d] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#2d2d2d] ${
                  plan.highlighted ? "md:-mt-2 md:mb-2 bg-[#fef3c7]" : ""
                }`}
                style={{ 
                  backgroundColor: plan.highlighted ? "#fef3c7" : "#ffffff",
                  borderRadius: i % 2 === 0 ? "15px 255px 15px 225px / 225px 15px 255px 15px" : "255px 15px 225px 15px / 15px 225px 15px 255px",
                  transform: i === 1 ? "rotate(-1deg)" : (i === 0 ? "rotate(1deg)" : "rotate(0.5deg)")
                }}
              >
                {plan.highlighted && (
                  <div 
                    className="absolute -top-[14px] right-6 bg-[#ef4444] text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d]"
                    style={{ borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px", transform: "rotate(2deg)" }}
                  >
                    Most Popular
                  </div>
                )}
                
                <h3 className="font-kalam font-bold text-[#2d2d2d] text-base italic">{plan.name}</h3>
                <div className="mt-2 mb-6">
                  <span className="font-kalam font-bold text-[2.5rem] text-[#2d2d2d] leading-none">{plan.price}</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      {plan.useAltIcon ? (
                        <LoopIcon />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-[1.5px] border-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#ef4444]" strokeWidth={3} />
                        </div>
                      )}
                      <span className="font-patrick text-sm font-medium text-gray-600 leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className="w-full text-center font-sans text-[11px] font-bold px-4 py-2.5 border-[2px] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] bg-white hover:bg-gray-50 transition-all hover:-translate-y-0.5 mt-auto"
                  style={{ borderRadius: "255px 8px 225px 8px / 8px 225px 8px 255px" }}
                >
                  {plan.cta}
                </Link>
              </div>
              
              {/* Add arrow after 3rd card */}
              {i === 2 && <HandDrawnArrow />}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
