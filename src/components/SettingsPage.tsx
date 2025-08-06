import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Settings as SettingsIcon, MessageSquare, DollarSign, Plus, UserPlus, Stethoscope } from "lucide-react";

import { Profissional, Auxiliar } from "@/database/schema";

import { 
  createProfissionalAction, 
  deleteProfissionalAction, 
  findAllProfissionaisAction,
  updateProfissionalAction 
} from "@/actions/profissionais/actions";
import { getMensagem, updateChaveAsaas, updateMensagem, updateNumeroWhatsApp, updateTokenWhatsApp } from "@/actions/configuracoes/actions";
import { 
  createAuxiliarAction, 
  deleteAuxiliarAction, 
  findAllAuxiliaresAction,
  updateAuxiliarAction 
} from "@/actions/auxiliares/actions";
import WhatsAppStatus from "./WhatsAppStatus";

const SettingsPage = () => 
{
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [asaasApiKey, setAsaasApiKey] = useState("");

  const [professionals, setProfessionals] = useState<Profissional[]>([]);
  const [isAddingProfessional, setIsAddingProfessional] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<number | null>(null);
  const [secretaries, setSecretaries] = useState<Auxiliar[]>([]);
  const [isAddingSecretary, setIsAddingSecretary] = useState(false);
  const [isEditingSecretary, setIsEditingSecretary] = useState(false);
  const [currentSecretaryId, setCurrentSecretaryId] = useState<number | null>(null);

  const [msgAgendamento, setMsgAgendamento] = useState("");
  const [msgBoleto, setMsgBoleto] = useState("");
  const [msgInatividade, setMsgInatividade] = useState("");
  const [msgPos, setMsgPos] = useState("");

  const [professionalData, setProfessionalData] = useState({ 
    nome: "", 
    especialidade: "", 
    registro: "", 
    telefone: "", 
    email: "", 
    horarioTrabalho: "" 
  });

  const [secretaryData, setSecretaryData] = useState({ 
    nome: "", 
    usuario: "", 
    telefone: "", 
    email: "", 
    senha: "" 
  });

  async function fetchData() 
  {
    setProfessionals(await findAllProfissionaisAction());
    setSecretaries(await findAllAuxiliaresAction());

    setWhatsappNumero((await getMensagem('numero_whatsapp')).valor)
    setMsgAgendamento((await getMensagem('msg_agendamento')).valor);
    setMsgBoleto((await getMensagem('msg_boleto')).valor);
    setMsgInatividade((await getMensagem('msg_inatividade')).valor);
    setMsgPos((await getMensagem('msg_pos')).valor);
  }

  useEffect(() => { fetchData(); }, []);

  const handleAddProfessional = async () => 
  {
    try 
    {
      await createProfissionalAction(professionalData);
      alert('Profissional cadastrado com sucesso!');
      resetProfessionalForm();
      setIsAddingProfessional(false);
    } 
    catch (error) 
    {
      alert('Erro ao cadastrar profissional. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const handleEditProfessional = async (id: number) => 
  {
    const professional = professionals.find(p => p.id === id);
    if (!professional) return;
    
    setProfessionalData({
      nome: professional.nome,
      especialidade: professional.especialidade,
      registro: professional.registro,
      telefone: professional.telefone,
      email: professional.email,
      horarioTrabalho: professional.horarioTrabalho || ''
    });
    
    setCurrentProfessionalId(id);
    setIsEditingProfessional(true);
  };

  const handleUpdateProfessional = async () => 
  {
    if (!currentProfessionalId) return;
    
    try 
    {
      await updateProfissionalAction(currentProfessionalId, professionalData);
      alert('Profissional atualizado com sucesso!');
      resetProfessionalForm();
      setIsEditingProfessional(false);
    } 
    catch (error) 
    {
      alert('Erro ao atualizar profissional. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const handleDeleteProfessional = async (id: number) => 
  {
    if (!confirm('Tem certeza que deseja excluir esse profissional?')) return;
    try 
    { 
      await deleteProfissionalAction(id);
      alert('Profissional excluído com sucesso!');
    }
    catch 
    {
      alert('Erro ao excluir profissional. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const handleAddSecretary = async () => 
  {
    try 
    {
      await createAuxiliarAction(secretaryData);
      alert('Auxiliar cadastrado com sucesso!');
      resetSecretaryForm();
      setIsAddingSecretary(false);
    } 
    catch (error) 
    {
      alert('Erro ao cadastrar auxiliar. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const handleEditSecretary = async (id: number) => 
  {
    const secretary = secretaries.find(s => s.id === id);
    if (!secretary) return;
    
    setSecretaryData({
      nome: secretary.nome,
      usuario: secretary.usuario,
      telefone: secretary.telefone,
      email: secretary.email,
      senha: ""
    });
    
    setCurrentSecretaryId(id);
    setIsEditingSecretary(true);
  };

  const handleUpdateSecretary = async () => 
  {
    if (!currentSecretaryId) return;
    
    try 
    {
      await updateAuxiliarAction(currentSecretaryId, secretaryData);
      alert('Auxiliar atualizado com sucesso!');
      resetSecretaryForm();
      setIsEditingSecretary(false);
    } 
    catch (error) 
    {
      alert('Erro ao atualizar auxiliar. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const handleDeleteSecretary = async (id: number) => 
  {
    if (!confirm('Tem certeza que deseja excluir esse auxiliar?')) return;
    try 
    { 
      await deleteAuxiliarAction(id);
      alert('Auxiliar excluído com sucesso!');
    }
    catch 
    {
      alert('Erro ao excluir auxiliar. Tente novamente.');
    }
    finally
    {
      fetchData();
    }
  };

  const resetProfessionalForm = () => {
    setProfessionalData({ 
      nome: "", 
      especialidade: "", 
      registro: "", 
      telefone: "", 
      email: "", 
      horarioTrabalho: "" 
    });
    setCurrentProfessionalId(null);
  };

  const resetSecretaryForm = () => {
    setSecretaryData({ 
      nome: "", 
      usuario: "", 
      telefone: "", 
      email: "", 
      senha: "" 
    });
    setCurrentSecretaryId(null);
  };

  const saveWhatsAppConfig = async () => 
  {
    try 
    {
      if (whatsappToken) await updateTokenWhatsApp(whatsappToken);
      if (whatsappNumero) await updateNumeroWhatsApp(whatsappNumero);

      alert('Configurações salvas com sucesso!');
    } 
    catch (err) 
    {
      alert('Falha ao salvar configurações. Tente novamente.');
    }
  };

  const saveAsaasConfig = async () => 
  {
    try 
    {
      if (asaasApiKey) await updateChaveAsaas(asaasApiKey);

      alert('Configurações salvas com sucesso!');
    } 
    catch (err) 
    {
      alert('Falha ao salvar configurações. Tente novamente.');
    }
  };

  const saveMsgConfig = async () => 
  {
    try 
    {
      if (msgAgendamento) await updateMensagem('msg_agendamento', msgAgendamento);
      if (msgBoleto)      await updateMensagem('msg_boleto', msgBoleto);
      if (msgInatividade) await updateMensagem('msg_inatividade', msgInatividade);
      if (msgPos)         await updateMensagem('msg_pos', msgPos);

      alert('Configurações salvas com sucesso!');
    } 
    catch (error) 
    {
      alert('Falha ao salvar configurações. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Configurações do Sistema
        </h2>
        <p className="text-gray-600">Painel administrativo e configurações avançadas</p>
      </div>

      <Tabs defaultValue="integracao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integracao">Integrações</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="integracao" className="space-y-4">
          <div className="grid gap-6">
            {/* Configuração WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Integração WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="whatsapp-token">Token da API WhatsApp</Label>
                  <Input
                    id="whatsapp-token"
                    type="password"
                    placeholder="Cole aqui o token da API do WhatsApp Business"
                    value={whatsappToken}
                    onChange={(e) => setWhatsappToken(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-number">Número da Clínica</Label>
                  <Input
                    id="whatsapp-number"
                    placeholder="Insira aqui o número do WhatsApp Business. Ex: 5598983112237"
                    value={whatsappNumero}
                    onChange={(e) => setWhatsappNumero(e.target.value)}
                  />
                </div>
                <WhatsAppStatus />
                <Button onClick={saveWhatsAppConfig}>
                  Salvar Configuração WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Configuração ASAAS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Integração ASAAS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="asaas-key">Chave API ASAAS</Label>
                  <Input
                    id="asaas-key"
                    type="password"
                    placeholder="Cole aqui sua chave da API ASAAS"
                    value={asaasApiKey}
                    onChange={(e) => setAsaasApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={saveAsaasConfig}>
                  Salvar Configuração ASAAS
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Profissionais de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddingProfessional || isEditingProfessional} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setIsAddingProfessional(false);
                            setIsEditingProfessional(false);
                            resetProfessionalForm();
                          }
                        }}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => setIsAddingProfessional(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Novo Profissional
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingProfessional ? 'Editar Profissional' : 'Cadastrar Profissional'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="prof-name">Nome Completo</Label>
                          <Input
                            id="prof-name"
                            value={professionalData.nome}
                            onChange={(e) => setProfessionalData({...professionalData, nome: e.target.value})}
                            placeholder="Dr. João Silva"
                          />
                        </div>
                        <div>
                          <Label htmlFor="prof-specialty">Especialidade</Label>
                          <Input
                            id="prof-crm"
                            value={professionalData.especialidade}
                            onChange={(e) => setProfessionalData({...professionalData, especialidade: e.target.value})}
                            placeholder="Implantodontia"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="prof-crm">Registro</Label>
                          <Input
                            id="prof-crm"
                            value={professionalData.registro}
                            onChange={(e) => setProfessionalData({...professionalData, registro: e.target.value})}
                            placeholder="CRO-SP 12345"
                          />
                        </div>
                        <div>
                          <Label htmlFor="prof-phone">Telefone</Label>
                          <Input
                            id="prof-phone"
                            value={professionalData.telefone}
                            onChange={(e) => setProfessionalData({...professionalData, telefone: e.target.value})}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="prof-email">Email</Label>
                        <Input
                          id="prof-email"
                          type="email"
                          value={professionalData.email}
                          onChange={(e) => setProfessionalData({...professionalData, email: e.target.value})}
                          placeholder="joao@clinica.com"
                        />
                      </div>          

                      <div>
                        <Label htmlFor="prof-schedule">Horário de Trabalho</Label>
                        <Textarea
                          id="prof-schedule"
                          value={professionalData.horarioTrabalho}
                          onChange={(e) => setProfessionalData({...professionalData, horarioTrabalho: e.target.value})}
                          placeholder="8h as 16h"
                          rows={2}
                        />
                      </div>       
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={isEditingProfessional ? handleUpdateProfessional : handleAddProfessional} 
                          className="flex-1"
                        >
                          {isEditingProfessional ? 'Atualizar Profissional' : 'Cadastrar Profissional'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingProfessional(false);
                            setIsEditingProfessional(false);
                            resetProfessionalForm();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {professionals.map(professional => (
                  <div key={professional.id} className="flex items-center justify-between mt-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {professional.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col items-center">
                          <h3 className="font-semibold text-lg w-full text-start"> {professional.nome}
                            <span className="ml-2 text-sm text-gray-700">{professional.especialidade}</span>
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleDeleteProfessional(professional.id)} 
                        className="bg-red-500 hover:bg-red-700"
                      >
                        Excluir
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditProfessional(professional.id)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>       
                ))} 
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">                
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  Cadastro de Auxiliares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddingSecretary || isEditingSecretary} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setIsAddingSecretary(false);
                            setIsEditingSecretary(false);
                            resetSecretaryForm();
                          }
                        }}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline" onClick={() => setIsAddingSecretary(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Novo Auxiliar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingSecretary ? 'Editar Auxiliar' : 'Cadastrar Auxiliar'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="sec-name">Nome Completo</Label>
                        <Input
                          id="sec-name"
                          value={secretaryData.nome}
                          onChange={(e) => setSecretaryData({...secretaryData, nome: e.target.value})}
                          placeholder="Maria Santos"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sec-username">Usuário (Login)</Label>
                          <Input
                            id="sec-username"
                            value={secretaryData.usuario}
                            onChange={(e) => setSecretaryData({...secretaryData, usuario: e.target.value})}
                            placeholder="maria.santos"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sec-password">Senha</Label>
                          <Input
                            id="sec-password"
                            type="password"
                            value={secretaryData.senha}
                            onChange={(e) => setSecretaryData({...secretaryData, senha: e.target.value})}
                            placeholder={isEditingSecretary ? "Deixe em branco para manter" : ""}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sec-phone">Telefone</Label>
                          <Input
                            id="sec-phone"
                            value={secretaryData.telefone}
                            onChange={(e) => setSecretaryData({...secretaryData, telefone: e.target.value})}
                            placeholder="11999999999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sec-email">Email</Label>
                          <Input
                            id="sec-email"
                            type="email"
                            value={secretaryData.email}
                            onChange={(e) => setSecretaryData({...secretaryData, email: e.target.value})}
                            placeholder="maria@clinica.com"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={isEditingSecretary ? handleUpdateSecretary : handleAddSecretary} 
                          className="flex-1"
                        >
                          {isEditingSecretary ? 'Atualizar Auxiliar' : 'Cadastrar Auxiliar'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingSecretary(false);
                            setIsEditingSecretary(false);
                            resetSecretaryForm();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {secretaries.map(secretary => (
                  <div key={secretary.id} className="flex items-center justify-between mt-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {secretary.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col items-center">
                          <h3 className="font-semibold text-lg w-full text-start"> {secretary.nome}
                            <span className="ml-2 text-sm text-gray-700">{secretary.email}</span>
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleDeleteSecretary(secretary.id)} 
                        className="bg-red-500 hover:bg-red-700"
                      >
                        Excluir
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditSecretary(secretary.id)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>       
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mensagens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Mensagens Automáticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2"> Confirmação de Agendamento {" "}
                  <span className="text-sm text-gray-700">{'{nome}, {profissional}, {servico}, {data}, {hora}'}</span> 
                </h4>
                <Textarea
                  placeholder="Mensagem enviada para confirmar agendamentos..."
                  rows={2}
                  value={msgAgendamento}
                  onChange={(e) => setMsgAgendamento(e.target.value)}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Lembrete de Boleto <span className="text-sm text-gray-700">{'{nome}, {valor}, {data}'}</span> </h4>
                <Textarea
                  placeholder="Mensagem para lembrete de boleto..."
                  rows={2}
                  value={msgBoleto}
                  onChange={(e) => setMsgBoleto(e.target.value)}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Inatividade <span className="text-sm text-gray-700">{'{nome}'}</span> </h4>
                <Textarea
                  placeholder="Mensagem em caso de inatividade por muitos dias..."
                  rows={2}
                  value={msgInatividade}
                  onChange={(e) => setMsgInatividade(e.target.value)}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Pós-Consulta <span className="text-sm text-gray-700">{'{nome}, {servico}'}</span> </h4>
                <Textarea
                  placeholder="Mensagem para enviar pós-consulta..."
                  rows={2}
                  value={msgPos}
                  onChange={(e) => setMsgPos(e.target.value)}
                />
              </div>

              <Button onClick={saveMsgConfig} className="w-full">Salvar Todas as Mensagens</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;