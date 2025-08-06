import db from "@/database";
import { CaixasTable, Caixa, NovoCaixa } from "@/database/schema";
import { eq, and, gte, lte } from "drizzle-orm";

class caixaRepository {
    async create(data: NovoCaixa): Promise<Caixa> {
        try {
            const [caixa] = await db.insert(CaixasTable).values(data).returning();
            return caixa;
        } catch (error) {
            throw new Error("Erro ao criar registro de caixa: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Caixa[]> {
        return await db.select().from(CaixasTable).orderBy(CaixasTable.createdAt);
    }

    async findById(id: number): Promise<Caixa> {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [caixa] = await db.select().from(CaixasTable).where(eq(CaixasTable.id, id));
        if (!caixa) throw new Error("Registro de caixa não encontrado.");
        return caixa;
    }

    async findByStatus(status: string): Promise<Caixa[]> {
        if (!status) throw new Error("Status inválido.");
        return await db.select().from(CaixasTable).where(eq(CaixasTable.status, status));
    }

    async findLastOpened(): Promise<Caixa | null> {
        const [caixa] = await db.select()
            .from(CaixasTable)
            .where(eq(CaixasTable.status, "aberto"))
            .orderBy(CaixasTable.createdAt)
            .limit(1);
        
        return caixa || null;
    }
    async findByDate(date: Date): Promise<Caixa[]> 
    {
        if (!date) throw new Error("Data inválida.");

        const { start, end } = getDateRangeInTimezone(date, -3); 

        return await db.select().from(CaixasTable)
            .where(and(
                gte(CaixasTable.createdAt, start),
                lte(CaixasTable.createdAt, end)
            ))
            .orderBy(CaixasTable.createdAt);
    }

    async update(id: number, data: Partial<Caixa>): Promise<Caixa> {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Registro de caixa não encontrado.");

        try {
            const [updated] = await db
                .update(CaixasTable)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(CaixasTable.id, id))
                .returning();

            return updated;
        } catch (error) {
            throw new Error("Erro ao atualizar registro de caixa: " + (error as Error).message);
        }
    }

    async close(id: number, fechamento: number): Promise<Caixa> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para fechamento.");
        if (!fechamento) throw new Error("Valor de fechamento inválido.");

        const fechamentoValue = Number(fechamento).toFixed(2);

        try {
            const [updated] = await db
                .update(CaixasTable)
                .set({ 
                    fechamento: fechamentoValue,
                    status: "fechado",
                    updatedAt: new Date() 
                })
                .where(eq(CaixasTable.id, id))
                .returning();

            return updated;
        } catch (error) {
            throw new Error("Erro ao fechar caixa: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Registro de caixa não encontrado.");

        try {
            await db.delete(CaixasTable).where(eq(CaixasTable.id, id));
        } catch (error) {
            throw new Error("Erro ao deletar registro de caixa: " + (error as Error).message);
        }
    }
}

function getDateRangeInTimezone(date: Date, timezoneOffset: number = -3) 
{
    const utcDate = new Date(date);

    const start = new Date(utcDate);
    start.setUTCHours(0 - timezoneOffset, 0, 0, 0);

    const end = new Date(utcDate);
    end.setUTCHours(23 - timezoneOffset, 59, 59, 999);

    return { start, end };
}

export const CaixaRepository = new caixaRepository();