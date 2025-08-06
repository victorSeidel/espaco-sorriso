import db from "@/database";
import { TransacoesTable, Transacao, NovaTransacao } from "@/database/schema";
import { sql, eq } from "drizzle-orm";

class TransacaoRepository {
    async create(data: NovaTransacao): Promise<Transacao> {
        try {
            const [transacao] = await db.insert(TransacoesTable).values(data).returning();
            return transacao;
        } catch (error) {
            throw new Error("Erro ao criar transação: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Transacao[]> {
        return await db.select().from(TransacoesTable);
    }

    async findById(id: number): Promise<Transacao> {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [transacao] = await db.select().from(TransacoesTable).where(eq(TransacoesTable.id, id));
        if (!transacao) throw new Error("Transação não encontrada.");
        return transacao;
    }

    async findByProfessional(professionalId: number): Promise<Transacao[]> {
        if (!professionalId || professionalId <= 0) throw new Error("ID do profissional inválido.");

        return await db.select().from(TransacoesTable)
            .where(eq(TransacoesTable.profissionalId, professionalId))
            .orderBy(TransacoesTable.createdAt);
    }

    async update(id: number, data: Partial<Transacao>): Promise<Transacao> {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Transação não encontrada.");

        try {
            const [updated] = await db
                .update(TransacoesTable)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(TransacoesTable.id, id))
                .returning();

            return updated;
        } catch (error) {
            throw new Error("Erro ao atualizar transação: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Transação não encontrada.");

        try {
            await db.delete(TransacoesTable).where(eq(TransacoesTable.id, id));
        } catch (error) {
            throw new Error("Erro ao deletar transação: " + (error as Error).message);
        }
    }

    async getTotalByProfessional(professionalId: number): Promise<number> {
        if (!professionalId || professionalId <= 0) throw new Error("ID do profissional inválido.");

        const result = await db
            .select({ total: sql<number>`sum(${TransacoesTable.valor})` })
            .from(TransacoesTable)
            .where(eq(TransacoesTable.profissionalId, professionalId));

        return result[0]?.total || 0;
    }
}

export const transacaoRepository = new TransacaoRepository();