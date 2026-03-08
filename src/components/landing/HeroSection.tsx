import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const TRUST_ITEMS = [
  "10,000+ students",
  "Verified tutors",
  "Secure payments",
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0px", "-40px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (subject.trim()) params.set("subject", subject.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/find-tutors?${params.toString()}`);
  };

  return (
    <section ref={sectionRef} id="home" className="relative overflow-hidden pb-24 pt-16 md:pb-32 md:pt-24">
      {/* Parallax background */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background"
        style={{ y: bgY }}
      />

      <div className="container relative">
        <motion.div className="mx-auto max-w-3xl text-center" style={{ y: textY, opacity }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5 }}
            style={{ perspective: 800 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-body-sm font-medium text-muted-foreground shadow-soft">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Trusted by 10,000+ students across India
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8 text-display-lg text-foreground md:text-[3.5rem]"
          >
            Find the perfect tutor,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              right in your neighborhood
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-body-lg text-muted-foreground"
          >
            Connect with qualified, verified tutors for personalized learning.
            Search by subject, location, and schedule.
          </motion.p>

          {/* Search Bar - 3D entrance */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto mt-10 max-w-2xl"
            style={{ perspective: 1000 }}
          >
            <div className="flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-card sm:flex-row sm:items-center transition-shadow duration-300 hover:shadow-card-hover">
              <div className="relative flex-1">
                <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Subject (e.g. Mathematics)"
                  className="border-0 pl-10 shadow-none focus-visible:ring-0 h-11"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location (e.g. Delhi)"
                  className="border-0 pl-10 shadow-none focus-visible:ring-0 h-11"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button className="gap-2 rounded-xl px-6 h-11" onClick={handleSearch}>
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" className="gap-2 rounded-full px-8" asChild>
              <Link to="/find-tutors">
                Find Tutors <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <Link to="/signup">Become a Tutor</Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6"
          >
            {TRUST_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
