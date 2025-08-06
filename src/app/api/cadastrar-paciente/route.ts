import { NextResponse } from "next/server";

import { getChaveAsaas } from "@/actions/configuracoes/actions";
import { createPacienteAction } from "@/actions/pacientes/actions";

export async function POST(req: Request) 
{
    try 
    {
        const body = await req.json();

        const asaasId = await criarAsaasId(body);

        const paciente = await criarPaciente(asaasId, body);

        return NextResponse.json({ success: true, paciente });
    } 
    catch (err: any) 
    {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function criarAsaasId(body: any)
{
    try
    {
        const SECRET = ( await getChaveAsaas() ).valor;

        const asaasBody = 
        {
            name: body.nome,
            cpfCnpj: body.cpf,
        };

        const options = 
        {
            method: 'POST',
            headers: { accept: 'application/json', 'content-type': 'application/json', access_token: SECRET },
            body: JSON.stringify(asaasBody)
        };

        const res = await fetch('https://api.asaas.com/v3/customers', options);
        if (!res.ok) { const error = await res.json(); throw new Error(`Erro Asaas: ${error.errors?.[0]?.description || res.statusText}`); }
        const data = await res.json();

        return data.id;
    }
    catch(err: any)
    {   
        throw new Error(err.message);
    }
}

async function criarPaciente(asaasId: string, body: any)
{
    try
    {
        const data = 
        {
            asaasId,
            nome: body.nome,
            cpf: body.cpf,
            telefone: body.telefone,
            email: body.email,
            dataNascimento: body.dataNascimento,
            cep: body.cep
        };

        return await createPacienteAction(data)
    }
    catch(err: any)
    {   
        throw new Error(err.message);
    }
}
