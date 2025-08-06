CREATE TABLE profissionais (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    registro TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    horario_trabalho TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auxiliares (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    asaas_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    cep TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE configuracoes (
    nome TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
);

CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    data DATE NOT NULL,
    horario TEXT NOT NULL,
    servico TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    metodo_pagamento TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    metodo_pagamento TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE caixas (
    id SERIAL PRIMARY KEY,
    abertura NUMERIC(10,2) NOT NULL,
    entradas NUMERIC(10,2) NOT NULL,
    saidas NUMERIC(10,2) NOT NULL,
    fechamento NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);