import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Pacientes from "./pages/Pacientes.tsx";
import Agenda from "./pages/Agenda.tsx";
import Financeiro from "./pages/Financeiro.tsx";
import Equipe from "./pages/Equipe.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import CalculadoraSobrevivencia from "./pages/CalculadoraSobrevivencia.tsx";
import IAVendasNEPQ from "./pages/IAVendasNEPQ.tsx";
import BancoRoteiros from "./pages/BancoRoteiros.tsx";
import RadarLucro from "./pages/RadarLucro.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/vega/calculadora" element={<CalculadoraSobrevivencia />} />
          <Route path="/vega/ia-vendas" element={<IAVendasNEPQ />} />
          <Route path="/vega/roteiros" element={<BancoRoteiros />} />
          <Route path="/vega/radar" element={<RadarLucro />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
