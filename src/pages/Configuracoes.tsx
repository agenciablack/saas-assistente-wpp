import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Toast } from '../components/Toast';
import { useAuthStore } from '../stores/authStore';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useToast } from '../hooks/useToast';

export const Configuracoes: React.FC = () => {
  const { user } = useAuthStore();
  const { saving, salvarPreferencias, alterarSenha } = useConfiguracoes();

  // Editable state initialized from user
  const [nome, setNome] = useState('');
  const [notificarNovosLeads, setNotificarNovosLeads] = useState(true);
  const [notificarConversoes, setNotificarConversoes] = useState(true);

  // Password
  const [showSenha, setShowSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Toast
  const { toast, showToast, hideToast } = useToast();

  // Init from user data
  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setNotificarNovosLeads(user.notificar_novos_leads);
      setNotificarConversoes(user.notificar_conversoes);
    }
  }, [user]);

  const handleSalvar = async () => {
    const erro = await salvarPreferencias({
      nome: nome.trim(),
      notificar_novos_leads: notificarNovosLeads,
      notificar_conversoes: notificarConversoes,
    });

    if (erro) {
      showToast('error', erro);
    } else {
      showToast('success', 'Preferencias salvas com sucesso!');
    }
  };

  const handleAlterarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      showToast('error', 'As senhas não coincidem');
      return;
    }

    const erro = await alterarSenha(novaSenha);

    if (erro) {
      showToast('error', erro);
    } else {
      showToast('success', 'Senha alterada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
      setShowSenha(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Configuracoes" />

      <div className="space-y-5">
        {/* Profile */}
        <section className="card-dark p-6">
          <h2 className="text-sm font-semibold text-txt font-display mb-5">Perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                readOnly
                className="input-dark !bg-surface-200/30 !text-txt-muted cursor-not-allowed"
              />
            </div>

            {/* Password */}
            {!showSenha ? (
              <button
                onClick={() => setShowSenha(true)}
                className="text-xs text-accent font-medium hover:text-cyan-300 transition-colors"
              >
                Alterar senha
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-surface-300/15">
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Nova senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="input-dark"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAlterarSenha}
                    disabled={saving || novaSenha.length < 6}
                    className="btn-primary text-[12px] px-4 py-2 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Alterar senha
                  </button>
                  <button
                    onClick={() => { setShowSenha(false); setNovaSenha(''); setConfirmarSenha(''); }}
                    className="text-[12px] text-txt-muted hover:text-txt px-3 py-2 rounded-xl hover:bg-surface-200/30 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="card-dark p-6">
          <h2 className="text-sm font-semibold text-txt font-display mb-5">Preferencias de Notificacao</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-txt">Novos Leads</p>
                <p className="text-[11px] text-txt-dim mt-0.5">Receber alerta quando alguem entrar pelo Instagram</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificarNovosLeads}
                  onChange={(e) => setNotificarNovosLeads(e.target.checked)}
                />
                <div className="w-10 h-5 bg-surface-300/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-txt-dim after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent/30 peer-checked:after:bg-accent"></div>
              </label>
            </div>
            <div className="h-px bg-surface-300/15" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-txt">Conversoes</p>
                <p className="text-[11px] text-txt-dim mt-0.5">Notificar quando alguem entrar no grupo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificarConversoes}
                  onChange={(e) => setNotificarConversoes(e.target.checked)}
                />
                <div className="w-10 h-5 bg-surface-300/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-txt-dim after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent/30 peer-checked:after:bg-accent"></div>
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Alteracoes
          </button>
        </div>
      </div>

      {toast && <Toast toast={toast} onClose={hideToast} />}
    </div>
  );
};
