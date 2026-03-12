import { Template } from "../types/envios";

export const mockTemplates: Template[] = [
  {
    id: "1",
    nome: "Lembrete de Live",
    tipo: "texto",
    mensagem_com_nome: "Olá, {{nome}}! \ud83d\udd34 Hoje tem live às 20h na comunidade. Não perde! Te espero lá.",
    mensagem_sem_nome: "Olá! \ud83d\udd34 Hoje tem live às 20h na comunidade. Não perde! Te espero lá.",
    created_at: "2025-02-10T10:00:00Z",
    updated_at: "2025-02-10T10:00:00Z"
  },
  {
    id: "2",
    nome: "Reengajamento",
    tipo: "texto",
    mensagem_com_nome: "E aí, {{nome}}! Sumiu, hein? \ud83d\ude05 Tô fazendo lives todos os dias com conteúdo novo. Bora participar?",
    mensagem_sem_nome: "E aí! Sumiu, hein? \ud83d\ude05 Tô fazendo lives todos os dias com conteúdo novo. Bora participar?",
    created_at: "2025-02-08T14:30:00Z",
    updated_at: "2025-02-08T14:30:00Z"
  },
  {
    id: "3",
    nome: "Boas vindas atrasadas",
    tipo: "audio",
    mensagem_com_nome: "Fala, {{nome}}! Vi que você chegou pelo Instagram mas a gente ainda não conversou direito. Tô fazendo lives gratuitas todo dia, quer participar?",
    mensagem_sem_nome: "Fala! Vi que você chegou pelo Instagram mas a gente ainda não conversou direito. Tô fazendo lives gratuitas todo dia, quer participar?",
    created_at: "2025-02-05T09:00:00Z",
    updated_at: "2025-02-05T09:00:00Z"
  },
  {
    id: "4",
    nome: "Convite Comunidade",
    tipo: "texto",
    mensagem_com_nome: "{{nome}}, tudo bem? O Allan tá liberando conteúdo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    mensagem_sem_nome: "Tudo bem? O Allan tá liberando conteúdo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    created_at: "2025-02-03T16:00:00Z",
    updated_at: "2025-02-03T16:00:00Z"
  }
];
