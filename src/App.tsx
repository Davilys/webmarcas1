import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Registro from "./pages/Registro";
import Obrigado from "./pages/Obrigado";
import NotFound from "./pages/NotFound";

// Cliente pages
import ClienteLogin from "./pages/cliente/Login";
import ClienteDashboard from "./pages/cliente/Dashboard";
import ClienteProcessos from "./pages/cliente/Processos";
import ClienteDocumentos from "./pages/cliente/Documentos";
import ClienteFinanceiro from "./pages/cliente/Financeiro";
import ClienteSuporte from "./pages/cliente/Suporte";
import ClienteConfiguracoes from "./pages/cliente/Configuracoes";

// Initialize query client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/obrigado" element={<Obrigado />} />
              
              {/* Área do Cliente */}
              <Route path="/cliente/login" element={<ClienteLogin />} />
              <Route path="/cliente/dashboard" element={<ClienteDashboard />} />
              <Route path="/cliente/processos" element={<ClienteProcessos />} />
              <Route path="/cliente/documentos" element={<ClienteDocumentos />} />
              <Route path="/cliente/financeiro" element={<ClienteFinanceiro />} />
              <Route path="/cliente/suporte" element={<ClienteSuporte />} />
              <Route path="/cliente/configuracoes" element={<ClienteConfiguracoes />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
