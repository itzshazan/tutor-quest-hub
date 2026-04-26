import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, Camera, ArrowRight, ArrowLeft, Check, BookOpen,
  MapPin, Clock, Loader2, X, User, DollarSign, Pencil, Upload, FileText,
} from "lucide-react";
import { validateImageFile, validateDocumentFile } from "@/lib/validations";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  { label: "Morning (8–12)", start: "08:00", end: "12:00" },
  { label: "Afternoon (12–4)", start: "12:00", end: "16:00" },
  { label: "Evening (4–8)", start: "16:00", end: "20:00" },
];

const GRADE_LEVELS = [
  "Grade 1-5", "Grade 6-8", "Grade 9-10", "Grade 11-12",
  "Undergraduate", "Postgraduate", "Competitive Exams",
];

type DocCategory = "id_proof" | "bachelor_degree" | "masters_degree" | "phd_certificate" | "teaching_certificate" | "experience";

interface VerificationDoc {
  file: File;
  category: DocCategory;
}

interface FormData {
  avatarFile: File | null;
  avatarPreview: string;
  bio: string;
  education: string;
  experienceYears: number;
  subjects: string[];
  primarySubject: string;
  hourlyRate: number;
  location: string;
  gradeLevels: string[];
  teachingMethod: string;
  teachingRadius: number;
  availability: { day: string; start: string; end: string }[];
  verificationDocs: VerificationDoc[];
  existingDocs: { id: string; document_type: string; status: string }[];
}

const initialForm: FormData = {
  avatarFile: null,
  avatarPreview: "",
  bio: "",
  education: "",
  experienceYears: 0,
  subjects: [],
  primarySubject: "",
  hourlyRate: 0,
  location: "",
  gradeLevels: [],
  teachingMethod: "offline",
  teachingRadius: 10,
  availability: [],
  verificationDocs: [],
  existingDocs: [],
};

