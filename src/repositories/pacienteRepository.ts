import db from "@/database";
import { PacientesTable, Paciente, NovoPaciente } from "@/database/schema";
import { eq } from "drizzle-orm";

class pacienteRepository 
{
    async create(data: NovoPaciente): Promise<Paciente> 
    {
        try 
        {
            const [paciente] = await db.insert(PacientesTable).values(data).returning();
            return paciente;
        } 
        catch (error) 
        {
            throw new Error("Erro ao criar paciente: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Paciente[]> 
    {
        const usuarios = await db.select().from(PacientesTable);
        return usuarios;
    }

    async findById(id: number): Promise<Paciente> 
    {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [usuario] = await db.select().from(PacientesTable).where(eq(PacientesTable.id, id));
        return usuario;
    }

    async findByEmail(email: string): Promise<Paciente | null> 
    {
        if (!email) throw new Error("Email inválido.");

        const [usuario] = await db.select().from(PacientesTable).where(eq(PacientesTable.email, email));
        return usuario || null;
    }

    async update(id: number, data: Partial<Paciente>): Promise<Paciente> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Paciente não encontrado.");

        try 
        {
            const [updated] = await db.update(PacientesTable).set(data).where(eq(PacientesTable.id, id)).returning();
            return updated;
        } 
        catch (error) 
        {
            throw new Error("Erro ao atualizar paciente: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Paciente não encontrado.");

        try 
        {
            await db.delete(PacientesTable).where(eq(PacientesTable.id, id));
        } 
        catch (error) 
        {
            throw new Error("Erro ao deletar paciente: " + (error as Error).message);
        }
    }
}

export const PacienteRepository = new pacienteRepository();