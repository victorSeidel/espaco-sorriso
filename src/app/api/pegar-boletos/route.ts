import { NextResponse } from "next/server";

import { getChaveAsaas } from "@/actions/configuracoes/actions";

export async function GET() 
{
    try 
    {
        const data = await pegarBoletosAsaas();

        return NextResponse.json({ data });
    } 
    catch (err: any) 
    {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function pegarBoletosAsaas()
{
    try
    {
        const SECRET = ( await getChaveAsaas() ).valor;

        const options = { method: 'GET', headers: { accept: 'application/json', 'content-type': 'application/json', access_token: SECRET } };

        const res = await fetch('https://api.asaas.com/v3/payments', options);
        if (!res.ok) { const error = await res.json(); throw new Error(`Erro Asaas: ${error.errors?.[0]?.description || res.statusText}`); }

        const data = await res.json();

        return data.data;
    }
    catch(err: any)
    {   
        throw new Error(err.message);
    }
}
