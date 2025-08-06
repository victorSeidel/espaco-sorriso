'use server';

import { CaixaRepository } from "@/repositories/caixaRepository";
import { NovoCaixa } from "@/database/schema";

// Abrir um novo caixa
export async function createCaixa(data: NovoCaixa) {
  return await CaixaRepository.create(data);
}

// Fechar um caixa
export async function fecharCaixa(id: number, valorFechamento: number) {
  return await CaixaRepository.close(id, valorFechamento);
}

// Atualizar informações do caixa
export async function atualizarCaixa(id: number, data: Partial<NovoCaixa>) {
  return await CaixaRepository.update(id, data);
}

// Buscar todos os caixas
export async function buscarTodosCaixas() {
  return await CaixaRepository.findAll();
}

// Buscar caixa por ID
export async function buscarCaixaPorId(id: number) {
  return await CaixaRepository.findById(id);
}

// Buscar caixas por status (aberto, fechado, pendente)
export async function buscarCaixasPorStatus(status: string) {
  return await CaixaRepository.findByStatus(status);
}

// Buscar o último caixa aberto
export async function buscarUltimoCaixaAberto() {
  return await CaixaRepository.findLastOpened();
}

export async function findCaixaByDate(date: Date) {
  return await CaixaRepository.findByDate(date);
}

// Adicionar entrada ao caixa
export async function adicionarEntrada(id: number, valor: number) {
  const caixa = await CaixaRepository.findById(id);
  const novoValorEntradas = (Number(caixa.entradas) + valor).toFixed(2);
  return await CaixaRepository.update(id, { entradas: novoValorEntradas });
}

// Adicionar saída ao caixa
export async function adicionarSaida(id: number, valor: number) {
  const caixa = await CaixaRepository.findById(id);
  const novoValorSaidas = (Number(caixa.saidas) + valor).toFixed(2);
  return await CaixaRepository.update(id, { saidas: novoValorSaidas });
}

// Deletar um caixa
export async function excluirCaixa(id: number) {
  return await CaixaRepository.delete(id);
}