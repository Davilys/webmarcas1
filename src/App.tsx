import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Registro from "./pages/Registro";
import StatusPedido from "./pages/StatusPedido";
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

// Admin pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClientes from "./pages/admin/Clientes";
import AdminProcessos from "./pages/admin/Processos";
import AdminDocumentos from "./pages/admin/Documentos";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminNotificacoes from "./pages/admin/Notificacoes";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminRecursosINPI from "./pages/admin/RecursosINPI";
import AdminRevistaINPI from "./pages/admin/RevistaINPI";

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
              <Route path="/status-pedido" element={<StatusPedido />} />
              <Route path="/obrigado" element={<Obrigado />} />
              
              {/* Área do Cliente */}
              <Route path="/cliente/login" element={<ClienteLogin />} />
              <Route path="/cliente/dashboard" element={<ClienteDashboard />} />
              <Route path="/cliente/processos" element={<ClienteProcessos />} />
              <Route path="/cliente/documentos" element={<ClienteDocumentos />} />
              <Route path="/cliente/financeiro" element={<ClienteFinanceiro />} />
              <Route path="/cliente/suporte" element={<ClienteSuporte />} />
              <Route path="/cliente/configuracoes" element={<ClienteConfiguracoes />} />
              
              {/* Painel Administrativo */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clientes" element={<AdminClientes />} />
              <Route path="/admin/processos" element={<AdminProcessos />} />
              <Route path="/admin/documentos" element={<AdminDocumentos />} />
              <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
              <Route path="/admin/notificacoes" element={<AdminNotificacoes />} />
              <Route path="/admin/recursos-inpi" element={<AdminRecursosINPI />} />
              <Route path="/admin/revista-inpi" element={<AdminRevistaINPI />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
              
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
