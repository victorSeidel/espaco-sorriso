import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Clock, AlertCircle, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { Agendamento, Paciente } from "@/database/schema";
import { Boleto } from "@/models/Boleto";

import { findAllAgendamentos, findLimitedAgendamentos } from "@/actions/agendamentos/actions";
import { findAllPacientesAction } from "@/actions/pacientes/actions";
import { getMensagem } from "@/actions/configuracoes/actions";

import { formatarDataComDateFns } from "@/lib/data";

const Dashboard = () => 
{
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Agendamento[]>([]);
  const [nextAppointments, setNextAppointments] = useState<Agendamento[]>([]);

  const [boletos, setBoletos] = useState<Boleto[]>([]);

  const [metaValorTotal, setMetaValorTotal] = useState<number>(0);
  const [metaPacientes, setMetaPacientes] = useState<number>(0);
  const [metaConsultas, setMetaConsultas] = useState<number>(0);

    async function fetchData() 
    {
        const appointmentData = await findAllAgendamentos();
        setAppointments(appointmentData);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; 
        const todayAppointmentsData = appointmentData.filter(appt => appt.data === todayStr).sort((a, b) => a.horario.localeCompare(b.horario));
        setTodayAppointments(todayAppointmentsData);

        const nextAppointmentData = await findLimitedAgendamentos(3);
        setNextAppointments(nextAppointmentData);

        const pacienteData = await findAllPacientesAction();
        setPatients(pacienteData);

        const boletosResponse = await fetch('/api/pegar-boletos', { method: 'GET', headers: {'Content-Type': 'application/json',} });
        if (!boletosResponse.ok) throw new Error('Erro ao buscar boletos.');
        const boletosData: Boleto[] = (await boletosResponse.json()).data;
        const boletosFormatados = boletosData.filter(b => b.billingType === 'BOLETO').map(b => ({ dueDate: b.dueDate } as Boleto));
        setBoletos(boletosFormatados);

        const metaValor = await getMensagem("meta_valortotal");
        const metaPac = await getMensagem("meta_pacientes");
        const metaCons = await getMensagem("meta_consultas");
        setMetaValorTotal(Number(metaValor.valor) || 0);
        setMetaPacientes(Number(metaPac.valor) || 0);
        setMetaConsultas(Number(metaCons.valor) || 0);
    }

  useEffect(() => { fetchData(); }, []);

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStartOfWeek = (date: Date) => 
  {
    const day = date.getDay() + 1;
    const diff = date.getDate() - day;
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDailyRevenue = () => 
  {
    const hoje = new Date();
    const inicioSemana = getStartOfWeek(new Date(hoje));
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const dias: { day: string, value: number }[] = [];

    for (let i = 0; i < 7; i++) 
    {
      const diaAtual = new Date(inicioSemana);
      diaAtual.setDate(diaAtual.getDate() + i);
      diaAtual.setHours(0, 0, 0, 0);

      const receitaDoDia = appointments.filter(a => 
      {
        const dataAgendamento = new Date(a.data);
        dataAgendamento.setHours(0, 0, 0, 0);
        return ( a.status === 'realizado' && dataAgendamento.toDateString() === diaAtual.toDateString() );
      })
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

      dias.push({ day: diasDaSemana[i], value: receitaDoDia });
    }

    return dias;
  };

  const dailyRevenue = useMemo(() => getDailyRevenue(), [appointments]);

  const appointmentStatus = 
  [
    { name: 'Confirmados', value: appointments.filter(p => p.status === 'confirmado').length, color: '#10b981' },
    { name: 'Pendentes',   value: appointments.filter(p => p.status === 'pendente').length,   color: '#f59e0b' },
    { name: 'Cancelados',  value: appointments.filter(p => p.status === 'cancelado').length,  color: '#ef4444' },
  ];

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const receitaTotal = appointments.filter(a => 
    {
        if (a.status !== 'realizado') return false;
        const dataAgendamento = new Date(a.data);
        return ( dataAgendamento.getMonth() === mesAtual && dataAgendamento.getFullYear() === anoAtual );
    }).reduce((sum, a) => sum + Number(a.valor), 0);

    const pacientesAtivos = patients.filter(p => 
    {
        if (p.status !== 'ativo') return false;
        const dataCadastro = new Date(p.createdAt);
        return ( dataCadastro.getMonth() === mesAtual && dataCadastro.getFullYear() === anoAtual );
    }).length;

    const consultasRealizadas = appointments.filter(a => 
    {
        if (a.status !== 'realizado') return false;
        const dataAgendamento = new Date(a.data);
        return dataAgendamento.getMonth() === mesAtual && dataAgendamento.getFullYear() === anoAtual;
    }).length;

    const progressoReceita = metaValorTotal ? Math.min((receitaTotal / metaValorTotal) * 100, 100) : 0;
    const progressoPacientes = metaPacientes ? Math.min((pacientesAtivos / metaPacientes) * 100, 100) : 0;
    const progressoConsultas = metaConsultas ? Math.min((consultasRealizadas / metaConsultas) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.filter(a => !['cancelado', 'faltou'].includes(a.status)).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {todayAppointments.filter(a => ['realizado'].includes(a.status)).reduce((sum, a) => sum + Number(a.valor), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Novos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.filter(p => p.status === 'ativo').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Metas da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div>
                <p className="font-medium">Receita Total</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progressoReceita}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1"> R$ {receitaTotal.toFixed(2)} de R$ {metaValorTotal.toFixed(2)} ({progressoReceita.toFixed(1)}%)</p>
            </div>
            <div>
                <p className="font-medium">Pacientes Novos</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progressoPacientes}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1"> {pacientesAtivos} de {metaPacientes} ({progressoPacientes.toFixed(1)}%) </p>
            </div>
            <div>
                <p className="font-medium">Consultas</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progressoConsultas}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1"> {consultasRealizadas} de {metaConsultas} ({progressoConsultas.toFixed(1)}%) </p>
            </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {appointmentStatus.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e lembretes */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Próximos Agendamentos <span className="text-sm text-gray-500">confirmados ou pendentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum agendamento encontrado.</p>) 
              : 
              (
              nextAppointments.filter(a => ['pendente', 'confirmado'].includes(a.status)).map((appointment) => {
                const backgroundColor =
                  appointment.status === 'confirmado' ? 'bg-green-100' : appointment.status === 'pendente' ? 'bg-yellow-100' : 'bg-gray-100';

                return (
                  <div key={appointment.id}
                    className={`flex justify-between items-center p-2 rounded ${backgroundColor}`}>
                    <div>
                      <p className="font-medium">{patients.find(p => p.id === appointment.pacienteId)?.nome || 'Carregando...'}</p>
                      <p className="text-sm text-gray-600">{appointment.servico}</p>
                    </div>
                    <span className="text-base font-medium">{formatarDataComDateFns(appointment.data)} - {appointment.horario}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800">Boletos Vencidos</p>
              <p className="text-xs text-red-600">{boletos.filter(b => new Date(b.dueDate) > new Date()).length} boletos pendentes</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800">Confirmações Pendentes</p>
              <p className="text-xs text-yellow-600">{todayAppointments.filter(a => a.status === 'pendente').length} agendamentos não confirmados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
