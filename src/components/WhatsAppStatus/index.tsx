'use client';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

export default function WhatsAppStatus() 
{
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => 
  {
    const interval = setInterval(async () => 
    {
      const res = await fetch('/api/exibir-qr-code');
      const data = await res.json();

      setReady(data.ready);
      setQrCode(data.qrCode ?? null);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function handleDisconnect() 
  {
    setLoading(true);
    const res = await fetch('/api/desconectar-whatsapp', { method: 'POST' });
    const result = await res.json();
    console.log(result);
    setLoading(false);

    if (result.success) 
    {
      setReady(false);
      setQrCode(null);
    } 
    else 
    {
      alert('Erro ao desconectar WhatsApp. Tente novamente mais tarde.');
    }
  }

    if (ready)
    {
      return (
        <div className="flex flex-col gap-4 mb-2">
          <p className="text-green-500 text-lg">WhatsApp conectado.</p>
          <Button onClick={handleDisconnect} disabled={loading} className="bg-red-500 hover:bg-red-700 max-w-57">
            {loading ? 'Desconectando...' : 'Desconectar WhatsApp'}
          </Button>
        </div>
      );
    }

  return qrCode 
    ? 
    ( <img src={qrCode} alt="QR Code do WhatsApp" className="w-60 h-60" />) 
    : 
    (
      <div className="flex flex-col gap-2">
        <p className="text-yellow-500 text-lg">Conectando-se ao WhatsApp...</p> 
      </div>
    );
}
