'use server';

import { ConfiguracaoRepository } from "@/repositories/configuracaoRepository";

export async function updateTokenWhatsApp(token: string) 
{
    return await ConfiguracaoRepository.update('token_whatsapp', { valor: token });
}

export async function getNumeroWhatsApp()
{
    return await ConfiguracaoRepository.findByName('numero_whatsapp');
}

export async function updateNumeroWhatsApp(numero: string) 
{
    return await ConfiguracaoRepository.update('numero_whatsapp', { valor: numero });
}

export async function getChaveAsaas()
{
    return await ConfiguracaoRepository.findByName('chave_asaas');
}

export async function updateChaveAsaas(chave: string) 
{
    return await ConfiguracaoRepository.update('chave_asaas', { valor: chave });
}

export async function updateAmbienteAsaas(ambiente: string) 
{
    return await ConfiguracaoRepository.update('ambiente_asaas', { valor: ambiente });
}

export async function getMensagem(nome: string) 
{
    return await ConfiguracaoRepository.findByName(nome);
}

export async function updateMensagem(nome: string, valor: string) 
{
    return await ConfiguracaoRepository.update(nome, { valor });
}