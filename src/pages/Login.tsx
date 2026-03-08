import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    if (error) {
      toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification email sent!", description: "Please check your inbox." });
      setShowResendOption(false);
    }
    setResendLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      // Check if error is due to unverified email
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setShowResendOption(true);
      }
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      setShowResendOption(false);
      // Check if tutor needs to complete profile
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser?.user_metadata?.role === "tutor") {
        const { data: tp } = await supabase
          .from("tutor_profiles")
          .select("hourly_rate")
          .eq("user_id", loggedUser.id)
          .single();
        // Redirect if profile is incomplete
        if (!tp?.hourly_rate || tp.hourly_rate === 0) {
          toast({ title: "Welcome! Let's complete your profile." });
          navigate("/tutor/setup");
          setLoading(false);
          return;
        }
      }
      toast({ title: "Welcome back!" });
      const role = loggedUser?.user_metadata?.role;
      navigate(role === "tutor" ? "/dashboard/tutor" : "/dashboard/student");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex items-center gap-2 font-display text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" />
            Tutor Quest
          </Link>
          <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
                }
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
            </p>
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
              Forgot your password?
            </Link>
            
            {showResendOption && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                disabled={resendLoading}
                onClick={handleResendVerification}
              >
                <Mail className="h-4 w-4" />
                {resendLoading ? "Sending..." : "Resend verification email"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
