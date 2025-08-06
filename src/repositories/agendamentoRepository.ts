import db from "@/database";
import { AgendamentosTable, Agendamento, NovoAgendamento } from "@/database/schema";
import { eq, and, or, gt, gte } from "drizzle-orm";

class agendamentoRepository 
{
    async create(data: NovoAgendamento): Promise<Agendamento> {
        try {
            const [agendamento] = await db.insert(AgendamentosTable).values(data).returning();
            return agendamento;
        } catch (error) {
            throw new Error("Erro ao criar agendamento: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Agendamento[]> {
        return await db.select().from(AgendamentosTable);
    }

    async findLimited(limit: number): Promise<Agendamento[]> 
    {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const currentTime = now.toTimeString().slice(0, 5);

        return await db.select().from(AgendamentosTable)
            .where(or(gt(AgendamentosTable.data, today),and(eq(AgendamentosTable.data, today),gte(AgendamentosTable.horario, currentTime))))
            .orderBy(AgendamentosTable.data, AgendamentosTable.horario)
            .limit(limit);
    }

    async findById(id: number): Promise<Agendamento> 
    {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [agendamento] = await db.select().from(AgendamentosTable).where(eq(AgendamentosTable.id, id));
        if (!agendamento) throw new Error("Agendamento não encontrado.");
        return agendamento;
    }

    async findByDate(date: string): Promise<Agendamento[]> 
    {
        if (!date) throw new Error("Data inválida.");
        return await db.select().from(AgendamentosTable).where(eq(AgendamentosTable.data, date));
    }

    async findByProfessionalAndDate(professionalId: number, date: string): Promise<Agendamento[]> 
    {
        if (!professionalId || !date) throw new Error("Profissional ou data inválida.");

        return await db.select().from(AgendamentosTable).where(
        and(
            eq(AgendamentosTable.profissionalId, professionalId),
            eq(AgendamentosTable.data, date)
        )
        );
    }

    async update(id: number, data: Partial<Agendamento>): Promise<Agendamento> {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Agendamento não encontrado.");

        try {
        const [updated] = await db
            .update(AgendamentosTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(AgendamentosTable.id, id))
            .returning();

        return updated;
        } catch (error) {
        throw new Error("Erro ao atualizar agendamento: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Agendamento não encontrado.");

        try {
        await db.delete(AgendamentosTable).where(eq(AgendamentosTable.id, id));
        } catch (error) {
        throw new Error("Erro ao deletar agendamento: " + (error as Error).message);
        }
    }
}

export const AgendamentoRepository = new agendamentoRepository();