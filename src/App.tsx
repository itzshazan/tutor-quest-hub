import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SkipToContent } from "@/components/SkipToContent";

// Eager-loaded (critical path)
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TutorProfile = lazy(() => import("./pages/TutorProfile"));
const FindTutors = lazy(() => import("./pages/FindTutors"));
const TutorSetup = lazy(() => import("./pages/TutorSetup"));
const Messages = lazy(() => import("./pages/Messages"));
const Sessions = lazy(() => import("./pages/Sessions"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const Settings = lazy(() => import("./pages/Settings"));
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const TutorDashboard = lazy(() => import("./pages/dashboard/TutorDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTutors = lazy(() => import("./pages/admin/AdminTutors"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TutorEarnings = lazy(() => import("./pages/TutorEarnings"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/find-tutors" element={<FindTutors />} />
            <Route path="/tutor/:id" element={<TutorProfile />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

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
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/earnings" element={
              <ProtectedRoute><TutorEarnings /></ProtectedRoute>
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
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SkipToContent />
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <main id="main-content">
                <AnimatedRoutes />
              </main>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
