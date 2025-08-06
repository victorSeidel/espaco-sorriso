import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, integer, text, timestamp, date, numeric } from "drizzle-orm/pg-core"

export const ProfissionaisTable = pgTable('profissionais', 
{
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	nome: text('nome').notNull(),
	especialidade: text('especialidade').notNull(),
	registro: text('registro').notNull(),
	telefone: text('telefone').notNull(),
	email: text('email').notNull(),
	horarioTrabalho: text('horario_trabalho'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Profissional     = InferSelectModel<typeof ProfissionaisTable>;
export type NovoProfissional = InferInsertModel<typeof ProfissionaisTable>;

export const AuxiliaresTable = pgTable('auxiliares', 
{
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	nome: text('nome').notNull(),
	usuario: text('usuario').notNull(),
	telefone: text('telefone').notNull(),
	email: text('email').notNull(),
	senha: text('senha').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Auxiliar     = InferSelectModel<typeof AuxiliaresTable>;
export type NovoAuxiliar = InferInsertModel<typeof AuxiliaresTable>;

export const PacientesTable = pgTable('pacientes', 
{
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	asaasId: text('asaas_id').notNull(),
	nome: text('nome').notNull(),
	cpf: text('cpf').notNull().unique(),
	telefone: text('telefone').notNull(),
	email: text('email').notNull(),
	dataNascimento: date('data_nascimento').notNull(),
	cep: text('cep').notNull(),
	endereco: text('endereco'),
	status: text('status').notNull().default('ativo'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Paciente     = InferSelectModel<typeof PacientesTable>;
export type NovoPaciente = InferInsertModel<typeof PacientesTable>;

export const ConfiguracoesTable = pgTable('configuracoes', 
{
	nome: text('nome').primaryKey().notNull(),
	valor: text('valor').notNull(),
});

export type Configuracao     = InferSelectModel<typeof ConfiguracoesTable>;
export type NovaConfiguracao = InferInsertModel<typeof ConfiguracoesTable>;

export const AgendamentosTable = pgTable("agendamentos", 
{
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	pacienteId: integer("paciente_id").notNull().references(() => PacientesTable.id),
	profissionalId: integer("profissional_id").notNull().references(() => ProfissionaisTable.id),
	data: date("data").notNull(),
	horario: text("horario").notNull(),
	servico: text("servico").notNull(),
	valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
	metodoPagamento: text("metodo_pagamento").notNull(),
	status: text("status").notNull().default("pendente"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Agendamento     = InferSelectModel<typeof AgendamentosTable>;
export type NovoAgendamento = InferInsertModel<typeof AgendamentosTable>;

export const TransacoesTable = pgTable("transacoes",
{
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	profissionalId: integer("profissional_id").notNull().references(() => ProfissionaisTable.id),
	tipo: text("tipo").notNull(),
	descricao: text("descricao").notNull(),
	valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
	metodoPagamento: text("metodo_pagamento").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transacao     = InferSelectModel<typeof TransacoesTable>;
export type NovaTransacao = InferInsertModel<typeof TransacoesTable>;

export const CaixasTable = pgTable("caixas",
{
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	abertura: numeric("abertura", { precision: 10, scale: 2 }).notNull(),
	entradas: numeric("entradas", { precision: 10, scale: 2 }).notNull(),
	saidas: numeric("saidas", { precision: 10, scale: 2 }).notNull(),
	fechamento: numeric("fechamento", { precision: 10, scale: 2 }).notNull(),
	status: text("status").notNull().default("pendente"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Caixa     = InferSelectModel<typeof CaixasTable>;
export type NovoCaixa = InferInsertModel<typeof CaixasTable>;