const TutorSetup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: subs } = await supabase.from("subjects").select("id, name").order("name");
      if (subs) setAllSubjects(subs);

      if (!user) return;
      const [{ data: profile }, { data: tutor }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tutor_profiles").select("*").eq("user_id", user.id).single(),
      ]);

      if (profile || tutor) {
        setForm((prev) => ({
          ...prev,
          avatarPreview: profile?.avatar_url || "",
          bio: profile?.bio || "",
          education: tutor?.education || "",
          experienceYears: tutor?.experience_years || 0,
          subjects: tutor?.subjects || [],
          primarySubject: tutor?.subject || "",
          hourlyRate: tutor?.hourly_rate || 0,
          location: tutor?.location || "",
          gradeLevels: (tutor as any)?.grade_levels || [],
          teachingMethod: (tutor as any)?.teaching_method || "offline",
          teachingRadius: (tutor as any)?.teaching_radius || 10,
        }));
      }

      const { data: avail } = await supabase
        .from("tutor_availability")
        .select("day_of_week, start_time, end_time")
        .eq("tutor_id", user.id);
      if (avail && avail.length > 0) {
        setForm((prev) => ({
          ...prev,
          availability: avail.map((a) => ({
            day: a.day_of_week,
            start: (a.start_time as string).slice(0, 5),
            end: (a.end_time as string).slice(0, 5),
          })),
        }));
      }

      // Load existing verification docs
      const { data: docs } = await supabase
        .from("tutor_verifications")
        .select("id, document_type, status")
        .eq("tutor_id", user.id);
      if (docs) {
        setForm((prev) => ({ ...prev, existingDocs: docs }));
      }
    };
    load();
  }, [user]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ title: "Invalid file", description: validation.error, variant: "destructive" });
      return;
    }
    
    update("avatarFile", file);
    update("avatarPreview", URL.createObjectURL(file));
  };

  const [docCategory, setDocCategory] = useState<DocCategory>("id_proof");

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validDocs: VerificationDoc[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      const validation = validateDocumentFile(file);
      if (validation.valid) {
        validDocs.push({ file, category: docCategory });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }
    
    if (errors.length > 0) {
      toast({ title: "Some files skipped", description: errors.join(", "), variant: "destructive" });
    }
    
    if (validDocs.length > 0) {
      update("verificationDocs", [...form.verificationDocs, ...validDocs]);
    }
  };

  const removeDoc = (index: number) => {
    update("verificationDocs", form.verificationDocs.filter((_, i) => i !== index));
  };

  const toggleSubject = (name: string) => {
    const next = form.subjects.includes(name)
      ? form.subjects.filter((s) => s !== name)
      : [...form.subjects, name];
    update("subjects", next);
    if (form.primarySubject === name) update("primarySubject", next[0] || "");
    else if (!next.includes(form.primarySubject)) update("primarySubject", next[0] || "");
  };

  const toggleGradeLevel = (level: string) => {
    const next = form.gradeLevels.includes(level)
      ? form.gradeLevels.filter((g) => g !== level)
      : [...form.gradeLevels, level];
    update("gradeLevels", next);
  };

  const toggleAvailability = (day: string, start: string, end: string) => {
    const exists = form.availability.find((a) => a.day === day && a.start === start);
    if (exists) {
      update("availability", form.availability.filter((a) => !(a.day === day && a.start === start)));
    } else {
      update("availability", [...form.availability, { day, start, end }]);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.bio.trim().length >= 10;
    if (step === 2) return form.subjects.length > 0 && form.hourlyRate > 0;
    if (step === 3) return form.location.trim().length > 0 && form.availability.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = form.avatarPreview;

      if (form.avatarFile) {
        const ext = form.avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, form.avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      // Upload verification documents
      for (const doc of form.verificationDocs) {
        const docPath = `${user.id}/${Date.now()}-${doc.file.name}`;
        const { error: docErr } = await supabase.storage
          .from("tutor-documents")
          .upload(docPath, doc.file);
        if (docErr) throw docErr;

        const categoryLabels: Record<string, string> = {
          id_proof: "ID Proof",
          bachelor_degree: "Bachelor's Degree",
          masters_degree: "Master's Degree",
          phd_certificate: "PhD Certificate",
          teaching_certificate: "Teaching Certificate",
          experience: "Experience Proof",
        };

        const { error: insertErr } = await supabase.from("tutor_verifications").insert({
          tutor_id: user.id,
          document_type: categoryLabels[doc.category] || doc.category,
          file_url: docPath,
        });
        if (insertErr) throw insertErr;
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .update({ bio: form.bio, avatar_url: avatarUrl || null })
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      // Sync avatar to auth user metadata so it shows in headers/nav
      if (avatarUrl) {
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
      }

      // Geocode the tutor's location using Nominatim (free)
      let geoLat: number | null = null;
      let geoLng: number | null = null;
      let geoCity: string | null = null;
      if (form.location) {
        try {
          const { data: geoData } = await supabase.functions.invoke('geocode-location', {
            body: { address: form.location },
          });
          if (geoData && geoData.lat) {
            geoLat = geoData.lat;
            geoLng = geoData.lng;
            geoCity = geoData.city || null;
          }
        } catch {
          // Geocoding failed silently — profile still saves without coords
        }
      }

      const { error: tutorErr } = await supabase
        .from("tutor_profiles")
        .update({
          education: form.education,
          experience_years: form.experienceYears,
          subjects: form.subjects,
          subject: form.primarySubject || form.subjects[0] || "",
          hourly_rate: form.hourlyRate,
          location: form.location,
          grade_levels: form.gradeLevels,
          teaching_method: form.teachingMethod,
          teaching_radius: form.teachingRadius,
          latitude: geoLat,
          longitude: geoLng,
          city: geoCity,
        } as any)
        .eq("user_id", user.id);
      if (tutorErr) throw tutorErr;

      await supabase.from("tutor_availability").delete().eq("tutor_id", user.id);
      if (form.availability.length > 0) {
        const { error: availErr } = await supabase.from("tutor_availability").insert(
          form.availability.map((a) => ({
            tutor_id: user.id,
            day_of_week: a.day,
            start_time: a.start,
            end_time: a.end,
          }))
        );
        if (availErr) throw availErr;
      }

      toast({ title: "Profile complete!", description: "Your tutor profile is now live." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = ["Basic Info", "Teaching", "Availability", "Review"];

  return (
    <DashboardLayout role="tutor">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-kalam text-2xl md:text-3xl font-bold text-hd-ink mb-1">Complete Your Profile</h1>
          <p className="text-hd-ink/70 font-medium text-sm">Set up your tutor profile to start teaching ✏️</p>
        </div>
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {stepTitles.map((t, i) => {
              const stepColors = ["bg-[#ff5a5a]", "bg-[#2d5da1]", "bg-[#90be6d]", "bg-[#ffd166]"];
              return (
              <button
                key={t}
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  i + 1 === step
                    ? "text-hd-ink"
                    : i + 1 < step
                    ? "text-[#90be6d] cursor-pointer"
                    : "text-hd-ink/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] transition-all ${
                    i + 1 < step
                      ? "bg-[#E5F6D3] text-[#4a7a2a]"
                      : i + 1 === step
                      ? `${stepColors[i]} text-white`
                      : "bg-white text-hd-ink/40"
                  }`}
                >
                  {i + 1 < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{t}</span>
              </button>
              );
            })}
          </div>
          <div className="h-2.5 rounded-full border-2 border-hd-ink bg-white shadow-[2px_2px_0px_0px_#2d2d2d] overflow-hidden">
            <div className="h-full bg-[#ff5a5a] rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Step 1: Basic Info */}
         {step === 1 && (
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
            <CardHeader className="border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl flex items-center gap-2 text-hd-ink">
                <div className="rounded-lg bg-[#ff5a5a]/20 p-1.5 border border-hd-ink"><User className="h-5 w-5 text-[#ff5a5a]" /></div> Basic Information
              </CardTitle>
              <p className="text-sm font-medium text-hd-ink/60">Tell students about yourself ✨</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
                    <AvatarImage src={form.avatarPreview} />
                    <AvatarFallback className="bg-[#ffd166] text-hd-ink font-bold text-xl">
                      {user?.user_metadata?.full_name?.[0] || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#ff5a5a] text-white border-2 border-hd-ink shadow-[1px_1px_0px_0px_#2d2d2d] hover:bg-[#e04848] transition-all"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">JPG or PNG, max 5 MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  placeholder="Share your teaching philosophy, experience, and what makes you a great tutor..."
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input id="education" placeholder="e.g. B.Sc. Mathematics" value={form.education} onChange={(e) => update("education", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" type="number" min={0} max={50} value={form.experienceYears || ""} onChange={(e) => update("experienceYears", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Verification Documents - Categorized */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Verification Documents
                </Label>
                <p className="text-xs text-muted-foreground">Upload documents for admin verification. Categorize each upload.</p>

                {form.existingDocs.length > 0 && (
                  <div className="space-y-1.5">
                    {form.existingDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm rounded-md border p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.document_type}</span>
                        <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"} className="text-xs ml-auto">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {form.verificationDocs.map((doc, i) => {
                  const categoryLabels: Record<string, string> = {
                    id_proof: "🪪 ID Proof",
                    bachelor_degree: "🎓 Bachelor's Degree",
                    masters_degree: "🎓 Master's Degree",
                    phd_certificate: "🎓 PhD Certificate",
                    teaching_certificate: "📜 Teaching Certificate",
                    experience: "💼 Experience",
                  };
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm rounded-md border p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs shrink-0">{categoryLabels[doc.category]}</Badge>
                      <span className="truncate flex-1">{doc.file.name}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeDoc(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}

                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Document Category</label>
                    <Select value={docCategory} onValueChange={(v: any) => setDocCategory(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id_proof">🪪 ID Proof (Aadhaar, PAN, Passport)</SelectItem>
                        <SelectItem value="bachelor_degree">🎓 Bachelor's Degree Certificate</SelectItem>
                        <SelectItem value="masters_degree">🎓 Master's Degree Certificate</SelectItem>
                        <SelectItem value="phd_certificate">🎓 PhD Certificate</SelectItem>
                        <SelectItem value="teaching_certificate">📜 Teaching Certificate (CTET, NET, etc.)</SelectItem>
                        <SelectItem value="experience">💼 Experience / Employment Proof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label htmlFor="doc-upload" className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                    <Upload className="h-4 w-4" /> Upload
                  </label>
                  <input id="doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" multiple onChange={handleDocUpload} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Teaching Info */}
         {step === 2 && (
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
            <CardHeader className="border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl flex items-center gap-2 text-hd-ink">
                <div className="rounded-lg bg-[#2d5da1]/15 p-1.5 border border-hd-ink"><BookOpen className="h-5 w-5 text-[#2d5da1]" /></div> Teaching Information
              </CardTitle>
              <p className="text-sm font-medium text-hd-ink/60">Select your subjects, grade levels, and set your rate 📚</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Subjects You Teach *</Label>
                <div className="flex flex-wrap gap-2">
                  {allSubjects.map((s) => {
                    const selected = form.subjects.includes(s.name);
                    return (
                      <Badge
                        key={s.id}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer transition-all border-2 border-hd-ink shadow-[1px_1px_0px_0px_#2d2d2d] rounded-lg ${
                          selected ? "bg-[#ff5a5a] text-white hover:bg-[#e04848]" : "bg-white text-hd-ink hover:bg-[#fff9c4]"
                        }`}
                        onClick={() => toggleSubject(s.name)}
                      >
                        {s.name}
                        {selected && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {form.subjects.length > 1 && (
                <div className="space-y-2">
                  <Label>Primary Subject</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.subjects.map((s) => (
                      <Badge
                        key={s}
                        variant={form.primarySubject === s ? "default" : "outline"}
                        className={`cursor-pointer ${form.primarySubject === s ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}
                        onClick={() => update("primarySubject", s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Levels */}
              <div className="space-y-2">
                <Label>Grade Levels You Teach</Label>
                <div className="flex flex-wrap gap-2">
                  {GRADE_LEVELS.map((level) => {
                    const selected = form.gradeLevels.includes(level);
                    return (
                      <Badge
                        key={level}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer transition-all border-2 border-hd-ink shadow-[1px_1px_0px_0px_#2d2d2d] rounded-lg ${
                          selected ? "bg-[#2d5da1] text-white hover:bg-[#24508c]" : "bg-white text-hd-ink hover:bg-[#fff9c4]"
                        }`}
                        onClick={() => toggleGradeLevel(level)}
                      >
                        {level}
                        {selected && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate (₹) *</Label>
                <div className="relative max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="rate" type="number" min={0} className="pl-9" placeholder="500" value={form.hourlyRate || ""} onChange={(e) => update("hourlyRate", parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location & Availability */}
         {step === 3 && (
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
            <CardHeader className="border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl flex items-center gap-2 text-hd-ink">
                <div className="rounded-lg bg-[#90be6d]/20 p-1.5 border border-hd-ink"><MapPin className="h-5 w-5 text-[#90be6d]" /></div> Location & Availability
              </CardTitle>
              <p className="text-sm font-medium text-hd-ink/60">Where and when can students reach you? 📍</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location">City / Area *</Label>
                <Input id="location" placeholder="e.g. Mumbai, Andheri West" value={form.location} onChange={(e) => update("location", e.target.value)} />
                <p className="text-xs text-muted-foreground">Your browser location will also be captured for distance-based search.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teaching Method</Label>
                  <Select value={form.teachingMethod} onValueChange={(v) => update("teachingMethod", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline (In-person)</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Teaching Radius (km)</Label>
                  <Input id="radius" type="number" min={1} max={50} placeholder="10" value={form.teachingRadius || ""} onChange={(e) => update("teachingRadius", parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">How far you're willing to travel (1–50 km)</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Weekly Availability *
                </Label>
                <div className="rounded-xl border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] overflow-hidden">
                  <div className="grid grid-cols-[1fr_repeat(3,1fr)] text-xs font-bold bg-[#fff9c4]">
                    <div className="p-2" />
                    {TIME_SLOTS.map((t) => (
                      <div key={t.label} className="p-2 text-center text-hd-ink/70">{t.label}</div>
                    ))}
                  </div>
                  {DAYS.map((day) => (
                    <div key={day} className="grid grid-cols-[1fr_repeat(3,1fr)] border-t-2 border-hd-ink/20">
                      <div className="p-2 text-sm font-bold text-hd-ink">{day}</div>
                      {TIME_SLOTS.map((slot) => {
                        const active = form.availability.some((a) => a.day === day && a.start === slot.start);
                        return (
                          <div key={slot.start} className="flex items-center justify-center p-2">
                            <Checkbox checked={active} onCheckedChange={() => toggleAvailability(day, slot.start, slot.end)} />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
         {step === 4 && (
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
            <CardHeader className="border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl flex items-center gap-2 text-hd-ink">
                <div className="rounded-lg bg-[#ffd166]/30 p-1.5 border border-hd-ink"><Check className="h-5 w-5 text-[#d4a017]" /></div> Review Your Profile
              </CardTitle>
              <p className="text-sm font-medium text-hd-ink/60">Make sure everything looks good before publishing 🎉</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <SummarySection title="Basic Info" onEdit={() => setStep(1)}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
                    <AvatarImage src={form.avatarPreview} />
                    <AvatarFallback className="bg-[#ffd166] text-hd-ink font-bold">{user?.user_metadata?.full_name?.[0] || "T"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.user_metadata?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{form.education || "No education listed"}</p>
                  </div>
                </div>
                <p className="text-sm mt-2">{form.bio}</p>
                <p className="text-xs text-muted-foreground">{form.experienceYears} years experience</p>
                {(form.verificationDocs.length > 0 || form.existingDocs.length > 0) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.existingDocs.length + form.verificationDocs.length} verification document(s) uploaded
                  </p>
                )}
              </SummarySection>

              <SummarySection title="Teaching" onEdit={() => setStep(2)}>
                <div className="flex flex-wrap gap-1.5">
                  {form.subjects.map((s) => (
                    <Badge key={s} variant={s === form.primarySubject ? "default" : "secondary"} className="text-xs">{s}</Badge>
                  ))}
                </div>
                {form.gradeLevels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.gradeLevels.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm mt-2">₹{form.hourlyRate}/hr</p>
              </SummarySection>

              <SummarySection title="Location & Availability" onEdit={() => setStep(3)}>
                <p className="text-sm flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {form.location} · {form.teachingRadius} km radius
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">Teaching method: {form.teachingMethod === "both" ? "Online & Offline" : form.teachingMethod}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.availability.map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{a.day.slice(0, 3)} {a.start}–{a.end}</Badge>
                  ))}
                </div>
              </SummarySection>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => step === 1 ? navigate(-1) : setStep((s) => s - 1)} className="border-2 border-hd-ink bg-white text-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold hover:bg-[#fff9c4] hover:-translate-y-0.5 transition-all">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:opacity-50">
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#90be6d] text-white hover:bg-[#7aae57] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              {saving ? "Saving..." : "Publish Profile"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const SummarySection = ({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border-2 border-hd-ink p-4 bg-[#fdfbf7] shadow-[2px_2px_0px_0px_#2d2d2d]">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-hd-ink">{title}</h3>
      <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 gap-1 text-xs font-bold text-[#ff5a5a] hover:bg-[#FFF0F1] rounded-lg">
        <Pencil className="h-3 w-3" /> Edit
      </Button>
    </div>
    {children}
  </div>
);

export default TutorSetup;
