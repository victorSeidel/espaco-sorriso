import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Calendar, Clock, Plus, Search, Phone, MessageSquare, User, Check, CheckCircle, AlertCircle, X } from "lucide-react";

import { Agendamento, Paciente, Profissional, Transacao } from "@/database/schema";

import { findAllProfissionaisAction } from "@/actions/profissionais/actions";
import { findAllPacientesAction } from "@/actions/pacientes/actions";
import { criarAgendamento, findAgendamentoById, findAllAgendamentos, updateStatusAgendamento } from "@/actions/agendamentos/actions";
import { getMensagem } from "@/actions/configuracoes/actions";
import { createTransacaoAction } from "@/actions/transacoes/actions";

import { formatarDataComDateFns } from "@/lib/data";

interface ProfessionalAgendaProps { userRole: 'admin' | 'auxiliar' | null; }
interface Period { start: string; end: string; }

const ProfessionalAgenda = ({ userRole }: ProfessionalAgendaProps) => 
{
  const [professionals, setprofessionals] = useState<Profissional[]>([]);
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);

  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [serviceDescription, setServiceDescription] = useState("");
  const [valor, setValor] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const loadAppointments = async () => 
  {
    const data = await findAllAgendamentos();
    setAppointments(data);
  };

  async function fetchData() 
  {
    const profissionalData = await findAllProfissionaisAction();
    setprofessionals(profissionalData);

    const pacienteData = await findAllPacientesAction();
    setPatients(pacienteData);

    await loadAppointments();
  }

  useEffect(() => { fetchData(); }, []);

  const getStatusColor = (status: string) => 
  {
    switch (status) 
    {
      case 'confirmado': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      case 'realizado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'faltou': return 'bg-orange-100 text-orange-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sendMessage = async (appointment: Agendamento) => 
  {
    const patient = patients.find(p => p.id === Number(appointment.pacienteId));
    const professional = professionals.find(p => p.id === Number(appointment.profissionalId));
    
    if (patient && professional) 
    {
      const messageRaw = (await getMensagem('msg_agendamento')).valor;
      const message = messageRaw.replaceAll('{nome}', patient.nome).replaceAll('{profissional}', professional.nome).replaceAll('{servico}', appointment.servico)
        .replaceAll('{data}', formatarDataComDateFns(appointment.data)).replaceAll('{hora}', appointment.horario);

      try 
      {
        const msgResponse = await fetch('/api/enviar-mensagem', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: patient.telefone, message })
        });

        if (!msgResponse.ok) throw new Error('Erro ao enviar mensagem.');
      } 
      catch (error: any) 
      {
        alert('Erro ao enviar mensagem no WhatsApp. Envie manualmente.');

        const whatsappUrl = `https://wa.me/55${patient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  const sendMessageAll = async () =>
  {
    const agendamentosDia = appointments.filter(apt => apt.data === selectedDate);

    if (agendamentosDia.length === 0) { alert('Erro ao buscar agendamentos.'); return; }

    if(!confirm(`Deseja realmente enviar mensagens para ${agendamentosDia.length} pacientes com agendamentos em ${formatarDataComDateFns(selectedDate)}?`)) return;

    for (const appointment of agendamentosDia) await sendMessage(appointment);
  };

  const updateAppointmentStatus = async (id: number, newStatus: Agendamento['status']) => 
  {
    if (newStatus === 'realizado')
    {
      const agendamento = await findAgendamentoById(id);
      const transactionData = 
      {
        profissionalId: agendamento.profissionalId,
        descricao: `Consulta ${agendamento.id} - ${agendamento.servico}`,
        valor: agendamento.valor,
        tipo: 'entrada',
        metodoPagamento: agendamento.metodoPagamento,
      };

      const createdTransaction = await createTransacaoAction(transactionData);

      if (!createdTransaction) alert('Não foi possível gerar uma transação automática para essa consulta. Crie uma manualmente no painel financeiro.')
    }

    await updateStatusAgendamento(id, newStatus);
    await loadAppointments();
  };

  const getFilteredAppointments = () => 
  {
    let filtered = appointments.filter(apt => apt.data === selectedDate);
    
    if (selectedProfessional && selectedProfessional !== 'all') filtered = filtered.filter(apt => apt.profissionalId === Number(selectedProfessional));
    
    if (searchTerm) 
    {
      filtered = filtered.filter(apt => 
      {
        const patient = patients.find(p => p.id === Number(apt.pacienteId));
        return patient?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || apt.servico.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered.sort((a, b) => a.horario.localeCompare(b.horario));
  };

  const getProfessionalDaySchedule = (professionalId: string): Period[] => 
  {
    const professional = professionals.find(p => p.id === Number(professionalId));
    if (!professional || !professional.horarioTrabalho) return [];

    const textoHorario = professional.horarioTrabalho as string;

    const regex = /(\d{1,2})(h|H)?\s*(às|as|AS|ÀS|ÀS|às|ás|àS|Às|[-–])\s*(\d{1,2})(h|H)?/;

    const match = textoHorario.match(regex);
    if (!match) return [];

    const [, horaInicio, , , horaFim] = match;

    const pad = (v: number) => String(v).padStart(2, '0');

    return [{ start: `${pad(Number(horaInicio))}:00`, end: `${pad(Number(horaFim))}:00`,}];
  };

  const generateTimeSlots = (professionalId: string) => 
  {
    if (!professionalId) return [];
    
    const schedule = getProfessionalDaySchedule(professionalId);
    const slots: string[] = [];

    if (!Array.isArray(schedule)) return [];
    
    schedule.forEach((period: Period) => 
    {
      let current = period.start;
      while (current < period.end) 
      {
        slots.push(current);
        const [hours, minutes] = current.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + 30;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        current = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      }
    });
    
    return slots;
  };

  const filteredAppointments = getFilteredAppointments();

  const handleSubmit = async () => 
  {
    if (!selectedPatientId || !selectedTime || !serviceDescription || !valor || !selectedPaymentMethod || !selectedProfessional) 
    {
      alert("Preencha todos os campos antes de agendar.")
      return;
    }

    const body = 
    {
      profissionalId: Number(selectedProfessional),
      pacienteId: Number(selectedPatientId),
      data: selectedDate,
      horario: selectedTime,
      servico: serviceDescription,
      valor: Number(valor.replace(/[^\d.-]/g, '').replace(',', '.')).toFixed(2),
      metodoPagamento: selectedPaymentMethod,
      status: 'pendente'
    };

    try 
    {
      await criarAgendamento(body);

      alert('Agendamento realizado com sucesso!');

      setSearchTerm("");
      setSelectedPatientId(null);
      setSelectedTime(null);
      setServiceDescription("");
      setValor("");
      setSelectedPaymentMethod(null);
      setIsAddingAppointment(false);

      fetchData();
    } 
    catch 
    {
      alert('Erro ao criar agendamento. Tente novamente.')
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agenda dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate((e.target.value))}
              />
            </div>
            
            {(userRole === 'admin' || userRole === 'auxiliar') && (
              <div>
                <label className="text-sm font-medium mb-2 block">Profissional</label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map(prof => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.nome} - {prof.especialidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Paciente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Profissional</label>
                      <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o profissional" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="all">Selecione um profissional</SelectItem>
                          {professionals.map(prof => (
                            <SelectItem key={prof.id} value={prof.id.toString()}>
                              {prof.nome} - {prof.especialidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Paciente</label>
                      <div className="relative mb-2">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                          placeholder="Buscar por nome ou cpf..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedPatientId ?? ''} onValueChange={setSelectedPatientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {patients.filter(p => p.status === 'ativo'  && (p.nome.includes(searchTerm) || p.cpf.includes(searchTerm)))
                            .map(patient => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.nome} ({patient.dataNascimento})
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data</label>
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Horário</label>
                        <Select value={selectedTime ?? ''} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Horário" />
                          </SelectTrigger>
                          <SelectContent id="horario" className="bg-white z-50">
                            {generateTimeSlots(selectedProfessional).map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Serviço</label>
                      <Input id="service" type="text" placeholder="Tratamento de Canal" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Valor</label>
                      <Input id="valor" type="number" placeholder="R$ 1.500,00" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Método de Pagamento</label>
                      <Select value={selectedPaymentMethod ?? ''} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                        <SelectContent id="metodoPagamento" className="bg-white z-50">
                          <SelectItem value={'PIX'}>PIX</SelectItem>
                          <SelectItem value={'Boleto'}>Boleto</SelectItem>
                          <SelectItem value={'Cartão de Crédito'}>Cartão de Crédito</SelectItem>
                          <SelectItem value={'Cartão de Débito'}>Cartão de Débito</SelectItem>
                          <SelectItem value={'Dinheiro'}>Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsAddingAppointment(false)} variant="outline" className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} className="flex-1">
                        Agendar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Tabs */}
      <Tabs value={selectedProfessional === 'all' ? 'all' : selectedProfessional || professionals[0]?.nome} 
            onValueChange={setSelectedProfessional}>
        <TabsList className="flex">
          {(userRole === 'admin' || userRole === 'auxiliar') && (
            <TabsTrigger value="all" className="flex flex-1 items-center gap-2">
              <User className="w-4 h-4" />
              Todos
            </TabsTrigger>
          )}
          {professionals.map(prof => (
            <TabsTrigger key={prof.id} value={prof.id.toString()} className="flex flex-1 items-center gap-2">
              <User className="w-4 h-4" />
              {prof.nome}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Appointments List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>
                Agendamentos do Dia - {formatarDataComDateFns(selectedDate)}               
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum agendamento encontrado para este dia.
                  </p>
                ) : 
                (
                  <div>
                    <div className="flex flex-col gap-2 mb-4">
                      <Button className="bg-blue-500 w-full" onClick={() => sendMessageAll()} title="Enviar Mensagem">
                        <MessageSquare className="w-4 h-4" /> Enviar mensagem de confirmação para todos
                      </Button>
                      <p className="text-red-500 text-sm">Não é recomendável enviar muitas mensagens de forma automática.</p>
                    </div>
                  {filteredAppointments.map(appointment => {
                    const patient = patients.find(p => p.id === Number(appointment.pacienteId));
                    const professional = professionals.find(p => p.id === Number(appointment.profissionalId));
                    
                    return (
                      <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{appointment.horario}</span>
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-lg mt-1">{patient?.nome}</h3>
                            {professional && (userRole === 'admin' || userRole === 'auxiliar') && (
                              <p className="text-sm text-gray-600"><strong>Profissional:</strong> {professional.nome}</p>
                            )}
                            <p className="text-sm text-gray-600">{appointment.servico} {" - "}
                              <span className="text-sm text-green-600 font-medium">R$ {appointment.valor}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => sendMessage(appointment)} title="Enviar Mensagem">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => alert(`Telefone do Paciente: ${patient?.telefone}`)} title="Ver Telefone">
                              <Phone className="w-4 h-4" />
                            </Button>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'confirmado')} title="Confirmar"
                                  className={`bg-green-500 hover:bg-green-700 ${appointment.status === 'confirmado' ? 'hidden' : ''}`}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'realizado')} title="Realizado"
                                  className={`bg-blue-500 hover:bg-blue-700 ${appointment.status === 'realizado' ? 'hidden' : ''}`}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'faltou')} title="Faltou"
                                  className={`bg-orange-500 hover:bg-orange-700 ${appointment.status === 'faltou' ? 'hidden' : ''}`}>
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')} title="Cancelar"
                                  className={`bg-red-500 hover:bg-red-700 ${appointment.status === 'cancelado' ? 'hidden' : ''}`}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredAppointments.filter(a => a.status === 'confirmado').length}
                    </div>
                    <div className="text-sm text-green-600">Confirmados</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {filteredAppointments.filter(a => a.status === 'pendente').length}
                    </div>
                    <div className="text-sm text-yellow-600">Pendentes</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredAppointments.filter(a => a.status === 'realizado').length}
                    </div>
                    <div className="text-sm text-blue-600">Realizados</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredAppointments.filter(a => a.status === 'faltou' || a.status === 'cancelado').length}
                    </div>
                    <div className="text-sm text-red-600">Faltas ou Cancelamentos</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-lg font-medium">Receita Estimada</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {filteredAppointments
                      .filter(a => ['confirmado', 'realizado'].includes(a.status))
                      .reduce((sum, a) => sum + Number(a.valor), 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default ProfessionalAgenda;