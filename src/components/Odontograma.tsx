import { useState } from "react";
import { FileText} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Tooth 
{
  number: number;
  status: 'saudavel' | 'carie' | 'obturado' | 'extraido' | 'protese' | 'canal';
  treatments: Treatment[];
  observations: string;
}

interface Treatment { id: string; name: string; date: string; valor?: number; status: 'planejado' | 'em_andamento' | 'concluido'; }

interface Budget 
{
  patientName: string;
  treatments: Treatment[];
  total: number;
  discount: number;
  finalTotal: number;
  paymentPlan: string;
}

const Odontograma = () => 
{
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const [teeth, setTeeth] = useState<Tooth[]>(() => 
  {
    const initialTeeth: Tooth[] = [];
    const adultTeeth = 
    [
      ...Array.from({ length: 8 }, (_, i) => 18 - i), // 18-11
      ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28
      ...Array.from({ length: 8 }, (_, i) => 38 - i), // 38-31
      ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
    ];

    adultTeeth.forEach(number => { initialTeeth.push({ number, status: 'saudavel', treatments: [], observations: '' }); });

    return initialTeeth;
  });

  const [budget, setBudget] = useState<Budget>({
    patientName: "",
    treatments: [],
    total: 0,
    discount: 0,
    finalTotal: 0,
    paymentPlan: ""
  });

  const treatmentPrices = [ 'Limpeza', 'Obturação', 'Canal', 'Extração', 'Prótese', 'Clareamento', 'Implante', 'Aparelho' ];

  const addTreatmentToBudget = (treatmentName: string) => 
  {
    const newTreatment: Treatment = 
    {
      id: Date.now().toString(),
      name: treatmentName,
      date: new Date().toISOString().split('T')[0],
      status: 'planejado',
      valor: 0,
    };

    setBudget(prev => 
    {
      const newTreatments = [...prev.treatments, newTreatment];

      const total = newTreatments.reduce((acc, t) => acc + (t.valor || 0), 0);
      const finalTotal = total - prev.discount;

      return {...prev, treatments: newTreatments, total, finalTotal};
    });
  };

  const generateBudgetPDF = async () => 
  {

  };

  const renderQuadrant = (toothNumbers: number[], title: string) => 
  (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-center">{title}</h4>
      <div className="grid grid-cols-8 gap-1">
        {toothNumbers.map(toothNumber => 
        {
          const tooth = teeth.find(t => t.number === toothNumber);
          if (!tooth) return null;
          
          return (
            <button key={toothNumber} onClick={() => setSelectedTooth(toothNumber)}
              className={`w-8 h-8 rounded border-2 text-xs font-bold hover:scale-110 transition-transformbg-green-100 border-green-300 text-green-800
                ${selectedTooth === toothNumber ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}>
              {toothNumber}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Odontograma Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa Dental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Quadrante Superior */}
            <div className="grid grid-cols-2 gap-4">
              {renderQuadrant(  Array.from({ length: 8 }, (_, i) => 18 - i), "Superior Direito" )}
              {renderQuadrant( Array.from({ length: 8 }, (_, i) => 21 + i), "Superior Esquerdo" )}
            </div>

            {/* Quadrante Inferior */}
            <div className="grid grid-cols-2 gap-4">
              {renderQuadrant( Array.from({ length: 8 }, (_, i) => 48 - i), "Inferior Direito" )}
              {renderQuadrant( Array.from({ length: 8 }, (_, i) => 31 + i), "Inferior Esquerdo" )}
            </div>

          </CardContent>
        </Card>

        {/* Painel de detalhes do dente */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTooth ? `Dente ${selectedTooth}` : 'Selecione um dente'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTooth ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Adicionar tratamento ao orçamento</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {treatmentPrices.map((treatment) => (
                      <Button key={treatment} variant="outline" size="sm" onClick={() => addTreatmentToBudget(treatment)}>
                        {treatment}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Clique em um dente no odontograma para ver os detalhes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orçamento */}
      <Card id="budget-section">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orçamento Automático</CardTitle>
          {/*
          <div className="flex gap-2">
            <Button onClick={generateBudgetPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
          */}
        </CardHeader>
        <CardContent>
          {budget.treatments.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Tratamentos Planejados</h4>
                <div className="space-y-2">
                  {budget.treatments.map((treatment) => (
                    <div key={treatment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{treatment.name}</span>
                      <Input type="number" className="max-w-48" placeholder="R$ 100,00" value={treatment.valor ?? 0} required
                        onChange={(e) => 
                        {
                          const valor = parseFloat(e.target.value) || 0;

                          setBudget(prev => 
                          {
                            const updatedTreatments = prev.treatments.map(t => t.id === treatment.id ? { ...t, valor } : t );

                            const total = updatedTreatments.reduce((acc, t) => acc + (t.valor || 0), 0);

                            return {
                              ...prev,
                              treatments: updatedTreatments,
                              total,
                              finalTotal: total - prev.discount
                            };
                          });
                        }}
                      />
                    </div>
                  ))}      
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span>Subtotal:</span>
                  <span className="font-medium">R$ {budget.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Desconto:</span>
                  <Input
                    type="number"
                    value={budget.discount}
                    onChange={(e) => setBudget(prev => ({
                      ...prev,
                      discount: Number(e.target.value),
                      finalTotal: prev.total - Number(e.target.value)
                    }))}
                    className="w-24 text-right"
                  />
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {budget.finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Plano de Pagamento</label>
                <Input type="text" value={budget.paymentPlan} onChange={(e) => setBudget(prev => ({ ...prev, paymentPlan: e.target.value }))} />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Adicione tratamentos para gerar o orçamento automaticamente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Odontograma;
