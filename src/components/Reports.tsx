import { useEffect, useState, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingDown, Calendar } from "lucide-react";

import { Agendamento, Paciente } from "@/database/schema";

import { findAllPacientesAction } from "@/actions/pacientes/actions";
import { findAllAgendamentos } from "@/actions/agendamentos/actions";
import { getMensagem } from "@/actions/configuracoes/actions";

import { getMonth, getYear, addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const Reports = () => 
{
  const [selectedYear, setSelectedYear] = useState("2025");

  const [patients, setPatients] = useState<Paciente[]>([]);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);

  useEffect(() => 
  {
    async function fetchData() 
    {
      const pacienteData = await findAllPacientesAction();
      setPatients(pacienteData);

      const data = await findAllAgendamentos();
      setAppointments(data);
    }

    fetchData();
  }, []);

  const attendanceData = useMemo(() => 
  {
    const now = new Date();
    const currentMonth = getMonth(now);
    const selected = parseInt(selectedYear, 10);
    const yearIsCurrent = selected === getYear(now);

    const maxMonth = yearIsCurrent ? currentMonth : 11;

    const monthlyStats = Array.from({ length: maxMonth + 1 }, (_, i) => ({
      month: format(addDays(new Date(selected, i, 1), 1), 'MMM', { locale: ptBR }),
      agendados: 0,
      realizados: 0,
      faltas: 0,
    }));

    appointments.forEach(agendamento => 
    {
      const data = new Date(agendamento.data);
      const month = getMonth(data);
      const year = getYear(data);

      if (year === selected && month <= maxMonth) 
      {
        monthlyStats[month].agendados += 1;

        if (agendamento.status === 'realizado')   monthlyStats[month].realizados += 1;
        else if (agendamento.status === 'faltou') monthlyStats[month].faltas += 1;
      }
    });

    return monthlyStats.map(m => ({ ...m, month: m.month.charAt(0).toUpperCase() + m.month.slice(1) }));
  }, [appointments, selectedYear]);

  const stats = useMemo(() => 
  {
    if (!attendanceData || attendanceData.length === 0) return { faltasMes: 0, taxaFaltas: 0 };

    const totalAgendados = attendanceData.reduce((sum, m) => sum + m.agendados, 0);
    const totalFaltas = attendanceData.reduce((sum, m) => sum + m.faltas, 0);

    const now = new Date();
    const mesAtual = format(now, 'MMM', { locale: ptBR }).charAt(0).toUpperCase() + format(now, 'MMM', { locale: ptBR }).slice(1);

    const mes = attendanceData.find(m => m.month === mesAtual);
    const faltasMes = mes?.faltas ?? 0;

    const taxaFaltas = totalAgendados > 0 ? (totalFaltas / totalAgendados) * 100 : 0;

    return { faltasMes, taxaFaltas: taxaFaltas.toFixed(1), };
  }, [attendanceData]);

  const retentionList = useMemo(() => 
  {
    return patients.map(patient => 
    {
      const consultas = appointments.filter(a => a.pacienteId === patient.id && a.status === 'realizado').map(a => new Date(a.data));
      const ultimaConsulta = consultas.length > 0 ? addDays(new Date(Math.max(...consultas.map(d => d.getTime()))), 1) : null;
      const diasSemConsulta = ultimaConsulta ? differenceInDays(new Date(), ultimaConsulta) : null;

      return {...patient, ultimaConsulta, diasSemConsulta,};
    })
    .filter(patient => patient.diasSemConsulta !== null && patient.diasSemConsulta > 90)
    .sort((a, b) => (b.diasSemConsulta ?? 0) - (a.diasSemConsulta ?? 0)); 
  }, [appointments, patients]);

  const exportReport = (reportType: string) => 
  {

  };

  const sendRetentionMessage = async (patient: Paciente) => 
  {
    const messageRaw = (await getMensagem('msg_inatividade')).valor;
    const message = messageRaw.replaceAll('{nome}', patient.nome);

    const whatsappUrl = `https://wa.me/55${patient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e Análises</h2>
          <p className="text-gray-600">Análise completa de desempenho da clínica</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="2030">2030</SelectItem>
              <SelectItem value="2029">2029</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="faltas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faltas">Faltas</TabsTrigger>
          <TabsTrigger value="inativos">Inativos</TabsTrigger>
        </TabsList>

        <TabsContent value="faltas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Relatório de Faltas</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Faltas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.taxaFaltas}%</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Faltas Este Mês</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.faltasMes}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Faltas vs Consultas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="realizados" fill="#10b981" name="Realizados" />
                  <Bar dataKey="faltas" fill="#ef4444" name="Faltas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inativos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pacientes Inativos</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                Pacientes sem Consulta há mais de 90 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {retentionList.map((patient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">{patient.nome}</p>
                      <p className="text-sm text-gray-600">
                        Última consulta: {patient.ultimaConsulta ? format(patient.ultimaConsulta, "dd 'de' MMMM yyyy", { locale: ptBR }) : "Nenhuma"}
                      </p>
                      <p className="text-xs text-orange-600">
                         {patient.diasSemConsulta != null ? `${patient.diasSemConsulta} dias sem consulta` : "Paciente sem histórico"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => sendRetentionMessage(patient)} >
                        Enviar Mensagem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
