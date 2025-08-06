import db from "@/database";
import { AuxiliaresTable, Auxiliar, NovoAuxiliar } from "@/database/schema";
import { eq } from "drizzle-orm";

class auxiliarRepository 
{
    async create(data: NovoAuxiliar): Promise<Auxiliar> 
    {
        try 
        {
            const [auxiliar] = await db.insert(AuxiliaresTable).values(data).returning();
            return auxiliar;
        } 
        catch (error) 
        {
            throw new Error("Erro ao criar auxiliar: " + (error as Error).message);
        }
    }

    async findAll(): Promise<Auxiliar[]> 
    {
        const usuarios = await db.select().from(AuxiliaresTable);
        return usuarios;
    }

    async findById(id: number): Promise<Auxiliar> 
    {
        if (!id || id <= 0) throw new Error("ID inválido.");

        const [usuario] = await db.select().from(AuxiliaresTable).where(eq(AuxiliaresTable.id, id));
        return usuario;
    }

    async findByUser(user: string): Promise<Auxiliar | null> 
    {
        if (!user) throw new Error("Usuário inválido.");

        const [usuario] = await db.select().from(AuxiliaresTable).where(eq(AuxiliaresTable.usuario, user));
        return usuario || null;
    }

    async doLogin(user: string, senha: string): Promise<Auxiliar> 
    {
        if (!user || !senha) throw new Error("Email e senha são obrigatórios.");

        const usuario = await this.findByUser(user);
        if (!usuario) throw new Error("Credenciais inválidas.");

        const senhaValida = senha === usuario.senha;
        if (!senhaValida) throw new Error("Credenciais inválidas.");

        return usuario;
    }

    async update(id: number, data: Partial<Auxiliar>): Promise<Auxiliar> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para atualização.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Auxiliar não encontrado.");

        try 
        {
            const [updated] = await db.update(AuxiliaresTable).set(data).where(eq(AuxiliaresTable.id, id)).returning();
            return updated;
        } 
        catch (error) 
        {
            throw new Error("Erro ao atualizar auxiliar: " + (error as Error).message);
        }
    }

    async delete(id: number): Promise<void> 
    {
        if (!id || id <= 0) throw new Error("ID inválido para exclusão.");

        const existing = await this.findById(id);
        if (!existing) throw new Error("Auxiliar não encontrado.");

        try 
        {
            await db.delete(AuxiliaresTable).where(eq(AuxiliaresTable.id, id));
        } 
        catch (error) 
        {
            throw new Error("Erro ao deletar auxiliar: " + (error as Error).message);
        }
    }
}

export const AuxiliarRepository = new auxiliarRepository();