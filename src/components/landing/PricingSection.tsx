import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Tilt3D } from "./Tilt3D";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Student",
    price: "Free",
    description: "Everything you need to find and book tutors.",
    features: [
      "Unlimited tutor search",
      "Direct messaging",
      "Session booking",
      "Payment protection",
      "Review & rate tutors",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Tutor",
    price: "Free",
    description: "Start teaching and earning with zero upfront cost.",
    features: [
      "Create your profile",
      "Set your own rates",
      "Accept booking requests",
      "Secure escrow payments",
      "Build your reputation",
      "10% platform commission",
    ],
    cta: "Start Teaching",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Premium Tutor",
    price: "₹499/mo",
    description: "Boost visibility and get priority placement.",
    features: [
      "Everything in Tutor plan",
      "Featured in search results",
      "Priority support",
      "Analytics dashboard",
      "5% platform commission",
      "Verified badge",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: false,
    disabled: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="flipUp">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Pricing</p>
            <h2 className="mt-3 text-display text-foreground">Simple, transparent pricing</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              No hidden fees. Get started for free and only pay when you're ready.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {plans.map((plan) => (
            <StaggerItem key={plan.name} variant="flipUp">
              <Tilt3D
                intensity={plan.highlighted ? 10 : 7}
                scale={plan.highlighted ? 1.03 : 1.02}
                className={`group relative flex h-full flex-col rounded-2xl border p-8 shadow-card transition-shadow hover:shadow-card-hover ${
                  plan.highlighted ? "border-accent bg-primary text-primary-foreground" : "bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold text-accent-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                <div style={{ transform: "translateZ(20px)" }}>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-display text-inherit">{plan.price}</span>
                  </div>
                  <p className={`mt-2 text-body-sm ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-8 flex-1 space-y-4" style={{ transform: "translateZ(15px)" }}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-accent" : "text-accent"}`} />
                      <span className={`text-body-sm ${plan.highlighted ? "text-primary-foreground/90" : "text-foreground"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8" style={{ transform: "translateZ(25px)" }}>
                  <Button
                    size="lg"
                    className={`w-full rounded-full ${
                      plan.highlighted
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={plan.disabled}
                    asChild={!plan.disabled}
                  >
                    {plan.disabled ? (
                      <span>{plan.cta}</span>
                    ) : (
                      <Link to={plan.href}>{plan.cta}</Link>
                    )}
                  </Button>
                </div>
              </Tilt3D>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default PricingSection;
