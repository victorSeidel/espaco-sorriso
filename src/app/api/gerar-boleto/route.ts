import { NextResponse } from "next/server";

import { getChaveAsaas } from "@/actions/configuracoes/actions";
import { findPacienteByIdAction } from "@/actions/pacientes/actions";

export async function POST(req: Request) 
{
    try 
    {
        const body = await req.json();

        const data = await gerarBoletoAsaas(body);

        return NextResponse.json({ data });
    } 
    catch (err: any) 
    {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function gerarBoletoAsaas(body: any)
{
    try
    {
        const SECRET = ( await getChaveAsaas() ).valor;

        const paciente = await findPacienteByIdAction(body.paciente);
        if (!paciente) throw new Error('Erro ao buscar paciente.'); 
        
        const asaasBody = 
        {
            customer: paciente.asaasId,
            billingType: 'BOLETO',
            value: body.valor,
            dueDate: body.dataVencimento,
        };

        const options = 
        {
            method: 'POST',
            headers: { accept: 'application/json', 'content-type': 'application/json', access_token: SECRET },
            body: JSON.stringify(asaasBody)
        };

        const res = await fetch('https://api.asaas.com/v3/payments', options);
        if (!res.ok) { const error = await res.json(); throw new Error(`Erro Asaas: ${error.errors?.[0]?.description || res.statusText}`); }
        const data = await res.json();

        return data;
    }
    catch(err: any)
    {   
        throw new Error(err.message);
    }
}
