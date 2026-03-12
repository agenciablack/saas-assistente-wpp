import { Lead, MetricaDiaria, Notificacao } from "../types";
import { subDays, subHours, subMinutes, formatISO } from "date-fns";

const now = new Date();

// Gerador de datas relativas
const getRelativeDate = (days: number, hours: number = 0, minutes: number = 0) => {
  const date = subMinutes(subHours(subDays(now, days), hours), minutes);
  return formatISO(date);
};

export const mockLeads: Lead[] = [
  // HOJE (15 leads variados)
  {
    id: "1",
    telefone: "5511999991001",
    nome: "Ana Souza",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 0, 15),
    status: "primeiro_audio_enviado",
    ultima_interacao: getRelativeDate(0, 0, 15),
    saudacao_enviada: "boa_tarde",
    followup_enviado: null,
    resposta_comunidade: null,
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: null
  },
  {
    id: "2",
    telefone: "5511999991002",
    nome: null,
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 1, 30),
    status: "primeiro_audio_enviado",
    ultima_interacao: getRelativeDate(0, 1, 30),
    saudacao_enviada: "boa_tarde",
    followup_enviado: null,
    resposta_comunidade: null,
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: null
  },
  {
    id: "3",
    telefone: "5521988882001",
    nome: "Carlos Lima",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 2, 0),
    status: "convite_enviado",
    ultima_interacao: getRelativeDate(0, 1, 50),
    saudacao_enviada: "boa_tarde",
    followup_enviado: null,
    resposta_comunidade: null,
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: null
  },
  {
    id: "4",
    telefone: "5531977773001",
    nome: "Beatriz M.",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 3, 0),
    status: "interessado",
    ultima_interacao: getRelativeDate(0, 2, 45),
    saudacao_enviada: "bom_dia",
    followup_enviado: null,
    resposta_comunidade: "sim",
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: "Perguntou sobre horário das lives"
  },
  {
    id: "5",
    telefone: "5541966664001",
    nome: "João Pedro",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 4, 0),
    status: "no_grupo",
    ultima_interacao: getRelativeDate(0, 3, 30),
    saudacao_enviada: "bom_dia",
    followup_enviado: null,
    resposta_comunidade: "sim",
    link_enviado_em: getRelativeDate(0, 3, 40),
    entrou_no_grupo: getRelativeDate(0, 3, 30),
    observacoes: null
  },
  {
    id: "6",
    telefone: "5551955555001",
    nome: "Fernanda K.",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 5, 0),
    status: "link_enviado",
    ultima_interacao: getRelativeDate(0, 4, 50),
    saudacao_enviada: "bom_dia",
    followup_enviado: null,
    resposta_comunidade: "sim",
    link_enviado_em: getRelativeDate(0, 4, 50),
    entrou_no_grupo: null,
    observacoes: null
  },
  // Leads sem resposta (para KPI)
  {
    id: "7",
    telefone: "5511944446001",
    nome: null,
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 6, 0),
    status: "primeiro_audio_enviado",
    ultima_interacao: getRelativeDate(0, 6, 0), // > 2h sem resposta
    saudacao_enviada: "bom_dia",
    followup_enviado: null,
    resposta_comunidade: null,
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: null
  },
  {
    id: "8",
    telefone: "5511933337001",
    nome: "Marcos",
    origem: "instagram",
    data_primeiro_contato: getRelativeDate(0, 7, 0),
    status: "convite_enviado",
    ultima_interacao: getRelativeDate(0, 6, 50), // > 2h sem resposta
    saudacao_enviada: "bom_dia",
    followup_enviado: null,
    resposta_comunidade: null,
    link_enviado_em: null,
    entrou_no_grupo: null,
    observacoes: null
  },
  // Mais leads de hoje para volume
  { id: "9", telefone: "5511922228001", nome: "Lucas", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 1), status: "no_grupo", ultima_interacao: getRelativeDate(0, 0, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 0, 40), entrou_no_grupo: getRelativeDate(0, 0, 30), observacoes: null },
  { id: "10", telefone: "5511911119001", nome: "Julia", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 2), status: "nao_interessado", ultima_interacao: getRelativeDate(0, 1, 50), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: "Disse que não tem tempo" },
  { id: "11", telefone: "5511900001001", nome: "Roberto", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 3), status: "link_enviado", ultima_interacao: getRelativeDate(0, 2, 50), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 2, 50), entrou_no_grupo: null, observacoes: null },
  { id: "12", telefone: "5511999992002", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(0, 4), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(0, 4), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "13", telefone: "5511988883003", nome: "Carla", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 5), status: "no_grupo", ultima_interacao: getRelativeDate(0, 4, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 4, 40), entrou_no_grupo: getRelativeDate(0, 4, 30), observacoes: null },
  { id: "14", telefone: "5511977774004", nome: "Pedro", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 6), status: "sem_resposta", ultima_interacao: getRelativeDate(0, 6), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(0, 2), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: "Follow-up enviado" },
  { id: "15", telefone: "5511966665005", nome: "Mariana", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 7), status: "interessado", ultima_interacao: getRelativeDate(0, 6, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },

  // ONTEM (10 leads)
  { id: "16", telefone: "5511955556006", nome: "Ricardo", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 10), status: "no_grupo", ultima_interacao: getRelativeDate(1, 9), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 9, 10), entrou_no_grupo: getRelativeDate(1, 9), observacoes: null },
  { id: "17", telefone: "5511944447007", nome: "Sofia", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 11), status: "sem_resposta", ultima_interacao: getRelativeDate(1, 11), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(0, 10), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "18", telefone: "5511933338008", nome: "Bruno", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 12), status: "nao_interessado", ultima_interacao: getRelativeDate(1, 11, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "19", telefone: "5511922229009", nome: "Aline", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 13), status: "no_grupo", ultima_interacao: getRelativeDate(1, 12), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 12, 10), entrou_no_grupo: getRelativeDate(1, 12), observacoes: null },
  { id: "20", telefone: "5511911110010", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(1, 14), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(1, 14), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "21", telefone: "5511900001011", nome: "Gustavo", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 15), status: "convite_enviado", ultima_interacao: getRelativeDate(1, 14, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "22", telefone: "5511999992012", nome: "Camila", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 16), status: "link_enviado", ultima_interacao: getRelativeDate(1, 15, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 15, 30), entrou_no_grupo: null, observacoes: null },
  { id: "23", telefone: "5511988883013", nome: "Felipe", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 17), status: "interessado", ultima_interacao: getRelativeDate(1, 16, 30), saudacao_enviada: "boa_noite", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "24", telefone: "5511977774014", nome: "Larissa", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 18), status: "no_grupo", ultima_interacao: getRelativeDate(1, 17), saudacao_enviada: "boa_noite", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 17, 10), entrou_no_grupo: getRelativeDate(1, 17), observacoes: null },
  { id: "25", telefone: "5511966665015", nome: "Diego", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 19), status: "sem_resposta", ultima_interacao: getRelativeDate(1, 19), saudacao_enviada: "boa_noite", followup_enviado: getRelativeDate(0, 9), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },

  // ANTEONTEM (5 leads)
  { id: "26", telefone: "5511955556016", nome: "Patrícia", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 10), status: "no_grupo", ultima_interacao: getRelativeDate(2, 9), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 9, 10), entrou_no_grupo: getRelativeDate(2, 9), observacoes: null },
  { id: "27", telefone: "5511944447017", nome: "Rodrigo", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 11), status: "nao_interessado", ultima_interacao: getRelativeDate(2, 10, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "28", telefone: "5511933338018", nome: "Vanessa", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 12), status: "sem_resposta", ultima_interacao: getRelativeDate(2, 12), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(1, 10), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "29", telefone: "5511922229019", nome: "Thiago", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 13), status: "no_grupo", ultima_interacao: getRelativeDate(2, 12), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 12, 10), entrou_no_grupo: getRelativeDate(2, 12), observacoes: null },
  { id: "30", telefone: "5511911110020", nome: "Letícia", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 14), status: "link_enviado", ultima_interacao: getRelativeDate(2, 13, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 13, 30), entrou_no_grupo: null, observacoes: null },
];

