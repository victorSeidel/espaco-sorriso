import { useEffect, useState } from "react";
import { addDays, format, subMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BoletoModal } from "./BoletoModal";

import { CreditCard, LockOpen, Lock, Plus, Filter } from "lucide-react";

import { Paciente, Profissional, Transacao, Caixa } from "@/database/schema";
import { Boleto } from "@/models/Boleto";

import { findAllProfissionaisAction } from "@/actions/profissionais/actions";
import { findAllPacientesAction } from "@/actions/pacientes/actions";
import { formatarDataComDateFns } from "@/lib/data";
import { getMensagem } from "@/actions/configuracoes/actions";
import { createTransacaoAction, deleteTransacaoAction, findAllTransacoesAction } from "@/actions/transacoes/actions";
import { createCaixa, findCaixaByDate, adicionarEntrada, adicionarSaida, fecharCaixa } from "@/actions/caixas/actions";
import { getNumeroWhatsApp } from "@/actions/configuracoes/actions";

interface FinancePanelProps { userRole: 'admin' | 'auxiliar' | null; }

const FinancePanel = ({ userRole }: FinancePanelProps) => {
  const [professionals, setProfessionals] = useState<Profissional[]>([]);
  const [patients, setPatients] = useState<Paciente[]>([]);

  const [selectedPatient, setSelectedPatient] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [caixa, setCaixa] = useState<Caixa>();
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  
    const [newTransaction, setNewTransaction] = useState({
        tipo: 'entrada',
        descricao: '',
        valor: 0,
        profissionalId: 0,
        metodoPagamento: 'Dinheiro',
        parcelas: 1,
        taxa: '0' ,
        data: new Date().toISOString().split('T')[0]
    });
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  function mapAsaasStatus(asaasStatus: string): string {
    switch (asaasStatus) {
      case 'PENDING': return 'pendente';
      case 'OVERDUE': return 'vencido';
      case 'CONFIRMED': return 'pago';
      default: return 'pendente';
    }
  }

  async function fetchCaixa() {
    const selectedDateObj = new Date(selectedDate);
    const caixasDoDia = await findCaixaByDate(selectedDateObj);
    
    if (caixasDoDia.length > 0) {
      setCaixa(caixasDoDia[0]);
    } else {
      setCaixa(undefined);
    }
  }

  useEffect(() => { fetchCaixa(); }, [selectedDate]);

  async function handleOpenCaixa() {
    const abertura = prompt('Digite o valor de abertura do caixa:');

    if (abertura === null) return;

    const newCaixa = { 
      abertura: Number(abertura).toFixed(2), 
      entradas: (0).toFixed(2), 
      saidas: (0).toFixed(2), 
      fechamento: (0).toFixed(2), 
      status: 'aberto'
    };

    await createCaixa(newCaixa);
    fetchCaixa();
  }

  async function fetchData() {
    const profissionalData = await findAllProfissionaisAction();
    setProfessionals(profissionalData);

    const pacienteData = await findAllPacientesAction();
    setPatients(pacienteData);

    fetchCaixa();

    const transacoesData = await findAllTransacoesAction();
    setTransactions(transacoesData);

    try {
      const boletosResponse = await fetch('/api/pegar-boletos', { 
        method: 'GET', 
        headers: {'Content-Type': 'application/json'} 
      });
      if (!boletosResponse.ok) throw new Error('Erro ao buscar boletos.');
      const boletosData: Boleto[] = (await boletosResponse.json()).data;
      const boletosFormatados = boletosData.filter(b => b.billingType === 'BOLETO').map(b => ({
        id: b.id,
        customer: b.customer,
        billingType: b.billingType,
        value: b.value,
        netValue: b.netValue,
        dueDate: b.dueDate,
        paymentDate: b.paymentDate || '',
        invoiceUrl: b.invoiceUrl,
        bankSlipUrl: b.bankSlipUrl,
        status: mapAsaasStatus(b.status),
        description: b.description || '',
        externalReference: b.externalReference || ''
      } as Boleto));
      setBoletos(boletosFormatados);
    } catch(error) {
      alert(error);
    }
  }

  useEffect(() => { fetchData(); }, []);

    const filteredTransactions = transactions.filter(transaction => 
    {
        const matchesProfessional = selectedProfessional === 'all' || (transaction.profissionalId && transaction.profissionalId.toString() === selectedProfessional);
        const matchesDate = selectedDate === '' || transaction.createdAt.toISOString().includes(selectedDate);
        const matchesPaymentMethod = selectedPaymentMethod === 'all' || transaction.metodoPagamento === selectedPaymentMethod;
        return matchesProfessional && matchesDate && matchesPaymentMethod;
    });

  const filteredBoletos = boletos.filter(boleto => {
    const matchesPatient = selectedPatient === 'all' || boleto.customer === selectedPatient;
    const matchesStatus = selectedStatus === 'all' || boleto.status === selectedStatus;
    const matchesDate = selectedDate === '' || boleto.dueDate >= selectedDate;
    return matchesPatient && matchesStatus && matchesDate;
  });

    const getTotalsByPaymentMethod = () => 
    {
        const methods = ['Dinheiro', 'PIX', 'Boleto', 'Cartão de Crédito', 'Cartão de Débito'];
        const result: Record<string, { entrada: number; saida: number }> = {};

        const filtered = transactions.filter(t => 
        {
            const matchesProfessional = selectedProfessional === 'all' || 
            (t.profissionalId && t.profissionalId.toString() === selectedProfessional);
            const matchesDate = selectedDate === '' || 
            t.createdAt.toISOString().includes(selectedDate);
            const matchesPaymentMethod = selectedPaymentMethod === 'all' || 
            t.metodoPagamento === selectedPaymentMethod;
            
            return matchesProfessional && matchesDate && matchesPaymentMethod;
        });

        methods.forEach(method => 
        {
            result[method] = 
            {
                entrada: filtered.filter(t => t.metodoPagamento === method && t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor), 0),
                saida: filtered.filter(t => t.metodoPagamento === method && t.tipo === 'saida').reduce((sum, t) => sum + Number(t.valor), 0)
            };
        });

    return result;
    };

  const paymentMethodTotals = getTotalsByPaymentMethod();

  // Cálculo de totais por profissional
  const getTotalsByProfessional = () => {
    return professionals.map(prof => {
      const profTransactions = filteredTransactions.filter(t => t.profissionalId === prof.id);
      
      const entrada = profTransactions
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saida = profTransactions
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const preLaborePercent = prof.prelabore || 70;
      const preLaboreValue = entrada * (preLaborePercent / 100);
      const clinicaValue = entrada - preLaboreValue;

      return {
        id: prof.id,
        nome: prof.nome,
        preLaborePercent,
        entrada,
        saida,
        preLaboreValue,
        clinicaValue
      };
    }).filter(prof => prof.entrada > 0 || prof.saida > 0);
  };

  const professionalTotals = getTotalsByProfessional();

    const calculateTotals = () => {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = format(new Date(), 'yyyy-MM');

        const filteredDaily = transactions.filter(t => 
        {
            const matchesDate = t.createdAt.toISOString().includes(today);
            const matchesProfessional = selectedProfessional === 'all' || (t.profissionalId && t.profissionalId.toString() === selectedProfessional);
            const matchesPaymentMethod = selectedPaymentMethod === 'all' || t.metodoPagamento === selectedPaymentMethod;
            return matchesDate && matchesProfessional && matchesPaymentMethod;
        });

        const filteredMonthly = transactions.filter(t => 
        {
            const matchesDate = t.createdAt.toISOString().includes(currentMonth);
            const matchesProfessional = selectedProfessional === 'all' || (t.profissionalId && t.profissionalId.toString() === selectedProfessional);
            const matchesPaymentMethod = selectedPaymentMethod === 'all' ||  t.metodoPagamento === selectedPaymentMethod;
            return matchesDate && matchesProfessional && matchesPaymentMethod;
        });

        const dailyIncome = filteredDaily.reduce((sum, t) => t.tipo === 'entrada' ? sum + Number(t.valor) : sum - Number(t.valor), 0);
        const monthlyIncome = filteredMonthly.reduce((sum, t) => t.tipo === 'entrada' ? sum + Number(t.valor) : sum - Number(t.valor), 0);

        return { dailyIncome, monthlyIncome };
    };

  const { dailyIncome, monthlyIncome } = calculateTotals();

  const handleCreateTransaction = async () => {
    try 
    {
        let valorFinal = newTransaction.valor;

        if (newTransaction.metodoPagamento === 'Cartão de Crédito' && parseFloat(newTransaction.taxa) > 0) 
        {
            const taxaDecimal = parseFloat(newTransaction.taxa) / 100;
            valorFinal = newTransaction.valor / (1 + taxaDecimal);
        }

        const transactionData = 
        {
            profissionalId: newTransaction.profissionalId,
            descricao: newTransaction.descricao,
            valor: valorFinal.toFixed(2),
            tipo: newTransaction.tipo,
            metodoPagamento: newTransaction.metodoPagamento,
            parcelas: newTransaction.metodoPagamento === 'Cartão de Crédito' ? newTransaction.parcelas : 1,
            taxa: newTransaction.metodoPagamento === 'Cartão de Crédito' ? newTransaction.taxa : "0"
        };

      const createdTransaction = await createTransacaoAction(transactionData);
      if (!createdTransaction) throw new Error("A transação não foi criada.");

      if (caixa && createdTransaction.tipo === 'entrada') {
        await adicionarEntrada(caixa.id, Number(createdTransaction.valor));
      }
      if (caixa && createdTransaction.tipo === 'saida') {
        await adicionarSaida(caixa.id, Number(createdTransaction.valor));
      }

        setTransactions([...transactions, createdTransaction]);
        setIsAddingTransaction(false);
        setNewTransaction({
            tipo: 'entrada',
            descricao: '',
            valor: 0,
            profissionalId: 0,
            metodoPagamento: 'Dinheiro',
            parcelas: 1,
            taxa: "0",
            data: new Date().toISOString().split('T')[0]
        });

      fetchData();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      alert("Erro ao criar transação. Verifique os dados e tente novamente.");
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Tem certeza? Essa ação é permanente e irreversível.')) return;
    try {
      await deleteTransacaoAction(id);
      fetchData();
    } catch {
      alert('Erro ao excluir transação. Tente novamente.');
    }
  }

  const closeCashRegister = async () => {
    if (!confirm('Tem certeza? Esse caixa não poderá ser aberto novamente')) return;

    const fechamento = Number(caixa?.abertura) + Number(caixa?.entradas) - Number(caixa?.saidas);
    await fecharCaixa(Number(caixa?.id), Number(fechamento));

    let message = '';
    let phone = '';
    
    try {
      phone = (await getNumeroWhatsApp()).valor;

      // Cabeçalho do relatório
      message = `*Relatório de Fechamento de Caixa* - ${formatarDataComDateFns(selectedDate)}\n\n`;

      // Resumo do caixa
      message += `*RESUMO DO CAIXA*\n`;
      message += `Valor de Abertura: R$ ${Number(caixa?.abertura).toFixed(2)}\n`;
      message += `Total em Entradas: R$ ${Number(caixa?.entradas).toFixed(2)}\n`;
      message += `Total em Saídas: R$ ${Number(caixa?.saidas).toFixed(2)}\n`;
      message += `Valor Final: R$ ${fechamento.toFixed(2)}\n\n`;

      // Detalhamento por método de pagamento
      message += `*MÉTODOS DE PAGAMENTO*\n`;
      Object.entries(paymentMethodTotals).forEach(([method, totals]) => {
        if (totals.entrada > 0 || totals.saida > 0) {
          message += `- ${method.toUpperCase()}: `;
          message += `Entradas R$ ${totals.entrada.toFixed(2)} | `;
          message += `Saídas R$ ${totals.saida.toFixed(2)}\n`;
        }
      });
      message += `\n`;

      // Detalhamento por profissional
      message += `*DIVISÃO POR PROFISSIONAL*\n`;
      professionalTotals.forEach(prof => {
        message += `\n*${prof.nome}* (Pré-labore: ${prof.preLaborePercent}%)\n`;
        message += `Receita Total: R$ ${prof.entrada.toFixed(2)}\n`;
        message += `Pré-labore: R$ ${prof.preLaboreValue.toFixed(2)}\n`;
        message += `Clínica: R$ ${prof.clinicaValue.toFixed(2)}\n`;
      });

      const msgResponse = await fetch('/api/enviar-mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });

      if (!msgResponse.ok) throw new Error('Erro ao enviar mensagem.');
    } catch (error: any) {
      alert('Erro ao enviar relatório no WhatsApp.');

      const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }

    fetchCaixa();
  };

  const sendChargeMessage = async (boleto: Boleto) => {
    const patient = patients.find(p => p.asaasId === boleto.customer);
    
    if (patient) {
      const messageRaw = (await getMensagem('msg_boleto')).valor;
      const message = messageRaw
        .replaceAll('{nome}', patient.nome)
        .replaceAll('{valor}', `R$ ${boleto.value.toFixed(2)}`)
        .replaceAll('{data}', formatarDataComDateFns(boleto.dueDate));

      try {
        const msgResponse = await fetch('/api/enviar-mensagem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: patient.telefone, message })
        });

        if (!msgResponse.ok) throw new Error('Erro ao enviar mensagem.');
      } catch (error: any) {
        alert('Erro ao enviar mensagem no WhatsApp. Envie manualmente.');
        const whatsappUrl = `https://wa.me/55${patient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  const deleteCharge = async (id: string) => {
    if (!confirm('Tem certeza? Essa ação é permanente e irreversível.')) return;
    try {
      const response = await fetch('/api/excluir-boleto', { 
        method: 'DELETE', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({id}) 
      });
      if (!response.ok) throw new Error('Erro ao excluir cobrança.');
      fetchData();
    } catch {
      alert('Erro ao excluir cobrança. Tente novamente.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Caixa não encontrado */}
      {!caixa && ( 
        <Card className="bg-orange-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nenhum caixa encontrado para {formatarDataComDateFns(selectedDate)}</CardTitle>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-auto"
              />
              <Button onClick={handleOpenCaixa} className="bg-blue-500 hover:bg-blue-700">
                <LockOpen className="w-4 h-4 mr-2" />
                Abrir Caixa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p>Não foi registrado nenhum caixa para esta data.</p>
            <p className="text-red-500">O caixa só será aberto se a data atual for equivalente a data do mesmo.</p>
          </CardContent>
        </Card>
      )}

      {/* Caixa encontrado */}
      {caixa && caixa?.status !== 'pendente' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Controle de Caixa - {formatarDataComDateFns(selectedDate)}</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              {userRole === 'admin' && caixa?.status.toString() === 'aberto' && (
                <Button onClick={closeCashRegister} className="bg-purple-500 hover:bg-purple-700">
                  <LockOpen className="w-4 h-4 mr-2" />
                  Fechar Caixa
                </Button>
              )}
              {caixa?.status.toString() === 'fechado' && (
                <Button className="bg-red-500 hover:bg-red-500 hover:cursor-text">
                  <Lock className="w-4 h-4 mr-2" />
                  Caixa Fechado
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {Number(caixa?.abertura).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Abertura</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  R$ {Number(caixa?.entradas).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Entradas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  R$ {Number(caixa?.saidas).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Saídas</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {(Number(caixa?.abertura) + Number(caixa?.entradas) - Number(caixa?.saidas)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Fechamento</div>
              </div>
            </div>

            {/* Detalhamento por método de pagamento */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Detalhamento por Método de Pagamento</h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(paymentMethodTotals).map(([method, totals]) => (
                  (totals.entrada > 0 || totals.saida > 0) && (
                    <Card key={method}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          {method.toUpperCase()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">
                            Entradas: R$ {totals.entrada.toFixed(2)}
                          </span>
                          <span className="text-red-600 font-medium">
                            Saídas: R$ {totals.saida.toFixed(2)}
                          </span>
                          <span className="font-medium">
                            Saldo: R$ {(totals.entrada - totals.saida).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            </div>

            {/* Detalhamento por profissional */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Detalhamento por Profissional</h3>
              <div className="space-y-4">
                {professionalTotals.map(prof => (
                  <Card key={prof.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{prof.nome}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Receita Total</div>
                          <div className="text-xl font-bold">
                            R$ {prof.entrada.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Pro-Labore ({prof.preLaborePercent}%)</div>
                          <div className="text-xl font-bold text-blue-600">
                            R$ {prof.preLaboreValue.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Clínica</div>
                          <div className="text-xl font-bold text-green-600">
                            R$ {prof.clinicaValue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="movimentacao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="movimentacao">Movimentação</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacao" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Movimentação Financeira</h3>
            <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={newTransaction.tipo}
                      onValueChange={(value) => setNewTransaction({...newTransaction, tipo: value as 'entrada' | 'saida'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Input 
                      placeholder="Descrição da transação" 
                      value={newTransaction.descricao}
                      onChange={(e) => setNewTransaction({...newTransaction, descricao: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Profissional</label>
                    <Select
                      value={newTransaction.profissionalId.toString()}
                      onValueChange={(value) => setNewTransaction({...newTransaction, profissionalId: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {professionals.map(prof => (
                          <SelectItem key={prof.id} value={prof.id.toString()}>
                            {prof.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Valor</label>
                        <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={newTransaction.valor}
                        onChange={(e) => setNewTransaction({...newTransaction, valor: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium">Forma de Pagamento</label>
                        <Select
                        value={newTransaction.metodoPagamento}
                        onValueChange={(value) => setNewTransaction({...newTransaction, metodoPagamento: value})}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                  </div>
                  
                    {newTransaction.metodoPagamento === 'Cartão de Crédito' && (
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium">Número de Parcelas</label>
                            <Select
                                value={newTransaction.parcelas.toString()}
                                onValueChange={(value) => setNewTransaction({...newTransaction, parcelas: parseInt(value)})}
                            >
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione as parcelas" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                    {num}x
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium">Taxa da Máquina (%)</label>
                            <Input 
                                type="text" 
                                placeholder="0" 
                                value={newTransaction.taxa}
                                onChange={(e) => setNewTransaction({...newTransaction, taxa: e.target.value || "0"})}
                            />
                        </div>
                    </div>
                    )}

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleCreateTransaction}>
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingTransaction(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receita Líquida do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  R$ {dailyIncome.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(), 'dd/MM/yyyy')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receita Líquida Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  R$ {monthlyIncome.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Listagem */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transações Recentes</h3>
              <div className="flex gap-2">
                <Select 
                  value={selectedProfessional}
                  onValueChange={setSelectedProfessional}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos profissionais" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Todos profissionais</SelectItem>
                    {professionals.map(prof => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                >
                    <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos métodos" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                    <SelectItem value="all">Todos métodos</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(transaction => {
                      const professional = professionals.find(p => p.id === transaction.profissionalId);
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium">{transaction.descricao}</p>
                              <p className="text-sm text-gray-600">
                                {transaction.metodoPagamento} 
                                { transaction.metodoPagamento == 'Cartão de Crédito' && ( ` • ${transaction.parcelas} parcelas • ${transaction.taxa}% de taxa` )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')} • 
                                {professional ? ` ${professional.nome}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <p className={`font-bold ${transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {Math.abs(Number(transaction.valor)).toFixed(2)}
                            </p>
                            <Button size="sm" className="bg-red-500 hover:bg-red-700" onClick={() => handleDeleteTransaction(transaction.id)}>
                              Excluir
                            </Button>  
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma transação encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="boletos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestão de Boletos - ASAAS</h3>
            <BoletoModal />
          </div>

          <div className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Paciente</label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os pacientes" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Todos os pacientes</SelectItem>
                        {patients.map(patient => (
                          <SelectItem key={patient.id} value={patient.asaasId}>
                            {patient.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="vencido">Vencidos</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="pago">Pagos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vencimento Até</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo da inadimplência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Boletos Vencidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {filteredBoletos.filter(b => b.status === 'vencido').length}
                  </div>
                  <div className="text-sm text-gray-600">
                    R$ {filteredBoletos
                      .filter(b => b.status === 'vencido')
                      .reduce((sum, b) => sum + b.value, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {filteredBoletos.filter(b => b.status === 'pendente').length}
                  </div>
                  <div className="text-sm text-gray-600">
                    R$ {filteredBoletos
                      .filter(b => b.status === 'pendente')
                      .reduce((sum, b) => sum + b.value, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {filteredBoletos.filter(b => b.status === 'pago').length}
                  </div>
                  <div className="text-sm text-gray-600">
                    R$ {filteredBoletos
                      .filter(b => b.status === 'pago')
                      .reduce((sum, b) => sum + b.value, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de boletos filtrados */}
            {filteredBoletos.map((boleto) => (
            <Card key={boleto.id} 
              className={`${ boleto.status === 'vencido' ? 'border-red-200 bg-red-100' : 
                boleto.status === 'pendente' ? 'border-orange-200 bg-orange-100' : 'border-green-200 bg-green-100' }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {patients.find(p => p.asaasId === boleto.customer)?.nome || 'Cliente não identificado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Vencimento: {formatarDataComDateFns(boleto.dueDate)}
                    </p>
                    {boleto.description && <p className="text-sm mt-1">{boleto.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R$ {boleto.value.toFixed(2)}</p>
                    <Badge variant={boleto.status === 'pago' ? 'default' : boleto.status === 'vencido' ? 'destructive' : 'secondary'}>
                      {boleto.status.toUpperCase()}
                    </Badge>
                    <div className="mt-2 space-x-1">
                      <Button size="sm" className="bg-blue-500" onClick={() => window.open(boleto.bankSlipUrl, '_blank')}>
                        Ver Boleto
                      </Button>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-700" onClick={() => sendChargeMessage(boleto)}>
                        Cobrar / Lembrete
                      </Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-700" onClick={() => deleteCharge(boleto.id)}>
                        Excluir Cobrança
                      </Button>                     
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancePanel;
