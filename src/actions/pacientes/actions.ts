'use server';

import { PacienteRepository } from '@/repositories/pacienteRepository';
import { NovoPaciente, Paciente } from '@/database/schema';

// Criar novo paciente
export async function createPacienteAction(data: NovoPaciente): Promise<Paciente | null> {
  try {
    return await PacienteRepository.create(data);
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return null;
  }
}

// Buscar todos os pacientes
export async function findAllPacientesAction(): Promise<Paciente[]> {
  try {
    return await PacienteRepository.findAll();
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
}

// Buscar paciente por ID
export async function findPacienteByIdAction(id: number): Promise<Paciente | null> {
  try {
    return await PacienteRepository.findById(id);
  } catch (error) {
    console.error("Erro ao buscar paciente por ID:", error);
    return null;
  }
}

// Buscar paciente por e-mail
export async function findPacienteByEmailAction(email: string): Promise<Paciente | null> {
  try {
    return await PacienteRepository.findByEmail(email);
  } catch (error) {
    console.error("Erro ao buscar paciente por email:", error);
    return null;
  }
}

// Atualizar paciente
export async function updatePacienteAction(id: number, data: Partial<Paciente>): Promise<Paciente | null> {
  try {
    return await PacienteRepository.update(id, data);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return null;
  }
}

// Deletar paciente
export async function deletePacienteAction(id: number): Promise<boolean> {
  try {
    await PacienteRepository.delete(id);
    return true;
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    return false;
  }
}
