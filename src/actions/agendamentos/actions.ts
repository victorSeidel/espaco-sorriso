'use server';

import { AgendamentoRepository } from "@/repositories/agendamentoRepository";
import { NovoAgendamento } from "@/database/schema";

// Criar um novo agendamento
export async function criarAgendamento(data: NovoAgendamento) {
  return await AgendamentoRepository.create(data);
}

// Atualizar status do agendamento (ex: confirmado, cancelado, realizado, faltou)
export async function updateStatusAgendamento(id: number, novoStatus: string) {
  return await AgendamentoRepository.update(id, { status: novoStatus });
}

// Atualizar horário e data de um agendamento (remarcar)
export async function remarcarAgendamento(id: number, novaData: string, novoHorario: string) {
  return await AgendamentoRepository.update(id, { data: novaData, horario: novoHorario });
}

// Atualizar qualquer dado (uso genérico em edição)
export async function atualizarAgendamento(id: number, data: Partial<NovoAgendamento>) {
  return await AgendamentoRepository.update(id, data);
}

// Buscar agendamentos por data
export async function buscarAgendamentosPorData(data: string) {
  return await AgendamentoRepository.findByDate(data);
}

// Buscar agendamentos de um profissional em um dia
export async function buscarAgendamentosDeProfissional(professionalId: number, data: string) {
  return await AgendamentoRepository.findByProfessionalAndDate(professionalId, data);
}

// Deletar agendamento
export async function excluirAgendamento(id: number) {
  return await AgendamentoRepository.delete(id);
}

// Buscar todos
export async function findAllAgendamentos() {
  return await AgendamentoRepository.findAll();
}

export async function findLimitedAgendamentos(limit: number) {
  return await AgendamentoRepository.findLimited(limit);
}

// Buscar por ID (detalhe)
export async function findAgendamentoById(id: number) {
  return await AgendamentoRepository.findById(id);
}