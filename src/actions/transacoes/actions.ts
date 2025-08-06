'use server';

import { transacaoRepository } from '@/repositories/transacaoRepository';
import { NovaTransacao, Transacao } from '@/database/schema';

export async function createTransacaoAction(data: NovaTransacao): Promise<Transacao | null> {
  return await transacaoRepository.create(data);
}

export async function findAllTransacoesAction(): Promise<Transacao[]> {
  return await transacaoRepository.findAll();
}

export async function findTransacaoByIdAction(id: number): Promise<Transacao> {
  return await transacaoRepository.findById(id);
}

export async function findTransacoesByProfessionalAction(professionalId: number): Promise<Transacao[]> {
  return await transacaoRepository.findByProfessional(professionalId);
}

export async function updateTransacaoAction(id: number, data: Partial<Transacao>): Promise<Transacao> {
  return await transacaoRepository.update(id, data);
}

export async function deleteTransacaoAction(id: number): Promise<void> {
  return await transacaoRepository.delete(id);
}

export async function getTotalTransacoesByProfessionalAction(professionalId: number): Promise<number> {
  return await transacaoRepository.getTotalByProfessional(professionalId);
}