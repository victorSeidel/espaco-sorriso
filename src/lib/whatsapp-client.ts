import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { sleep } from './sleep';

let qrCodeDataUrl: string | null = null;
let isClientReady = false;

const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { headless: true }, });

client.on('qr', async (qr) => { qrCodeDataUrl = await QRCode.toDataURL(qr); });

client.on('ready', async () => 
{
    console.log('WhatsApp pronto, aguardando estabilização...');
    await sleep(2000);
    console.log('Cliente pronto!');
    isClientReady = true;
    qrCodeDataUrl = null;
});

client.on('auth_failure', (msg) => 
{
    console.error('Falha na autenticação: ', msg);
});

client.on('disconnected', () => 
{
    console.warn('Cliente foi desconectado.');
    isClientReady = false;
});

client.initialize();

export { client, isClientReady, qrCodeDataUrl };