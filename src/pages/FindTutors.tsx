import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Briefcase, Search, GraduationCap, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

interface TutorResult {
  user_id: string;
  subject: string;
  subjects: string[] | null;
  experience_years: number | null;
  hourly_rate: number | null;
  location: string | null;
  education: string | null;
  is_verified: boolean | null;
  rating: number | null;
  total_reviews: number | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

const ratingOptions = [
  { value: "0", label: "All Ratings" },
  { value: "4", label: "4+ Stars" },
  { value: "4.5", label: "4.5+ Stars" },
];

const budgetOptions = [
  { value: "0", label: "Any Budget" },
  { value: "500", label: "Under ₹500/hr" },
  { value: "800", label: "Under ₹800/hr" },
  { value: "1000", label: "Under ₹1000/hr" },
];

const FindTutors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tutors, setTutors] = useState<TutorResult[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state from URL params
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get("subject") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") || "0");
  const [budgetFilter, setBudgetFilter] = useState(searchParams.get("budget") || "0");

  // Fetch subjects list
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) setSubjects(data.map((s) => s.name));
    };
    fetchSubjects();
  }, []);

  // Fetch tutors with filters
  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);

      let query = supabase
        .from("tutor_profiles")
        .select("user_id, subject, subjects, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews, profiles!inner(full_name, avatar_url, bio)")
        .order("rating", { ascending: false, nullsFirst: false });

      if (subjectFilter) {
        query = query.or(`subject.ilike.%${subjectFilter}%,subjects.cs.{${subjectFilter}}`);
      }
      if (locationFilter) {
        query = query.ilike("location", `%${locationFilter}%`);
      }
      if (ratingFilter && ratingFilter !== "0") {
        query = query.gte("rating", parseFloat(ratingFilter));
      }
      if (budgetFilter && budgetFilter !== "0") {
        query = query.lte("hourly_rate", parseFloat(budgetFilter));
      }

      const { data, error } = await query;

      if (!error && data) {
        setTutors(data as unknown as TutorResult[]);
      }
      setLoading(false);
    };

    fetchTutors();
  }, [subjectFilter, locationFilter, ratingFilter, budgetFilter]);

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (subjectFilter) params.subject = subjectFilter;
    if (locationFilter) params.location = locationFilter;
    if (ratingFilter !== "0") params.rating = ratingFilter;
    if (budgetFilter !== "0") params.budget = budgetFilter;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSubjectFilter("");
    setLocationFilter("");
    setRatingFilter("0");
    setBudgetFilter("0");
    setSearchParams({});
  };

  const hasActiveFilters = subjectFilter || locationFilter || ratingFilter !== "0" || budgetFilter !== "0";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" />
            Tutor Quest
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>

      <div className="container py-8">
        {/* Search bar */}
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Find Tutors</h1>
            <p className="mt-2 text-muted-foreground">Search qualified tutors by subject, location, and more</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input
                placeholder="e.g. Delhi, Mumbai..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            {/* Mobile filter toggle */}
            <Button variant="outline" className="gap-2 sm:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>

            {/* Desktop extra filters */}
            <div className="hidden flex-1 space-y-1 sm:block">
              <label className="text-xs font-medium text-muted-foreground">Budget</label>
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden flex-1 space-y-1 sm:block">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Mobile filters */}
        {showFilters && (
          <div className="mb-6 flex gap-3 sm:hidden">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Budget</label>
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <ScrollReveal>
            <div className="py-20 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h2 className="mt-4 font-display text-xl font-semibold text-foreground">No tutors found</h2>
              <p className="mt-2 text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "No tutors have registered yet. Be the first!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </ScrollReveal>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {tutors.length} tutor{tutors.length !== 1 ? "s" : ""} found
            </p>
            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
              {tutors.map((t) => {
                const name = t.profiles?.full_name || "Unknown Tutor";
                const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <StaggerItem key={t.user_id}>
                    <Card className="transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold text-foreground">{name}</h3>
                              {t.is_verified && <Badge variant="secondary" className="shrink-0 bg-secondary text-secondary-foreground text-xs">Verified</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{t.subject}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {t.experience_years && t.experience_years > 0 && (
                            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {t.experience_years}y exp</span>
                          )}
                          {t.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.location}</span>
                          )}
                          {t.rating && t.rating > 0 && (
                            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating}</span>
                          )}
                        </div>

                        {t.hourly_rate && t.hourly_rate > 0 && (
                          <p className="mt-3 text-lg font-bold text-foreground">₹{t.hourly_rate}/hr</p>
                        )}

                        {t.profiles?.bio && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.profiles.bio}</p>
                        )}

                        <div className="mt-4 flex gap-3">
                          <Button size="sm" className="flex-1" asChild>
                            <Link to={`/tutor/${t.user_id}`}>View Profile</Link>
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">Contact</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default FindTutors;
