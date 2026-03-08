import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Star, MapPin, Briefcase, Search, GraduationCap, ArrowLeft, SlidersHorizontal, X, Navigation, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { VerificationBadges } from "@/components/VerificationBadges";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedTutors } from "@/hooks/useSavedTutors";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";
import { useDebounce } from "@/hooks/useDebounce";
import { SEO } from "@/components/SEO";

const ITEMS_PER_PAGE = 12;

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
  grade_levels: string[] | null;
  teaching_method: string | null;
  teaching_radius: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  distance?: number;
  available_days?: string[];
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

const radiusOptions = [
  { value: "0", label: "Any Distance" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "20", label: "Within 20 km" },
  { value: "50", label: "Within 50 km" },
];

const GRADE_LEVELS = [
  "Grade 1-5", "Grade 6-8", "Grade 9-10", "Grade 11-12",
  "Undergraduate", "Postgraduate", "Competitive Exams",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FindTutors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { savedIds, toggle: toggleSave } = useSavedTutors(user?.id);
  const [tutors, setTutors] = useState<TutorResult[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [subjectFilter, setSubjectFilter] = useState(searchParams.get("subject") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") || "0");
  const [budgetFilter, setBudgetFilter] = useState(searchParams.get("budget") || "0");
  const [gradeFilter, setGradeFilter] = useState(searchParams.get("grade") || "");
  const [dayFilter, setDayFilter] = useState(searchParams.get("day") || "");
  const [radiusFilter, setRadiusFilter] = useState(searchParams.get("radius") || "0");

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) setSubjects(data.map((s) => s.name));
    };
    fetchSubjects();
  }, []);

  // Geocode location input
  const debouncedLocation = useDebounce(locationFilter, 400);

  useEffect(() => {
    if (!debouncedLocation) {
      setSearchCoords(null);
      return;
    }
    const geocode = async () => {
      setGeocoding(true);
      try {
        const { data } = await supabase.functions.invoke('geocode-location', {
          body: { address: debouncedLocation },
        });
        if (data && data.lat) {
          setSearchCoords({ lat: data.lat, lng: data.lng });
        } else {
          setSearchCoords(null);
        }
      } catch {
        setSearchCoords(null);
      }
      setGeocoding(false);
    };
    geocode();
  }, [debouncedLocation]);

  // Detect user's GPS location
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSearchCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationFilter("My Location");
          if (radiusFilter === "0") setRadiusFilter("20");
        },
        () => {}
      );
    }
  };

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);

      // Build OR conditions for a single combined .or() call to avoid PostgREST conflicts
      let query = supabase
        .from("tutor_profiles")
        .select("user_id, subject, subjects, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews, grade_levels, teaching_method, teaching_radius, trust_score, latitude, longitude, city, profiles!inner(full_name, avatar_url, bio)")
        .order("trust_score", { ascending: false, nullsFirst: false });

      // If day filter is set, get tutor IDs that are available on that day
      let availableTutorIds: string[] | null = null;
      if (dayFilter) {
        const { data: availData } = await supabase
          .from("tutor_availability")
          .select("tutor_id")
          .eq("day_of_week", dayFilter);
        availableTutorIds = availData ? [...new Set(availData.map((a) => a.tutor_id))] : [];
      }

      // Subject filter — use .or() for subject matching
      if (subjectFilter) {
        query = query.or(`subject.ilike.%${subjectFilter}%,subjects.cs.{${subjectFilter}}`);
      }
      if (ratingFilter && ratingFilter !== "0") {
        query = query.gte("rating", parseFloat(ratingFilter));
      }
      if (budgetFilter && budgetFilter !== "0") {
        query = query.lte("hourly_rate", parseFloat(budgetFilter));
      }
      if (gradeFilter) {
        query = query.contains("grade_levels", [gradeFilter]);
      }

      const { data, error } = await query;

      if (!error && data) {
        let results = data as unknown as TutorResult[];

        // Filter by availability day
        if (availableTutorIds !== null) {
          results = results.filter((t) => availableTutorIds!.includes(t.user_id));
        }

        // Client-side text-based location filter when no geocoded coordinates
        if (debouncedLocation && !searchCoords) {
          const locLower = debouncedLocation.toLowerCase();
          results = results.filter((t) =>
            (t.location && t.location.toLowerCase().includes(locLower)) ||
            (t.city && t.city.toLowerCase().includes(locLower))
          );
        }

        // Calculate distances & filter by radius when we have search coordinates
        const radiusKm = parseFloat(radiusFilter);
        if (searchCoords) {
          results = results.map((t) => {
            if (t.latitude && t.longitude) {
              return { ...t, distance: haversineDistance(searchCoords.lat, searchCoords.lng, t.latitude, t.longitude) };
            }
            return { ...t, distance: undefined };
          });

          // Apply radius filter
          if (radiusKm > 0) {
            results = results.filter((t) => t.distance !== undefined && t.distance <= radiusKm);
          }

          // Sort by distance first, then rating, then experience
          results.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              if (Math.abs(a.distance - b.distance) > 0.5) return a.distance - b.distance;
            }
            if (a.distance !== undefined && b.distance === undefined) return -1;
            if (a.distance === undefined && b.distance !== undefined) return 1;
            // Secondary: rating
            const ra = a.rating || 0;
            const rb = b.rating || 0;
            if (ra !== rb) return rb - ra;
            // Tertiary: experience
            return (b.experience_years || 0) - (a.experience_years || 0);
          });
        }

        setTutors(results);
      }
      setLoading(false);
    };

    fetchTutors();
  }, [subjectFilter, debouncedLocation, ratingFilter, budgetFilter, gradeFilter, dayFilter, searchCoords, radiusFilter]);

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (subjectFilter) params.subject = subjectFilter;
    if (locationFilter) params.location = locationFilter;
    if (ratingFilter !== "0") params.rating = ratingFilter;
    if (budgetFilter !== "0") params.budget = budgetFilter;
    if (gradeFilter) params.grade = gradeFilter;
    if (dayFilter) params.day = dayFilter;
    if (radiusFilter !== "0") params.radius = radiusFilter;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSubjectFilter("");
    setLocationFilter("");
    setRatingFilter("0");
    setBudgetFilter("0");
    setGradeFilter("");
    setDayFilter("");
    setRadiusFilter("0");
    setSearchCoords(null);
    setSearchParams({});
  };

  const hasActiveFilters = subjectFilter || locationFilter || ratingFilter !== "0" || budgetFilter !== "0" || gradeFilter || dayFilter || radiusFilter !== "0";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Find Tutors"
        description="Search qualified tutors by subject, location, grade level, and more. Connect with verified local tutors for personalized learning."
        url="/find-tutors"
      />
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
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Find Tutors</h1>
            <p className="mt-2 text-muted-foreground">Search qualified tutors by subject, location, grade level, and more</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:flex-wrap">
            <div className="flex-1 min-w-[150px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <div className="relative">
                <Input
                  placeholder="e.g. South Delhi, Mumbai..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              {searchCoords && locationFilter && locationFilter !== "My Location" && (
                <p className="text-xs text-primary">📍 Location found — showing nearby tutors</p>
              )}
            </div>

            <div className="flex-1 min-w-[130px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Distance</label>
              <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Grade Level</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile filters sheet */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 sm:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> More Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget</label>
                    <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {budgetOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ratingOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Availability</label>
                    <Select value={dayFilter} onValueChange={setDayFilter}>
                      <SelectTrigger><SelectValue placeholder="Any Day" /></SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distance</label>
                    <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {radiusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" onClick={() => { handleSearch(); setMobileFiltersOpen(false); }}>
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden flex-1 min-w-[130px] space-y-1 sm:block">
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

            <div className="hidden flex-1 min-w-[130px] space-y-1 sm:block">
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

            <div className="hidden flex-1 min-w-[130px] space-y-1 sm:block">
              <label className="text-xs font-medium text-muted-foreground">Availability</label>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger><SelectValue placeholder="Any Day" /></SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
              <Button variant="outline" size="icon" onClick={detectLocation} aria-label="Use my GPS location">
                <Navigation className="h-4 w-4" />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Clear filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {searchCoords && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4 text-primary" />
            <span>
              {radiusFilter !== "0"
                ? `Showing tutors within ${radiusFilter} km${locationFilter === "My Location" ? " of your location" : ` of "${locationFilter}"`}`
                : `Sorted by distance${locationFilter === "My Location" ? " from your location" : ` from "${locationFilter}"`}`}
            </span>
          </div>
        )}

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
                {hasActiveFilters ? "Try adjusting your filters or increasing the distance radius." : "No tutors have registered yet. Be the first!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          </ScrollReveal>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {tutors.length} tutor{tutors.length !== 1 ? "s" : ""} found
              {tutors.length > ITEMS_PER_PAGE && ` · Page ${currentPage} of ${Math.ceil(tutors.length / ITEMS_PER_PAGE)}`}
            </p>
            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
              {tutors
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((t) => {
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
                              <VerificationBadges
                                isVerified={t.is_verified}
                                education={t.education}
                                rating={t.rating}
                                totalReviews={t.total_reviews}
                                compact
                              />
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
                          {t.distance !== undefined && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Navigation className="h-3.5 w-3.5" /> {t.distance < 1 ? `${Math.round(t.distance * 1000)}m` : `${t.distance.toFixed(1)} km`}
                            </span>
                          )}
                        </div>

                        {t.grade_levels && t.grade_levels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.grade_levels.slice(0, 3).map((g) => (
                              <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                            ))}
                            {t.grade_levels.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{t.grade_levels.length - 3}</Badge>
                            )}
                          </div>
                        )}

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
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <Link to={`/messages?tutor=${t.user_id}`}>Contact</Link>
                          </Button>
                          {user && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0 px-2"
                              onClick={() => toggleSave(t.user_id)}
                              title={savedIds.has(t.user_id) ? "Unsave tutor" : "Save tutor"}
                            >
                              <Heart className={`h-4 w-4 ${savedIds.has(t.user_id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            {/* Pagination */}
            {tutors.length > ITEMS_PER_PAGE && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, Math.ceil(tutors.length / ITEMS_PER_PAGE)) }, (_, i) => {
                  const totalPages = Math.ceil(tutors.length / ITEMS_PER_PAGE);
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil(tutors.length / ITEMS_PER_PAGE)}
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(tutors.length / ITEMS_PER_PAGE), p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FindTutors;
