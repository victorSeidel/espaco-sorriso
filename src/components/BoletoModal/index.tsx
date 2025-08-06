import { useEffect, useState } from "react";

import { Receipt, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Paciente } from "@/database/schema";
import { findAllPacientesAction } from "@/actions/pacientes/actions";

export function BoletoModal() 
{
    const [open, setOpen] = useState(false);
    const [boletoData, setBoletoData] = useState
    ({
        paciente: '',
        valor: '',
        dataCriacao: '',
        dataVencimento: '',
        status: '',
    });

    const [patients, setPatients] = useState<Paciente[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    async function fetchData() 
    {
        const pacienteData = await findAllPacientesAction();
        setPatients(pacienteData);
    }
    
    useEffect(() => { fetchData(); }, []);

    const handleFieldChange = (field: string, value: string) => { setBoletoData({ ...boletoData, [field]: value, }); };

    const handleGenerateBoleto = async () => 
    {
        try 
        {
            const response = await fetch('/api/gerar-boleto', 
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify(boletoData),
            });

            if (!response.ok)
            {
                alert('Erro ao gerar boleto');
                return;
            }

            const result = await response.json();

            console.log(result);

            setOpen(false);
        } 
        catch 
        {
            alert('Erro ao gerar boleto.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
            <Receipt className="w-4 h-4 mr-2" />
            Gerar Boleto
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
            <DialogTitle>Gerar Novo Boleto - ASAAS</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="dados" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados do Boleto</TabsTrigger>
                <TabsTrigger value="cliente">Dados do Cliente</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Valor (R$) <span className="text-xs text-gray-500">Mínimo de R$ 5,00</span> </Label>
                    <Input
                        type="number"
                        value={boletoData?.valor}
                        onChange={(e) => handleFieldChange("valor", e.target.value)}
                        placeholder="5,00"
                    />
                </div>
                <div>
                    <Label>Data de Vencimento</Label>
                    <Input
                        type="date"
                        value={boletoData?.dataVencimento}
                        onChange={(e) => handleFieldChange("dataVencimento", e.target.value)}
                    />
                </div>
                </div>
            </TabsContent>

            <TabsContent value="cliente" className="space-y-4">
                <div className="">
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
                        <Select value={boletoData?.paciente} onValueChange={(value) => {handleFieldChange("paciente", value)}} >
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
                </div>
            </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
            </Button>
            <Button onClick={handleGenerateBoleto}>
                <Receipt className="w-4 h-4 mr-2" />
                Gerar Boleto
            </Button>
            </div>
        </DialogContent>
        </Dialog>
    );
}