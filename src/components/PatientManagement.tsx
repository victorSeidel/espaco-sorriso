import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Mail, Heart, Save, Edit } from "lucide-react";

import { Agendamento, Paciente } from "@/database/schema";

import { findAllPacientesAction, updatePacienteAction } from "@/actions/pacientes/actions";
import { findAllAgendamentos } from "@/actions/agendamentos/actions";
import { formatarDataComDateFns } from "@/lib/data";
import { getMensagem } from "@/actions/configuracoes/actions";

const PatientManagement = () => 
{
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [editingPatient, setEditingPatient] = useState<Paciente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [visiblePatients, setVisiblePatients] = useState(4); 
  const [appointments, setAppointments] = useState<Agendamento[]>([]);

  const loadAppointments = async () => 
  {
    const data = await findAllAgendamentos();
    setAppointments(data);
  };

  async function fetchData() 
  {
    const data = await findAllPacientesAction();
    setPatients(data);
    await loadAppointments();
  }

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { if (selectedPatient) setEditingPatient({...selectedPatient}); }, [selectedPatient]);

  const filteredPatients = patients.filter(patient =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm) ||
    patient.telefone.includes(searchTerm) ||
    patient.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientsToShow = filteredPatients.slice(0, visiblePatients);

  const handleLoadMore = () => { setVisiblePatients(prev => prev + 10); };

  const calculateAge = (birthDate: string) => 
  {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

    return age;
  };

  const handleSubmit = async (e: any) => 
  {
    e.preventDefault();
    
    const pacienteData = 
    {
      nome: (document.getElementById('nome') as HTMLInputElement).value || '',
      cpf: (document.getElementById('cpf') as HTMLInputElement).value || '',
      telefone: (document.getElementById('telefone') as HTMLInputElement).value || '',
      email: (document.getElementById('email') as HTMLInputElement).value || '',
      dataNascimento: (document.getElementById('dataNascimento') as HTMLInputElement).value || null,
      cep: (document.getElementById('cep') as HTMLInputElement).value || '',
      endereco: (document.getElementById('endereco') as HTMLInputElement).value || '',
      status: 'ativo',
    };
    
    try 
    {
      const response = await fetch('/api/cadastrar-paciente', 
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(pacienteData),
      });

      if (!response.ok) throw new Error('Erro ao cadastrar paciente');

      await response.json();
      alert('Paciente cadastrado com sucesso!');
      setIsAddingPatient(false);

      fetchData();
    } 
    catch (error) 
    {
      alert('Erro ao cadastrar paciente. Tente novamente.');
    }
  };

  const handleUpdatePatient = async () => 
  {
    if (!editingPatient) return;
    
    try 
    {
      const updatedPatient = await updatePacienteAction(editingPatient.id, editingPatient);

      if (!updatedPatient) return;

      alert('Paciente atualizado com sucesso!');
      
      setSelectedPatient(updatedPatient);
      setIsEditing(false);

      fetchData();
    } 
    catch (error) 
    {
      alert('Erro ao atualizar paciente. Tente novamente.');
    }
  };

  const handleFieldChange = (field: keyof Paciente, value: string) => {
    if (!editingPatient) return;
    setEditingPatient({
      ...editingPatient,
      [field]: value
    });
  };

  const sendPosMessage = async (agendamento: Agendamento) => 
  {
    const patient = patients.find(p => p.id === agendamento.pacienteId);
    
    if (patient) 
    {
      const messageRaw = (await getMensagem('msg_pos')).valor;
      const message = messageRaw.replaceAll('{nome}', patient.nome).replaceAll('{servico}', agendamento.servico);

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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Pacientes</h2>
          <p className="text-gray-600">Cadastro completo com CPF, endereço e histórico</p>
        </div>
        <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome Completo</label>
                <Input id="nome" placeholder="Nome do paciente" />
              </div>
              <div>
                <label className="text-sm font-medium">CPF</label>
                <Input id="cpf" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input id="telefone" placeholder="(11) 99999-9999" maxLength={11} />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <Input id="email" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Data de Nascimento</label>
                <Input id="dataNascimento" type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">CEP</label>
                <Input id="cep" placeholder="00000-000" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Endereço</label>
                <Input id="endereco" placeholder="Rua João, 123 - Bairro Jardim" />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button className="flex-1" onClick={handleSubmit}>Cadastrar</Button>
                <Button variant="outline" onClick={() => setIsAddingPatient(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome, CPF, telefone ou status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pacientes</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacientes Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.status === 'ativo').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacientes Inativos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {patients.filter(p => p.status === 'inativo').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pacientes */}
      <div className={`grid ${patientsToShow.length == 0 ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        {patientsToShow.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Carregando...</p>
            </CardContent>
          </Card>
        ) : (
          patientsToShow.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {patient.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col items-center">
                        <h3 className="font-semibold text-lg w-full text-start">{patient.nome}</h3>
                        <p className="text-sm w-full text-start"><strong>CPF: </strong>{patient.cpf}</p>
                        <p className="text-sm w-full text-start"><strong>Nascimento: </strong>{formatarDataComDateFns(patient.dataNascimento)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => setSelectedPatient(patient)}>
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>             
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredPatients.length > visiblePatients && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleLoadMore} variant="outline">
            Carregar mais pacientes
          </Button>
        </div>
      )}

      {/* Modal de detalhes do paciente */}
      {selectedPatient && editingPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => {
          setSelectedPatient(null);
          setIsEditing(false);
        }}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Detalhes do Paciente - {selectedPatient.nome}</DialogTitle>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="mr-4">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <Button onClick={handleUpdatePatient} className="mr-4">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                )}
              </div>
            </DialogHeader>
            <Tabs defaultValue="dados" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    {isEditing ? (
                      <Input
                        value={editingPatient.nome || ''}
                        onChange={(e) => handleFieldChange('nome', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedPatient.nome}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">CPF</label>
                    {isEditing ? (
                      <Input
                        value={editingPatient.cpf || ''}
                        onChange={(e) => handleFieldChange('cpf', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedPatient.cpf}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    {isEditing ? (
                      <Input value={editingPatient.telefone || ''} maxLength={11}
                        onChange={(e) => handleFieldChange('telefone', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedPatient.telefone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-mail</label>
                    {isEditing ? (
                      <Input
                        value={editingPatient.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedPatient.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data de Nascimento</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editingPatient.dataNascimento || ''}
                        onChange={(e) => handleFieldChange('dataNascimento', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">
                        {selectedPatient.dataNascimento} {" "}
                        ({calculateAge(selectedPatient.dataNascimento)} anos)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">CEP</label>
                    {isEditing ? (
                      <Input
                        value={editingPatient.cep || ''}
                        onChange={(e) => handleFieldChange('cep', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">
                        {selectedPatient.cep}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Endereco</label>
                    {isEditing ? (
                      <Input
                        value={editingPatient.endereco || ''}
                        onChange={(e) => handleFieldChange('endereco', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">
                        {selectedPatient.endereco}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Status</label>
                    {isEditing ? (
                      <select
                        value={editingPatient.status || 'ativo'}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">
                        {selectedPatient.status}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2">Tratamentos Realizados</h4>
                  <div className="space-y-2">
                    {appointments.filter(a => a.pacienteId === selectedPatient.id).map(a => (
                        <div key={a.id} className="flex justify-between">
                          <div>
                            <h5 className="font-medium">Agendamento {a.id}</h5>
                            <p>Serviço: {a.servico}</p>
                          </div>
                          <Button onClick={() => sendPosMessage(a)}>Enviar Mensagem</Button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PatientManagement;