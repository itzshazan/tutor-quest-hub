import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section id="home" className="relative overflow-hidden py-20 md:py-32" style={{ background: "var(--hero-gradient)" }}>
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl"
          >
            Find Trusted Local Tutors{" "}
            <span className="text-primary">Near You</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Connect with qualified tutors for personalized, face-to-face learning in your neighborhood.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-3 shadow-lg sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Subject (e.g. Mathematics)" className="border-0 pl-10 shadow-none focus-visible:ring-0" />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Location (e.g. Delhi)" className="border-0 pl-10 shadow-none focus-visible:ring-0" />
            </div>
            <Button className="gap-2 px-6">
              <Search className="h-4 w-4" />
              Find Tutors
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link to="/find-tutors"><Search className="h-4 w-4" /> Find Tutors</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <Link to="/signup">Become a Tutor</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
