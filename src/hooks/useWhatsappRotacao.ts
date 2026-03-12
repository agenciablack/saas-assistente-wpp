import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../backend/client';

export interface WhatsappRotacao {
  id: number;
  nome: string;
  numero: string;
  ativo: boolean;
  ordem: number;
  instancia: string;
}

export interface WhatsappRotacaoMensagem {
  id: number;
  mensagem: string;
  ativo: boolean;
  ordem: number;
}

type SupabaseQueryResult = Promise<{ data: unknown; error: { message?: string } | null }>;

type FromLoose = {
  select: (columns?: string) => { order: (column: string, opts?: Record<string, unknown>) => SupabaseQueryResult };
  order: (column: string, opts?: Record<string, unknown>) => SupabaseQueryResult;
  update: (values: Record<string, unknown>) => { eq: (column: string, value: unknown) => SupabaseQueryResult };
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => SupabaseQueryResult;
  delete: () => { eq: (column: string, value: unknown) => SupabaseQueryResult };
};

export function useWhatsappRotacao() {
  const [numeros, setNumeros] = useState<WhatsappRotacao[]>([]);
  const [mensagens, setMensagens] = useState<WhatsappRotacaoMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const fromLoose = (table: string) => supabase.from(table) as unknown as FromLoose;
  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [numerosRes, mensagensRes] = await Promise.all([
        fromLoose('whatsapp_rotacao').select('*').order('ordem', { ascending: true }),
        fromLoose('whatsapp_rotacao_mensagens').select('*').order('ordem', { ascending: true }),
      ]);

      if (numerosRes.error) throw numerosRes.error;
      if (mensagensRes.error) throw mensagensRes.error;

      setNumeros((numerosRes.data as WhatsappRotacao[]) || []);
      setMensagens((mensagensRes.data as WhatsappRotacaoMensagem[]) || []);
    } catch (err) {
      console.error('Erro ao buscar dados de rotação:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleAtivo = useCallback(async (id: number, ativo: boolean): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
      setNumeros((prev) => prev.map((n) => (n.id === id ? { ...n, ativo } : n)));
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao atualizar status');
    }
  }, []);

  const adicionarNumero = useCallback(async (data: Omit<WhatsappRotacao, 'id'>): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao')
        .insert(data as Record<string, unknown>);
      if (error) throw error;
      await fetchData(false);
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao adicionar número');
    }
  }, [fetchData]);

  const editarNumero = useCallback(async (id: number, data: Pick<WhatsappRotacao, 'nome' | 'numero' | 'instancia' | 'ordem'>): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao')
        .update(data as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
      await fetchData(false);
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao editar número');
    }
  }, [fetchData]);

  const excluirNumero = useCallback(async (id: number): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Reordenar os restantes
      const restantes = numeros.filter((n) => n.id !== id).sort((a, b) => a.ordem - b.ordem);
      for (let i = 0; i < restantes.length; i++) {
        const novaOrdem = i + 1;
        if (restantes[i].ordem !== novaOrdem) {
          await fromLoose('whatsapp_rotacao')
            .update({ ordem: novaOrdem })
            .eq('id', restantes[i].id);
        }
      }

      await fetchData(false);
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao excluir número');
    }
  }, [fetchData, numeros]);

  const trocarOrdem = useCallback(async (idA: number, idB: number): Promise<string | null> => {
    try {
      const a = numeros.find((n) => n.id === idA);
      const b = numeros.find((n) => n.id === idB);
      if (!a || !b) return 'Registros não encontrados';

      const [resA, resB] = await Promise.all([
        fromLoose('whatsapp_rotacao').update({ ordem: b.ordem }).eq('id', a.id),
        fromLoose('whatsapp_rotacao').update({ ordem: a.ordem }).eq('id', b.id),
      ]);

      if (resA.error) throw resA.error;
      if (resB.error) throw resB.error;

      // Atualizar local imediatamente
      setNumeros((prev) =>
        prev
          .map((n) => {
            if (n.id === a.id) return { ...n, ordem: b.ordem };
            if (n.id === b.id) return { ...n, ordem: a.ordem };
            return n;
          })
          .sort((x, y) => x.ordem - y.ordem)
      );

      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao reordenar');
    }
  }, [numeros]);

  // ── Mensagens de Abertura CRUD ──

  const toggleAtivoMensagem = useCallback(async (id: number, ativo: boolean): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao_mensagens')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
      setMensagens((prev) => prev.map((m) => (m.id === id ? { ...m, ativo } : m)));
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao atualizar status');
    }
  }, []);

  const adicionarMensagem = useCallback(async (data: Omit<WhatsappRotacaoMensagem, 'id'>): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao_mensagens')
        .insert(data as Record<string, unknown>);
      if (error) throw error;
      await fetchData(false);
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao adicionar mensagem');
    }
  }, [fetchData]);

  const editarMensagem = useCallback(async (id: number, data: Pick<WhatsappRotacaoMensagem, 'mensagem' | 'ordem'>): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao_mensagens')
        .update({ mensagem: data.mensagem, ordem: data.ordem })
        .eq('id', id);
      if (error) throw error;
      await fetchData(false);
      return null;
    } catch (err: unknown) {
      console.error('[editarMensagem] Erro:', err);
      return errorMessage(err, 'Erro ao editar mensagem');
    }
  }, [fetchData]);

  const excluirMensagem = useCallback(async (id: number): Promise<string | null> => {
    try {
      const { error } = await fromLoose('whatsapp_rotacao_mensagens')
        .delete()
        .eq('id', id);
      if (error) throw error;

      const restantes = mensagens.filter((m) => m.id !== id).sort((a, b) => a.ordem - b.ordem);
      for (let i = 0; i < restantes.length; i++) {
        const novaOrdem = i + 1;
        if (restantes[i].ordem !== novaOrdem) {
          await fromLoose('whatsapp_rotacao_mensagens')
            .update({ ordem: novaOrdem })
            .eq('id', restantes[i].id);
        }
      }

      await fetchData(false);
      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao excluir mensagem');
    }
  }, [fetchData, mensagens]);

  const trocarOrdemMensagem = useCallback(async (idA: number, idB: number): Promise<string | null> => {
    try {
      const a = mensagens.find((m) => m.id === idA);
      const b = mensagens.find((m) => m.id === idB);
      if (!a || !b) return 'Registros não encontrados';

      const [resA, resB] = await Promise.all([
        fromLoose('whatsapp_rotacao_mensagens').update({ ordem: b.ordem }).eq('id', a.id),
        fromLoose('whatsapp_rotacao_mensagens').update({ ordem: a.ordem }).eq('id', b.id),
      ]);

      if (resA.error) throw resA.error;
      if (resB.error) throw resB.error;

      setMensagens((prev) =>
        prev
          .map((m) => {
            if (m.id === a.id) return { ...m, ordem: b.ordem };
            if (m.id === b.id) return { ...m, ordem: a.ordem };
            return m;
          })
          .sort((x, y) => x.ordem - y.ordem)
      );

      return null;
    } catch (err: unknown) {
      return errorMessage(err, 'Erro ao reordenar');
    }
  }, [mensagens]);

  return {
    numeros,
    mensagens,
    loading,
    fetchData,
    toggleAtivo,
    adicionarNumero,
    editarNumero,
    excluirNumero,
    trocarOrdem,
    toggleAtivoMensagem,
    adicionarMensagem,
    editarMensagem,
    excluirMensagem,
    trocarOrdemMensagem,
  };
}
