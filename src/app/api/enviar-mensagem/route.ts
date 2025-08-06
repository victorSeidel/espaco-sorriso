import { NextResponse } from 'next/server';
import { client, isClientReady } from '@/lib/whatsapp-client';

export async function POST(req: Request) 
{
    const body = await req.json();

    const phone = body.phone;
    const message = body.message;

    if (!phone || !message) return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });

    if (!isClientReady) return NextResponse.json({ error: 'Cliente do WhatsApp ainda não está pronto' }, { status: 503 });

    try 
    {
        let formattedPhone = phone.replace(/\D/g, '');

        let localPhone = formattedPhone.startsWith('55') ? formattedPhone.slice(2) : formattedPhone;

        if (localPhone.length === 11 && localPhone[2] === '9') localPhone = localPhone.slice(0, 2) + localPhone.slice(3);

        const chatId = `55${localPhone}@c.us`;

        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) return NextResponse.json({ error: 'Número não está registrado no WhatsApp' }, { status: 400 });

        await client.sendMessage(chatId, message);

        return NextResponse.json({ success: true }, { status: 200 });
    } 
    catch (err) 
    {
        console.error(err);
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
    }
}
