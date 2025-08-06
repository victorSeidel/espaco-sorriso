import db from "@/database";
import { ProfissionaisTable, Profissional, NovoProfissional } from "@/database/schema";
import { eq } from "drizzle-orm";

class profissionalRepository 
{
    async create(data: NovoProfissional): Promise<Profissional> 
    {
        try 
        {
            const [profissional] = await db.insert(ProfissionaisTable).values(data).returning();
            return profissional;
        } 
        catch (error) 
        {
            throw new Error("Erro ao criar profissional: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Profissional[]> 
    {
        const usuarios = await db.select().from(ProfissionaisTable);
        return usuarios;
    }

    async findById(id: number): Promise<Profissional> 
    {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [usuario] = await db.select().from(ProfissionaisTable).where(eq(ProfissionaisTable.id, id));
        return usuario;
    }

    async update(id: number, data: Partial<Profissional>): Promise<Profissional> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Profissional não encontrado.");

        try 
        {
            const [updated] = await db.update(ProfissionaisTable).set(data).where(eq(ProfissionaisTable.id, id)).returning();
            return updated;
        } 
        catch (error) 
        {
            throw new Error("Erro ao atualizar profissional: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Profissional não encontrado.");

        try 
        {
            await db.delete(ProfissionaisTable).where(eq(ProfissionaisTable.id, id));
        } 
        catch (error) 
        {
            throw new Error("Erro ao deletar profissional: " + (error as Error).message);
        }
    }
}

export const ProfissionalRepository = new profissionalRepository();