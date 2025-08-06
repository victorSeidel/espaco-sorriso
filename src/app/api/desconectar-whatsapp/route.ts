import { NextResponse } from 'next/server';
import { client } from '@/lib/whatsapp-client';

export async function POST() 
{
    if (!client || !client.info) return NextResponse.json({ success: false, error: 'Client WhatsApp não encontrado.' }, { status: 404 });

    try 
    {
        await client.logout();
        await client.destroy();
        
        return NextResponse.json({ success: true });
    } 
    catch (error) 
    {
        console.error('Erro ao desconectar: ', error);
        return NextResponse.json({ success: false, error: 'Erro ao desconectar WhatsApp.' }, { status: 500 });
    }
}
