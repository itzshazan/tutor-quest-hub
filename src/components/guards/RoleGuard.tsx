import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: "student" | "tutor" | "admin";
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRole, redirectTo = "/" }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setChecking(false);
        return;
      }

      if (allowedRole === "admin") {
        // Server-side check for admin role
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        setHasAccess(!!data);
      } else {
        // Check user_metadata for student/tutor
        const userRole = user.user_metadata?.role;
        setHasAccess(userRole === allowedRole);
      }
      setChecking(false);
    }

    if (!loading) {
      checkRole();
    }
  }, [user, loading, allowedRole]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
