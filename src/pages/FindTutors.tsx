import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Heart,
  List,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Navigation,
  Search,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedTutors } from "@/hooks/useSavedTutors";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { SEO } from "@/components/SEO";
import { useUserLocation } from "@/hooks/useUserLocation";

const TutorMapView = lazy(() => import("@/components/TutorMapView"));

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
  "Grade 1-5",
  "Grade 6-8",
  "Grade 9-10",
  "Grade 11-12",
  "Undergraduate",
  "Postgraduate",
  "Competitive Exams",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FindTutors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { savedIds, toggle: toggleSave } = useSavedTutors(user?.id);

  const [tutors, setTutors] = useState<TutorResult[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [subjectFilter, setSubjectFilter] = useState(searchParams.get("subject") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") || "0");
  const [budgetFilter, setBudgetFilter] = useState(searchParams.get("budget") || "0");
  const [gradeFilter, setGradeFilter] = useState(searchParams.get("grade") || "");
  const [dayFilter, setDayFilter] = useState(searchParams.get("day") || "");
  const [radiusFilter, setRadiusFilter] = useState(searchParams.get("radius") || "0");

  // --- GPS location hook ---
  const gpsApplied = useRef(false);
  const {
    coords: gpsCoords,
    loading: gpsLoading,
    error: gpsError,
    detect: detectGPS,
    clear: clearGPS,
  } = useUserLocation();

  // When GPS coords become available, apply them once
  useEffect(() => {
    if (gpsCoords && !gpsApplied.current) {
      gpsApplied.current = true;
      setSearchCoords(gpsCoords);
      setLocationFilter("\ud83d\udccd My Location");
      setRadiusFilter((prev) => (prev === "0" ? "5" : prev));
    }
  }, [gpsCoords]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) {
        setSubjects(data.map((s) => s.name));
      }
    };

    fetchSubjects();
  }, []);

  const debouncedLocation = useDebounce(locationFilter, 400);

  useEffect(() => {
    if (!debouncedLocation) {
      // Only clear coords if GPS isn't providing them
      if (!gpsCoords) setSearchCoords(null);
      return;
    }

    // Skip geocoding when location was set by GPS auto-detect
    if (gpsCoords && debouncedLocation === "\ud83d\udccd My Location") {
      return;
    }

    const geocode = async () => {
      setGeocoding(true);
      try {
        const { data } = await supabase.functions.invoke("geocode-location", {
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
  }, [debouncedLocation, gpsCoords]);

  const detectLocation = () => {
    gpsApplied.current = false;
    detectGPS();
  };

  const clearLocationFilter = () => {
    clearGPS();
    gpsApplied.current = false;
    setSearchCoords(null);
    setLocationFilter("");
    setRadiusFilter("0");
  };

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);

      let query = supabase
        .from("tutor_profiles")
        .select(
          "user_id, subject, subjects, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews, grade_levels, teaching_method, teaching_radius, trust_score, latitude, longitude, city, profiles!inner(full_name, avatar_url, bio)",
        )
        .order("trust_score", { ascending: false, nullsFirst: false });

      let availableTutorIds: string[] | null = null;
      if (dayFilter) {
        const { data: availData } = await supabase
          .from("tutor_availability")
          .select("tutor_id")
          .eq("day_of_week", dayFilter);
        availableTutorIds = availData ? [...new Set(availData.map((a) => a.tutor_id))] : [];
      }

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

        if (availableTutorIds !== null) {
          results = results.filter((t) => availableTutorIds!.includes(t.user_id));
        }

        if (debouncedLocation && !searchCoords) {
          const locLower = debouncedLocation.toLowerCase();
          results = results.filter(
            (t) => (t.location && t.location.toLowerCase().includes(locLower)) || (t.city && t.city.toLowerCase().includes(locLower)),
          );
        }

        const radiusKm = parseFloat(radiusFilter);
        if (searchCoords) {
          results = results.map((t) => {
            if (t.latitude && t.longitude) {
              return {
                ...t,
                distance: haversineDistance(searchCoords.lat, searchCoords.lng, t.latitude, t.longitude),
              };
            }
            return { ...t, distance: undefined };
          });

          if (radiusKm > 0) {
            results = results.filter((t) => t.distance !== undefined && t.distance <= radiusKm);
          }

          results.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              if (Math.abs(a.distance - b.distance) > 0.5) {
                return a.distance - b.distance;
              }
            }
            if (a.distance !== undefined && b.distance === undefined) {
              return -1;
            }
            if (a.distance === undefined && b.distance !== undefined) {
              return 1;
            }

            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            if (ratingA !== ratingB) {
              return ratingB - ratingA;
            }

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
    if (subjectFilter) {
      params.subject = subjectFilter;
    }
    if (locationFilter) {
      params.location = locationFilter;
    }
    if (ratingFilter !== "0") {
      params.rating = ratingFilter;
    }
    if (budgetFilter !== "0") {
      params.budget = budgetFilter;
    }
    if (gradeFilter) {
      params.grade = gradeFilter;
    }
    if (dayFilter) {
      params.day = dayFilter;
    }
    if (radiusFilter !== "0") {
      params.radius = radiusFilter;
    }

    setSearchParams(params);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSubjectFilter("");
    setLocationFilter("");
    setRatingFilter("0");
    setBudgetFilter("0");
    setGradeFilter("");
    setDayFilter("");
    setRadiusFilter("0");
    clearGPS();
    gpsApplied.current = false;
    setSearchCoords(null);
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters =
    subjectFilter || locationFilter || ratingFilter !== "0" || budgetFilter !== "0" || gradeFilter || dayFilter || radiusFilter !== "0";

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const totalPages = Math.ceil(tutors.length / ITEMS_PER_PAGE);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#F6F1E9] p-1 sm:p-2 [font-family:'Poppins',Inter,sans-serif]">
      <SEO
        title="Find Tutors"
        description="Search qualified tutors by subject, location, grade level, and more. Connect with verified local tutors for personalized learning."
        url="/find-tutors"
      />

      <div className="relative mx-auto flex h-full max-w-[1420px] flex-col overflow-hidden rounded-[16px] border-[2px] border-[#1E1E1E] bg-[#F6F1E9]">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(30, 30, 30, 0.08) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="pointer-events-none absolute right-3 top-20 z-30 scale-75 animate-[float_5s_ease-in-out_infinite] sm:right-6 sm:top-20 sm:scale-90 lg:right-10 lg:top-24 lg:scale-100">
          <svg width="210" height="110" viewBox="0 0 210 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 74C31 83 53 67 72 69C97 71 118 43 143 45C160 47 170 35 181 24"
              stroke="#1E1E1E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 8"
            />
            <path d="M178 25L204 15L189 43L178 25Z" fill="#FFFFFF" stroke="#1E1E1E" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="pointer-events-none absolute left-2 top-56 z-30 scale-90 sm:left-3 sm:top-60 md:left-4 md:top-64 md:scale-100">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4L12 1Z" stroke="#1E1E1E" strokeWidth="2" />
          </svg>
        </div>
        <div className="pointer-events-none absolute right-5 top-56 z-30 h-4 w-4 rounded-full border-2 border-[#1E1E1E] bg-[#F9D7C1] sm:h-5 sm:w-5" />
        <div className="pointer-events-none absolute right-5 top-[17.5rem] z-30">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 23C15 17 24 18 28 24C31 28 28 34 21 34" stroke="#1E1E1E" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 6" />
            <path d="M18 8C24 10 27 16 24 21C22 25 18 25 15 22" stroke="#1E1E1E" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="pointer-events-none absolute right-8 bottom-[8.5rem] z-30 h-7 w-7 rounded-full border-2 border-[#1E1E1E] bg-[#A6D98D] sm:right-10 sm:h-8 sm:w-8" />
        <div className="pointer-events-none absolute right-8 bottom-[15rem] z-30 h-4 w-4 rounded-full border-2 border-[#1E1E1E] bg-[#FFE89A]" />
        <div className="pointer-events-none absolute right-14 bottom-[15.5rem] z-30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="#1E1E1E" strokeWidth="1.8" />
          </svg>
        </div>
        <div className="pointer-events-none absolute left-8 bottom-[14.5rem] z-30">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4L12 1Z" stroke="#1E1E1E" strokeWidth="2" />
          </svg>
        </div>
        <img
          src="/signup-books.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-5 left-3 z-30 w-[74px] select-none sm:w-[88px] md:w-[102px] lg:w-[110px]"
        />

        <header className="relative z-20 flex items-center justify-between px-3 py-3 md:px-6 md:py-3.5">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png?v=3" alt="Tutor Quest Logo" className="h-[48px] w-[48px] object-contain drop-shadow-[2px_2px_0px_rgba(30,30,30,0.2)]" />
            <span className="text-[24px] font-semibold leading-none text-[#1E1E1E] [font-family:'Fredoka','Baloo_2','Poppins',sans-serif] sm:text-[30px]">
              Tutor Quest
            </span>
          </Link>

          <div className="flex items-center gap-3 md:gap-4">
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white px-3 py-2 text-[14px] font-semibold text-[#4B5563] shadow-[2px_2px_0px_#1E1E1E] transition hover:bg-[#FFFDF8] hover:text-[#1E1E1E] md:flex"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              Back to Home
            </Link>

            {user ? (
              <>
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="max-w-[180px] truncate text-[16px] font-semibold text-[#1E1E1E]">{displayName}</span>
                  <Avatar className="h-10 w-10 border-2 border-[#1E1E1E] bg-white">
                    <AvatarImage src={user?.user_metadata?.avatar_url || undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-[#FFE89A] text-[16px] font-semibold text-[#1E1E1E]">{displayInitial}</AvatarFallback>
                  </Avatar>
                </div>

                <Button
                  variant="outline"
                  onClick={() => supabase.auth.signOut()}
                  className="h-10 rounded-[12px] border-[2px] border-[#1E1E1E] bg-white px-3 text-[14px] font-semibold text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#FFF7F7] hover:text-[#1E1E1E]"
                >
                  <LogOut className="mr-2 h-4 w-4" strokeWidth={2.2} />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  asChild
                  className="h-10 rounded-[12px] px-4 text-[14px] font-semibold text-[#1E1E1E] transition hover:bg-[#FFFDF8]"
                >
                  <Link to="/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-[12px] border-[2px] border-[#1E1E1E] bg-[#FFD166] px-4 text-[14px] font-semibold text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#FFC033]"
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="relative z-10 border-b-[2px] border-dashed border-[#1E1E1E]" />

        <main className="relative z-20 flex-1 overflow-y-auto px-4 pb-4 pt-4 md:px-6 md:pt-5 lg:px-8">
          <section className="mb-4">
            <h1 className="text-[34px] font-semibold leading-none text-[#1E1E1E] [font-family:'Fredoka','Baloo_2','Poppins',sans-serif] sm:text-[42px]">
              Find Tutors
            </h1>
            <p className="mt-1.5 text-[15px] font-medium text-[#6B7280] sm:text-[16px]">
              Search qualified tutors by subject, location, grade level, and more
            </p>
          </section>

          <section className="mb-4 rounded-[18px] border-[2.5px] border-[#1E1E1E] bg-white px-3 py-3.5 shadow-[3px_4px_0px_#1E1E1E] md:px-4 md:py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Subject</label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer rounded-md text-[14px]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Location</label>
                <div className="relative">
                  <Input
                    placeholder="e.g. South Delhi, Mumbai"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white pr-10 text-[14px] font-medium text-[#1E1E1E] placeholder:text-[#9CA3AF] shadow-[2px_2px_0px_#1E1E1E] focus-visible:border-[#FF5A5F] focus-visible:ring-0"
                  />
                  {geocoding && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF5A5F] border-t-transparent" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Distance</label>
                <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {radiusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-md text-[14px]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Grade Level</label>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade} className="cursor-pointer rounded-md text-[14px]">
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Budget</label>
                <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {budgetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-md text-[14px]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Rating</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-md text-[14px]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">Availability</label>
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger className="h-10 rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[14px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] focus:border-[#FF5A5F] focus:ring-0">
                    <SelectValue placeholder="Any Day" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E]">
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day} className="cursor-pointer rounded-md text-[14px]">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSearch}
                className="h-10 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white px-6 text-[16px] font-semibold text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#FFFDF8] hover:text-[#1E1E1E]"
              >
                <Search className="mr-2 h-4 w-4" strokeWidth={2.2} />
                Search
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={detectLocation}
                aria-label="Use my location"
                className="h-10 w-10 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[3px_4px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#FFFDF8] hover:text-[#1E1E1E]"
              >
                <Navigation className="h-4 w-4" strokeWidth={2.2} />
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-9 rounded-[10px] px-3 text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#FFF0F1] hover:text-[#FF5A5F]"
                >
                  Clear
                </Button>
              )}
            </div>
          </section>

          {/* Near Me indicator pill */}
          {searchCoords && radiusFilter !== "0" && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border-2 border-[#1E1E1E] bg-[#E5F6D3] px-3 py-1 text-sm font-semibold text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E]">
                <LocateFixed className="h-3.5 w-3.5 text-green-600" strokeWidth={2.5} />
                Showing tutors within {radiusFilter} km of you
              </span>
              <button
                onClick={clearLocationFilter}
                className="rounded-full border-2 border-[#1E1E1E] bg-white px-3 py-1 text-xs font-semibold text-[#6B7280] shadow-[2px_2px_0px_#1E1E1E] transition hover:bg-[#FFF0F1] hover:text-[#FF5A5F]"
              >
                Clear location
              </button>
            </div>
          )}

          {/* GPS loading indicator */}
          {gpsLoading && (
            <div className="mb-3 flex items-center gap-2 rounded-full border-2 border-[#1E1E1E] bg-white px-3 py-1.5 text-sm font-medium text-[#6B7280] shadow-[2px_2px_0px_#1E1E1E] w-fit">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#FF5A5F] border-t-transparent" />
              Detecting your location…
            </div>
          )}

          {/* GPS error message */}
          {gpsError && !gpsCoords && (
            <div className="mb-3 rounded-[12px] border-2 border-[#1E1E1E] bg-[#FFF0F1] px-4 py-2 text-sm font-medium text-[#FF5A5F] shadow-[2px_2px_0px_#1E1E1E]">
              {gpsError}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-[220px] rounded-[18px] border-2 border-[#1E1E1E]/20 bg-white" />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className="rounded-[18px] border-[2.5px] border-[#1E1E1E] bg-white px-5 py-10 text-center shadow-[3px_4px_0px_#1E1E1E]">
              <Search className="mx-auto h-10 w-10 text-[#9CA3AF]" strokeWidth={2} />
              <h2 className="mt-3 text-[28px] font-semibold text-[#1E1E1E] [font-family:'Fredoka','Baloo_2','Poppins',sans-serif]">
                No tutors found
              </h2>
              <p className="mt-1.5 text-[15px] text-[#6B7280]">
                {hasActiveFilters
                  ? "Try adjusting your filters or increasing the distance radius."
                  : "No tutors have registered yet. Be the first!"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[16px] font-semibold text-[#6B7280] sm:text-[18px]">
                  {tutors.length} tutor{tutors.length !== 1 ? "s" : ""} found
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("list")}
                    className={`h-9 rounded-[10px] border-[2px] border-[#1E1E1E] px-3 text-[13px] font-semibold transition-all ${
                      viewMode === "list"
                        ? "bg-white text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E]"
                        : "bg-[#F6F1E9] text-[#6B7280] hover:bg-white"
                    }`}
                  >
                    <List className="mr-2 h-4 w-4" strokeWidth={2.2} />
                    List
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("map")}
                    className={`h-9 rounded-[10px] border-[2px] border-[#1E1E1E] px-3 text-[13px] font-semibold transition-all ${
                      viewMode === "map"
                        ? "bg-white text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E]"
                        : "bg-[#F6F1E9] text-[#6B7280] hover:bg-white"
                    }`}
                  >
                    <Map className="mr-2 h-4 w-4" strokeWidth={2.2} />
                    Map
                  </Button>
                </div>
              </div>

              {viewMode === "map" ? (
                <Suspense fallback={<Skeleton className="h-[360px] w-full rounded-[18px] border-[2.5px] border-[#1E1E1E] bg-white" />}>
                  <div className="overflow-hidden rounded-[18px] border-[2.5px] border-[#1E1E1E] bg-white shadow-[3px_4px_0px_#1E1E1E]">
                    <TutorMapView tutors={tutors} searchCoords={searchCoords} />
                  </div>
                </Suspense>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tutors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((tutor, index) => {
                      const name = tutor.profiles?.full_name || "Unknown Tutor";
                      const avatarLetter = name.charAt(0).toUpperCase();
                      const ratingValue = tutor.rating && tutor.rating > 0 ? tutor.rating : 0;
                      const cardTiltClass = index % 2 === 0 ? "rotate-[-0.2deg]" : "rotate-[0.2deg]";

                      return (
                        <article
                          key={tutor.user_id}
                          className={`flex h-full flex-col rounded-[18px] border-[2.5px] border-[#1E1E1E] bg-white p-4 shadow-[3px_4px_0px_#1E1E1E] transition-all duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_6px_0px_#1E1E1E] ${cardTiltClass}`}
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <Avatar className="h-12 w-12 border-[2px] border-[#1E1E1E] bg-white">
                              <AvatarImage src={tutor.profiles?.avatar_url || undefined} alt={name} className="object-cover" />
                              <AvatarFallback className="bg-[#E5EED7] text-[24px] font-semibold leading-none text-[#8A633A]">
                                {avatarLetter}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[28px] font-semibold leading-none text-[#1E1E1E] [font-family:'Fredoka','Baloo_2','Poppins',sans-serif] sm:text-[30px]">
                                {name}
                              </h3>
                              <p className="mt-0.5 text-[15px] font-medium text-[#4B5563]">{tutor.subject}</p>
                            </div>
                          </div>

                          <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-[#6B7280]">
                            {tutor.experience_years && tutor.experience_years > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" strokeWidth={2.2} />
                                {tutor.experience_years}y exp
                              </span>
                            )}
                            {(tutor.location || tutor.city) && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" strokeWidth={2.2} />
                                {tutor.location || tutor.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Star
                                className={`h-4 w-4 ${ratingValue > 0 ? "fill-[#F4B740] text-[#F4B740]" : "text-[#9CA3AF]"}`}
                                strokeWidth={2.2}
                              />
                              {ratingValue > 0 ? ratingValue.toFixed(1) : "0"}
                            </span>
                            {tutor.distance !== undefined && (
                              <span className="flex items-center gap-1.5 text-[#FF5A5F]">
                                <Navigation className="h-4 w-4" strokeWidth={2.2} />
                                {tutor.distance < 1 ? `${Math.round(tutor.distance * 1000)}m` : `${tutor.distance.toFixed(1)} km`}
                              </span>
                            )}
                          </div>

                          {tutor.grade_levels && tutor.grade_levels.length > 0 && (
                            <div className="mb-2">
                              <Badge className="rounded-[8px] border-2 border-[#1E1E1E] bg-[#FFF5D9] px-2.5 py-0.5 text-[12px] font-semibold text-[#1E1E1E]">
                                {tutor.grade_levels[0]}
                              </Badge>
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-[28px] font-semibold leading-none text-[#1E1E1E]">
                              {tutor.hourly_rate && tutor.hourly_rate > 0 ? `₹${tutor.hourly_rate}` : "Rate on request"}
                              {tutor.hourly_rate && tutor.hourly_rate > 0 && (
                                <span className="ml-1 text-[15px] font-medium text-[#6B7280]">/hr</span>
                              )}
                            </p>
                            <p className="mt-1.5 line-clamp-1 text-[14px] text-[#4B5563]">{tutor.profiles?.bio || ""}</p>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-10 flex-1 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white text-[15px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#FFFDF8] hover:text-[#1E1E1E]"
                              asChild
                            >
                              <Link to={`/tutor/${tutor.user_id}`}>View Profile</Link>
                            </Button>

                            <Button
                              size="sm"
                              className="h-10 flex-1 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white text-[15px] font-medium text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#FFFDF8] hover:text-[#1E1E1E]"
                              asChild
                            >
                              <Link to={`/messages?tutor=${tutor.user_id}`}>Contact</Link>
                            </Button>

                            {user && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleSave(tutor.user_id)}
                                title={savedIds.has(tutor.user_id) ? "Unsave tutor" : "Save tutor"}
                                className="h-10 w-10 rounded-full border border-transparent transition-all duration-150 hover:scale-110 hover:bg-[#FFEDEE]"
                              >
                                <Heart
                                  className={`h-5 w-5 transition-transform duration-150 ${
                                    savedIds.has(tutor.user_id)
                                      ? "fill-[#FF5A5F] text-[#FF5A5F]"
                                      : "text-[#1E1E1E] hover:scale-110"
                                  }`}
                                  strokeWidth={savedIds.has(tutor.user_id) ? 0 : 2.2}
                                />
                              </Button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className="h-9 w-9 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber: number;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        const isActive = pageNumber === currentPage;
                        return (
                          <Button
                            key={pageNumber}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`h-9 w-9 rounded-[10px] border-[2px] border-[#1E1E1E] text-[13px] font-semibold transition-all ${
                              isActive
                                ? "bg-[#1E1E1E] text-white"
                                : "bg-white text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] hover:-translate-y-0.5"
                            }`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        className="h-9 w-9 rounded-[10px] border-[2px] border-[#1E1E1E] bg-white text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FindTutors;