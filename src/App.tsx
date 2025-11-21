import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedProjectRoute from "@/components/ProtectedProjectRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NewProject from "./pages/NewProject";
import Project from "./pages/Project";
import NewTask from "./pages/NewTask";
import AcceptInvite from "./pages/AcceptInvite";
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
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route 
              path="/projects/:projectId" 
              element={
                <ProtectedProjectRoute>
                  <Project />
                </ProtectedProjectRoute>
              } 
            />
            <Route 
              path="/projects/:projectId/tasks/new" 
              element={
                <ProtectedProjectRoute>
                  <NewTask />
                </ProtectedProjectRoute>
              } 
            />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/i/:token" element={<AcceptInvite />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
