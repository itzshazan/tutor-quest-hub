import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TutorProfile from "./pages/TutorProfile";
import FindTutors from "./pages/FindTutors";
import TutorSetup from "./pages/TutorSetup";
import Messages from "./pages/Messages";
import Sessions from "./pages/Sessions";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import TutorDashboard from "./pages/dashboard/TutorDashboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminReviews from "./pages/admin/AdminReviews";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/find-tutors" element={<FindTutors />} />
              <Route path="/tutor/setup" element={<TutorSetup />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/tutor/:id" element={<TutorProfile />} />
              <Route path="/dashboard/student" element={<StudentDashboard />} />
              <Route path="/dashboard/tutor" element={<TutorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tutors" element={<AdminTutors />} />
              <Route path="/admin/sessions" element={<AdminSessions />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
