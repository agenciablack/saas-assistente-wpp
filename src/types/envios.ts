export interface Template {
  id: string;
  nome: string;
  tipo: "texto" | "audio";
  mensagem_com_nome: string;
  mensagem_sem_nome: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoEnvio {
  id: string;
  data_envio: string;
  tipo: "texto" | "audio";
  mensagem_com_nome: string;
  mensagem_sem_nome: string;
  status_selecionados: string[];
  periodo_inicio: string | null;
  periodo_fim: string | null;
  total_leads: number;
  leads_com_nome: number;
  leads_sem_nome: number;
  template_id: string | null;
}

export interface EnvioConfig {
  status_selecionados: string[];
  periodo_inicio: string | null;
  periodo_fim: string | null;
  tipo: "texto" | "audio";
  mensagem_com_nome: string;
  mensagem_sem_nome: string;
  delay_segundos: number;
}

export interface EnvioProgresso {
  total: number;
  enviados: number;
  erros: number;
  atual: {
    id: string;
    telefone: string;
    nome: string | null;
  } | null;
  status: "preparando" | "enviando" | "concluido" | "erro";
  log: EnvioLog[];
}

export interface EnvioLog {
  lead_id: string;
  telefone: string;
  nome: string | null;
  status: "aguardando" | "enviando" | "sucesso" | "erro";
  erro_mensagem?: string;
  timestamp?: string;
}
