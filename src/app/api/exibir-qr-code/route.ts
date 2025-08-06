import { NextResponse } from 'next/server';
import { qrCodeDataUrl, isClientReady } from '@/lib/whatsapp-client';

export async function GET() 
{
    if (isClientReady) 
    {
        return NextResponse.json({ ready: true });
    }

    if (qrCodeDataUrl) 
    {
        return NextResponse.json({ ready: false, qrCode: qrCodeDataUrl });
    }

    return NextResponse.json({ ready: false, qrCode: null });
}