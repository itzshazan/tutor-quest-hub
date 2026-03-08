import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { RoleGuard } from "@/components/guards/RoleGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TutorProfile from "./pages/TutorProfile";
import FindTutors from "./pages/FindTutors";
import TutorSetup from "./pages/TutorSetup";
import Messages from "./pages/Messages";
import Sessions from "./pages/Sessions";
import PaymentHistory from "./pages/PaymentHistory";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import TutorDashboard from "./pages/dashboard/TutorDashboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminRevenue from "./pages/admin/AdminRevenue";

const queryClient = new QueryClient();

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/find-tutors" element={<FindTutors />} />
          <Route path="/tutor/:id" element={<TutorProfile />} />

          {/* Protected routes (any authenticated user) */}
          <Route path="/tutor/setup" element={
            <ProtectedRoute><TutorSetup /></ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute><Sessions /></ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute><PaymentHistory /></ProtectedRoute>
          } />

          {/* Role-specific routes */}
          <Route path="/dashboard/student" element={
            <RoleGuard allowedRole="student" redirectTo="/dashboard/tutor">
              <StudentDashboard />
            </RoleGuard>
          } />
          <Route path="/dashboard/tutor" element={
            <RoleGuard allowedRole="tutor" redirectTo="/dashboard/student">
              <TutorDashboard />
            </RoleGuard>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <RoleGuard allowedRole="admin"><AdminDashboard /></RoleGuard>
          } />
          <Route path="/admin/users" element={
            <RoleGuard allowedRole="admin"><AdminUsers /></RoleGuard>
          } />
          <Route path="/admin/tutors" element={
            <RoleGuard allowedRole="admin"><AdminTutors /></RoleGuard>
          } />
          <Route path="/admin/sessions" element={
            <RoleGuard allowedRole="admin"><AdminSessions /></RoleGuard>
          } />
          <Route path="/admin/reviews" element={
            <RoleGuard allowedRole="admin"><AdminReviews /></RoleGuard>
          } />
          <Route path="/admin/revenue" element={
            <RoleGuard allowedRole="admin"><AdminRevenue /></RoleGuard>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
