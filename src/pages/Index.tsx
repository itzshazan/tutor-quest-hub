import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BrowseTopTutors from "@/components/landing/BrowseTopTutors";
import HowItWorks from "@/components/landing/HowItWorks";
import PlatformFeatures from "@/components/landing/PlatformFeatures";
import FeaturedTutorsScroll from "@/components/landing/FeaturedTutorsScroll";
import BenefitsSection from "@/components/landing/BenefitsSection";
import PricingSection from "@/components/landing/PricingSection";
import Testimonials from "@/components/landing/Testimonials";
import TutorCTA from "@/components/landing/TutorCTA";
import Footer from "@/components/landing/Footer";
import { SEO, jsonLdGenerators } from "@/components/SEO";
import { HandDrawnDivider } from "@/components/ui/hand-drawn-divider";

const Index = () => {
  return (
    <div className="light hd-page min-h-screen bg-[#fdfbf7]" data-theme="light">
      <SEO url="/" jsonLd={jsonLdGenerators.service()} />
      <Navbar />
      <main>
        <HeroSection />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <BrowseTopTutors />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <HowItWorks />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <PlatformFeatures />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <FeaturedTutorsScroll />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <BenefitsSection />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <PricingSection />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <Testimonials />
        <HandDrawnDivider variant="wavy" className="opacity-60 -my-4" />
        <TutorCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

