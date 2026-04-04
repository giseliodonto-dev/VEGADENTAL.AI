import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import Equipe from "./pages/Equipe";
import Vendas from "./pages/Vendas";
import Gestao from "./pages/Gestao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
          <Route path="/equipe" element={<ProtectedRoute><Equipe /></ProtectedRoute>} />
          <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
          <Route path="/gestao" element={<ProtectedRoute><Gestao /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
