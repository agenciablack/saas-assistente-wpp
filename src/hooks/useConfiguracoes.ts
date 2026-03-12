import { useState, useCallback } from 'react';
import { supabase } from '../backend/client';
import { useAuthStore } from '../stores/authStore';

interface PreferenciasUpdate {
  nome: string;
  notificar_novos_leads: boolean;
  notificar_conversoes: boolean;
}

interface UseConfiguracoesReturn {
  saving: boolean;
  salvarPreferencias: (data: PreferenciasUpdate) => Promise<string | null>;
  alterarSenha: (novaSenha: string) => Promise<string | null>;
}

export function useConfiguracoes(): UseConfiguracoesReturn {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const salvarPreferencias = useCallback(async (data: PreferenciasUpdate): Promise<string | null> => {
    if (!user) return 'Usuário não autenticado';

    try {
      setSaving(true);

      const { error } = await supabase
        .from('dashboard_users')
        .update({
          nome: data.nome,
          notificar_novos_leads: data.notificar_novos_leads,
          notificar_conversoes: data.notificar_conversoes,
        } as Record<string, unknown>)
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      return null;
    } catch (err: any) {
      console.error('Erro ao salvar preferências:', err);
      return err.message || 'Erro ao salvar preferências';
    } finally {
      setSaving(false);
    }
  }, [user]);

  const alterarSenha = useCallback(async (novaSenha: string): Promise<string | null> => {
    if (novaSenha.length < 6) return 'A senha deve ter pelo menos 6 caracteres';

    try {
      setSaving(true);

      return 'Alteração de senha indisponível nesta versão';
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      return err.message || 'Erro ao alterar senha';
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, salvarPreferencias, alterarSenha };
}
