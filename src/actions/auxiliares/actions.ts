'use server';

import { AuxiliarRepository } from '@/repositories/auxiliarRepository';
import { NovoAuxiliar, Auxiliar } from '@/database/schema';

export async function createAuxiliarAction(data: NovoAuxiliar): Promise<Auxiliar | null> 
{
  return await AuxiliarRepository.create(data);
}

export async function findAuxiliarById(id: number): Promise<Auxiliar> 
{
  return await AuxiliarRepository.findById(id);
}

export async function findAllAuxiliaresAction(): Promise<Auxiliar[]> 
{
  return await AuxiliarRepository.findAll();
}

export async function doAuxiliarLogin(user: string, senha: string): Promise<Auxiliar>
{
  return await AuxiliarRepository.doLogin(user, senha);
}

export async function updateAuxiliarAction(id: number, data: Partial<Auxiliar>): Promise<Auxiliar>
{
  return await AuxiliarRepository.update(id, data);
}

export async function deleteAuxiliarAction(id: number): Promise<void>
{
  return await AuxiliarRepository.delete(id);
}