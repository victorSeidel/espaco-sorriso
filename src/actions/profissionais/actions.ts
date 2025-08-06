'use server';

import { ProfissionalRepository } from '@/repositories/profissionalRepository';
import { NovoProfissional, Profissional } from '@/database/schema';

export async function createProfissionalAction(data: NovoProfissional): Promise<Profissional | null> 
{
  return await ProfissionalRepository.create(data);
}

export async function findAllProfissionaisAction(): Promise<Profissional[]> 
{
  return await ProfissionalRepository.findAll();
}

export async function updateProfissionalAction(id: number, data: Partial<Profissional>): Promise<Profissional>
{
  return await ProfissionalRepository.update(id, data);
}

export async function deleteProfissionalAction(id: number): Promise<void>
{
  return await ProfissionalRepository.delete(id);
}