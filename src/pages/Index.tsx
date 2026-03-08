import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TutorSearchPreview from "@/components/landing/TutorSearchPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import PlatformFeatures from "@/components/landing/PlatformFeatures";
import FeaturedTutors from "@/components/landing/FeaturedTutors";
import BenefitsSection from "@/components/landing/BenefitsSection";
import PricingSection from "@/components/landing/PricingSection";
import TutorCTA from "@/components/landing/TutorCTA";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TutorSearchPreview />
      <HowItWorks />
      <PlatformFeatures />
      <FeaturedTutors />
      <BenefitsSection />
      <PricingSection />
      <Testimonials />
      <TutorCTA />
      <Footer />
    </div>
  );
};

export default Index;
