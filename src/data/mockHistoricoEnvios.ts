import { HistoricoEnvio } from "../types/envios";

export const mockHistoricoEnvios: HistoricoEnvio[] = [
  {
    id: "1",
    data_envio: "2025-02-15T14:32:00Z",
    tipo: "texto",
    mensagem_com_nome: "Olá, {{nome}}! \ud83d\udd34 Hoje tem live às 20h na comunidade. Não perde! Te espero lá.",
    mensagem_sem_nome: "Olá! \ud83d\udd34 Hoje tem live às 20h na comunidade. Não perde! Te espero lá.",
    status_selecionados: ["interessado", "link_enviado"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 47,
    leads_com_nome: 32,
    leads_sem_nome: 15,
    template_id: "1"
  },
  {
    id: "2",
    data_envio: "2025-02-14T10:15:00Z",
    tipo: "audio",
    mensagem_com_nome: "Fala, {{nome}}! Passou na live ontem? Teve conteúdo muito bom!",
    mensagem_sem_nome: "Fala! Passou na live ontem? Teve conteúdo muito bom!",
    status_selecionados: ["primeiro_audio_enviado"],
    periodo_inicio: "2025-02-07",
    periodo_fim: "2025-02-14",
    total_leads: 23,
    leads_com_nome: 18,
    leads_sem_nome: 5,
    template_id: null
  },
  {
    id: "3",
    data_envio: "2025-02-13T09:00:00Z",
    tipo: "texto",
    mensagem_com_nome: "Bom dia, {{nome}}! Só passando pra lembrar da live de hoje às 20h. Vai ter sorteio!",
    mensagem_sem_nome: "Bom dia! Só passando pra lembrar da live de hoje às 20h. Vai ter sorteio!",
    status_selecionados: ["no_grupo"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 89,
    leads_com_nome: 67,
    leads_sem_nome: 22,
    template_id: null
  },
  {
    id: "4",
    data_envio: "2025-02-12T18:45:00Z",
    tipo: "texto",
    mensagem_com_nome: "E aí, {{nome}}! Sumiu, hein? \ud83d\ude05 Tô fazendo lives todos os dias com conteúdo novo. Bora participar?",
    mensagem_sem_nome: "E aí! Sumiu, hein? \ud83d\ude05 Tô fazendo lives todos os dias com conteúdo novo. Bora participar?",
    status_selecionados: ["sem_resposta", "nao_interessado"],
    periodo_inicio: "2025-01-01",
    periodo_fim: "2025-02-10",
    total_leads: 34,
    leads_com_nome: 21,
    leads_sem_nome: 13,
    template_id: "2"
  },
  {
    id: "5",
    data_envio: "2025-02-10T11:30:00Z",
    tipo: "audio",
    mensagem_com_nome: "{{nome}}, tudo bem? O Allan tá liberando conteúdo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    mensagem_sem_nome: "Tudo bem? O Allan tá liberando conteúdo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    status_selecionados: ["convite_enviado", "interessado"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 56,
    leads_com_nome: 41,
    leads_sem_nome: 15,
    template_id: "4"
  }
];
