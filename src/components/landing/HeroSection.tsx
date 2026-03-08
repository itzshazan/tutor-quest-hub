import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, BookOpen } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="home" className="relative overflow-hidden py-20 md:py-32" style={{ background: "var(--hero-gradient)" }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Find Trusted Local Tutors{" "}
            <span className="text-primary">Near You</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Connect with qualified tutors for personalized, face-to-face learning in your neighborhood.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-3 shadow-lg sm:flex-row sm:items-center">
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
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2 px-8">
              <Search className="h-4 w-4" /> Find Tutors
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Become a Tutor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
