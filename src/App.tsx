import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
