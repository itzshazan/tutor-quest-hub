import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [subject, setSubject] = useState("");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subjectsList, setSubjectsList] = useState<string[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) setSubjectsList(data.map((s) => s.name));
    };
    fetchSubjects();
  }, []);

  const togglePreferredSubject = (name: string) => {
    setPreferredSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim(),
          role,
          ...(role === "tutor" ? { subject: subject.trim() } : {}),
        },
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      // Save phone, preferred subjects and geolocation
      if (signUpData.user) {
        setTimeout(async () => {
          const updates: Record<string, any> = {};
          if (phone.trim()) updates.phone = phone.trim();
          if (role === "student" && preferredSubjects.length > 0) {
            updates.preferred_subjects = preferredSubjects;
          }
          if (Object.keys(updates).length > 0) {
            await supabase
              .from("profiles")
              .update(updates as any)
              .eq("user_id", signUpData.user!.id);
          }
          // Capture geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
              await supabase
                .from("profiles")
                .update({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                } as any)
                .eq("user_id", signUpData.user!.id);
            }, () => {});
          }
        }, 2000);
      }

      toast({ title: "Account created!", description: "Please check your email to confirm your account." });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex items-center gap-2 font-display text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" />
            Tutor Quest
          </Link>
          <CardTitle className="font-display text-2xl">Create your account</CardTitle>
          <CardDescription>Join as a student or tutor</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="flex rounded-lg border p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${role === "student" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${role === "tutor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setRole("tutor")}
              >
                Tutor
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {role === "tutor" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Primary Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsList.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === "student" && (
              <div className="space-y-2">
                <Label>Preferred Subjects (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {subjectsList.map((s) => {
                    const selected = preferredSubjects.includes(s);
                    return (
                      <Badge
                        key={s}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all ${
                          selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"
                        }`}
                        onClick={() => togglePreferredSubject(s)}
                      >
                        {s}
                        {selected && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : `Sign Up as ${role === "student" ? "Student" : "Tutor"}`}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;
