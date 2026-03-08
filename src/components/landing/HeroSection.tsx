import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, BookOpen, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

const GRADE_LEVELS = [
  "Grade 1-5", "Grade 6-8", "Grade 9-10", "Grade 11-12",
  "Undergraduate", "Postgraduate", "Competitive Exams",
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [grade, setGrade] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (subject.trim()) params.set("subject", subject.trim());
    if (location.trim()) params.set("location", location.trim());
    if (grade) params.set("grade", grade);
    navigate(`/find-tutors?${params.toString()}`);
  };

  return (
    <section id="home" className="relative overflow-hidden py-20 md:py-28" style={{ background: "var(--hero-gradient)" }}>
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-muted/60 blur-3xl" />

      <div className="container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text + Search */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                Trusted by 10,000+ students
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
            >
              Find Trusted Local Tutors{" "}
              <span className="text-primary">Near You</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0 mx-auto"
            >
              Connect with qualified tutors for personalized, face-to-face learning in your neighborhood.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-elevated sm:flex-row sm:items-center sm:flex-wrap"
            >
              <div className="relative flex-1 min-w-[140px]">
                <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Subject (e.g. Mathematics)" className="border-0 pl-10 shadow-none focus-visible:ring-0" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="relative flex-1 min-w-[140px]">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Location (e.g. Delhi)" className="border-0 pl-10 shadow-none focus-visible:ring-0" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="border-0 shadow-none focus:ring-0">
                    <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Grade Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2 px-8" size="lg" onClick={handleSearch}>
                <Search className="h-4 w-4" />
                Find Tutors
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 flex flex-wrap gap-4 lg:justify-start justify-center"
            >
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link to="/find-tutors"><Search className="h-4 w-4" /> Find Tutors</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link to="/signup">Become a Tutor</Link>
              </Button>
            </motion.div>
          </div>

          {/* Right: 3D Illustration with floating effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden lg:flex items-center justify-center"
          >
            <motion.img
              src={heroIllustration}
              alt="Tutor teaching a student - 3D illustration"
              className="w-full max-w-md drop-shadow-2xl"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.05, rotate: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
