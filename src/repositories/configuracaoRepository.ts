import db from "@/database";
import { ConfiguracoesTable, Configuracao } from "@/database/schema";
import { eq } from "drizzle-orm";

class configuracaoRepository 
{
    async findByName(nome: string): Promise<Configuracao> 
    {
        if (!nome) throw new Error("Nome inválido.");

        const [configuracao] = await db.select().from(ConfiguracoesTable).where(eq(ConfiguracoesTable.nome, nome));
        return configuracao;
    }

    async update(nome: string, data: Partial<Configuracao>): Promise<Configuracao> 
    {
        if (!nome) throw new Error("Nome inválido para atualização.");

        const existing = await this.findByName(nome);
        if (!existing)
        {
            try 
            {
                const newData = { nome, valor: data.valor ?? "" };
                const [created] = await db.insert(ConfiguracoesTable).values(newData).returning();
                return created;
            } 
            catch (error) 
            {
                throw new Error("Erro ao criar nova configuração: " + (error as Error).message);
            }
        }

        try 
        {
            const [updated] = await db.update(ConfiguracoesTable).set(data).where(eq(ConfiguracoesTable.nome, nome)).returning();
            return updated;
        } 
        catch (error) 
        {
            throw new Error("Erro ao atualizar configuração: " + (error as Error).message);
        }
    }
}

export const ConfiguracaoRepository = new configuracaoRepository();