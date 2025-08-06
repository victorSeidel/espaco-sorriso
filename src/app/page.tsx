'use client'
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, TrendingUp, Settings, CheckCircle, AlertCircle } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import ProfessionalAgenda from "@/components/ProfessionalAgenda";
import FinancePanel from "@/components/FinancePanel";
import Odontograma from "@/components/Odontograma";
import PatientManagement from "@/components/PatientManagement";
import Reports from "@/components/Reports";
import SettingsPage from "@/components/SettingsPage";
import LoginModal from "@/components/LoginModal";
import { findAuxiliarById } from "@/actions/auxiliares/actions";

const Index = () => 
{
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'auxiliar' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [displayName, setDisplayName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCashRegisterLocked, setIsCashRegisterLocked] = useState(false);

  useEffect(() => 
  {
    const fetchDisplayName = async () => 
    {
      if (!userRole) return;

      if (userRole === 'admin') 
      {
        setDisplayName('Dr. Lucas Lopes Lima');
      } 
      else if (userRole === 'auxiliar') 
      {
        const auxiliar = await findAuxiliarById(currentUserId);
        setDisplayName(auxiliar?.nome ?? '');
      }
    };

    fetchDisplayName();
  }, [userRole, currentUserId]);

  const handleLogin = (role: 'admin' | 'auxiliar', userId?: number) =>
  {
    setIsLoggedIn(true);
    setUserRole(role);
    if (!userId || userId <= 0) return;
    setCurrentUserId(userId);
    
    const today = new Date().toISOString().split('T')[0];
    const lastCashClose = localStorage.getItem('lastCashClose');
    
    if (role === 'auxiliar' && lastCashClose !== today) setIsCashRegisterLocked(true);
  };

  const handleLogout = () => 
  {
    if (userRole === 'auxiliar' && !isCashRegisterLocked) 
    {
      alert('Você deve fechar o caixa antes de sair do sistema!');
      return;
    }
    
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentUserId(0);
    setActiveTab("dashboard");
  };

  const hasAccessToTab = (tab: string) => {
    switch (userRole) {
      case 'admin':
        return true; // Admin has access to everything
      case 'auxiliar':
        return ['dashboard', 'agenda', 'financeiro', 'pacientes'].includes(tab);
      default:
        return false;
    }
  };

  if (!isLoggedIn) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ES</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Espaço Sorriso</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isCashRegisterLocked && userRole === 'auxiliar' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Caixa Fechado
                </span>
              )}
              <span className="text-sm text-gray-600">
                {displayName}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            {hasAccessToTab('dashboard') && (
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
            )}
            {hasAccessToTab('agenda') && (
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agenda
              </TabsTrigger>
            )}
            {hasAccessToTab('financeiro') && (
              <TabsTrigger value="financeiro" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financeiro
              </TabsTrigger>
            )}
            {hasAccessToTab('odontograma') && (
              <TabsTrigger value="odontograma" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Odontograma
              </TabsTrigger>
            )}
            {hasAccessToTab('pacientes') && (
              <TabsTrigger value="pacientes" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pacientes
              </TabsTrigger>
            )}
            {hasAccessToTab('relatorios') && (
              <TabsTrigger value="relatorios" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Relatórios
              </TabsTrigger>
            )}
            {userRole === 'admin' && (
              <TabsTrigger value="configuracoes" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            )}
          </TabsList>

          {hasAccessToTab('dashboard') && (
            <TabsContent value="dashboard">
              <Dashboard  />
            </TabsContent>
          )}

          {hasAccessToTab('agenda') && (
            <TabsContent value="agenda">
              <ProfessionalAgenda userRole={userRole}  />
            </TabsContent>
          )}

          {hasAccessToTab('financeiro') && (
            <TabsContent value="financeiro">
              <FinancePanel 
                userRole={userRole}
              />
            </TabsContent>
          )}

          {hasAccessToTab('odontograma') && (
            <TabsContent value="odontograma">
              <Odontograma />
            </TabsContent>
          )}

          {hasAccessToTab('pacientes') && (
            <TabsContent value="pacientes">
              <PatientManagement />
            </TabsContent>
          )}

          {hasAccessToTab('relatorios') && (
            <TabsContent value="relatorios">
              <Reports/>
            </TabsContent>
          )}

          {userRole === 'admin' && (
            <TabsContent value="configuracoes">
              <SettingsPage />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;