export const mockNotificacoes: Notificacao[] = [
  { id: "1", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-1001 entrou pelo Instagram", data: getRelativeDate(0, 0, 15), lida: false },
  { id: "2", tipo: "interesse", mensagem: "Beatriz M. demonstrou interesse na comunidade", data: getRelativeDate(0, 2, 45), lida: false },
  { id: "3", tipo: "conversao", mensagem: "João Pedro entrou no grupo!", data: getRelativeDate(0, 3, 30), lida: false },
  { id: "4", tipo: "alerta", mensagem: "2 leads sem resposta há mais de 2 horas", data: getRelativeDate(0, 4, 0), lida: true },
  { id: "5", tipo: "conversao", mensagem: "Lucas entrou no grupo!", data: getRelativeDate(0, 0, 30), lida: true },
  { id: "6", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-2002 entrou pelo Instagram", data: getRelativeDate(0, 4, 0), lida: true },
  { id: "7", tipo: "interesse", mensagem: "Mariana demonstrou interesse na comunidade", data: getRelativeDate(0, 6, 30), lida: true },
  { id: "8", tipo: "conversao", mensagem: "Carla entrou no grupo!", data: getRelativeDate(0, 4, 30), lida: true },
  { id: "9", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-3003 entrou pelo Instagram", data: getRelativeDate(0, 5, 0), lida: true },
  { id: "10", tipo: "alerta", mensagem: "Falta enviar follow-up para 3 leads", data: getRelativeDate(0, 8, 0), lida: true },
];

// 30 days of metric data with realistic variation
const generateMetrics = (): MetricaDiaria[] => {
  const metrics: MetricaDiaria[] = [];
  for (let i = 29; i >= 0; i--) {
    // Base values with weekly pattern (weekends lower)
    const dayOfWeek = subDays(now, i).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseLeads = isWeekend ? 6 : 14;

    // Add some randomness with a seed-like approach based on day index
    const variance = Math.sin(i * 2.7 + 1.3) * 5;
    const trend = Math.max(0, (30 - i) * 0.15); // slight upward trend over time

    const leads_total = Math.max(3, Math.round(baseLeads + variance + trend));
    const responderam = Math.max(1, Math.round(leads_total * (0.65 + Math.sin(i * 1.5) * 0.15)));
    const interessados = Math.max(1, Math.round(responderam * (0.7 + Math.sin(i * 3.1) * 0.1)));
    const no_grupo = Math.max(0, Math.round(interessados * (0.55 + Math.sin(i * 4.2) * 0.15)));

    metrics.push({
      data: getRelativeDate(i),
      leads_total,
      responderam,
      interessados,
      no_grupo,
    });
  }
  return metrics;
};

export const mockMetricasDiarias: MetricaDiaria[] = generateMetrics();
