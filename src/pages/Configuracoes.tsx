import React, { useState, useEffect } from 'react';
import { Loader2, FlaskConical } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Toast } from '../components/Toast';
import { useAuthStore } from '../stores/authStore';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useToast } from '../hooks/useToast';

function generateHex(length: number, uppercase = false): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
  return uppercase ? hex.toUpperCase() : hex;
}

function formatPhoneWithSpaces(phone: string): string {
  // Expects format like 5524992136800 → "+55 24 99213-6800"
  const ddi = phone.slice(0, 2);
  const ddd = phone.slice(2, 4);
  const part1 = phone.slice(4, 9);
  const part2 = phone.slice(9);
  return `+${ddi} ${ddd} ${part1}-${part2}`;
}

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

  // Simulator
  const [simTelefone, setSimTelefone] = useState('');
  const [simNome, setSimNome] = useState('');
  const [simToken, setSimToken] = useState('');
  const [simMensagem, setSimMensagem] = useState('');
  const [simEnviando, setSimEnviando] = useState(false);

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

  const handleSimular = async () => {
    const telefoneNumeros = simTelefone.replace(/\D/g, '');
    if (telefoneNumeros.length < 12) {
      showToast('error', 'Telefone deve ter no mínimo 12 dígitos (DDI+DDD+número)');
      return;
    }
    if (!simToken.trim()) {
      showToast('error', 'O token da instância é obrigatório');
      return;
    }
    if (!simMensagem.trim()) {
      showToast('error', 'A mensagem é obrigatória');
      return;
    }

    setSimEnviando(true);
    try {
      const timestamp = Date.now();
      const leadName = simNome.trim() || 'Lead Teste';
      const owner = '5500000000000';
      const chatId = `r${generateHex(16)}`;
      const msgIdHex1 = generateHex(20, true);
      const msgIdHex2 = generateHex(20, true);
      const mensagem = simMensagem.trim();

      const webhookUrl = 'http://187.77.61.4:5678/webhook/assistente-whatsapp';
      const payload = {
        BaseUrl: 'https://pedrooberlaender.uazapi.com',
        EventType: 'messages',
        chat: {
          chatbot_agentResetMemoryAt: 0,
          chatbot_disableUntil: 0,
          chatbot_lastTriggerAt: 0,
          chatbot_lastTrigger_id: '',
          id: chatId,
          image: '',
          imagePreview: '',
          lead_assignedAttendant_id: '',
          lead_email: '',
          lead_field01: '', lead_field02: '', lead_field03: '', lead_field04: '', lead_field05: '',
          lead_field06: '', lead_field07: '', lead_field08: '', lead_field09: '', lead_field10: '',
          lead_field11: '', lead_field12: '', lead_field13: '', lead_field14: '', lead_field15: '',
          lead_field16: '', lead_field17: '', lead_field18: '', lead_field19: '', lead_field20: '',
          lead_fullName: '',
          lead_isTicketOpen: false,
          lead_kanbanOrder: 0,
          lead_name: '',
          lead_notes: '',
          lead_personalid: '',
          lead_status: '',
          lead_tags: [],
          name: leadName,
          owner,
          phone: formatPhoneWithSpaces(telefoneNumeros),
          wa_archived: false,
          wa_chatid: `${telefoneNumeros}@s.whatsapp.net`,
          wa_chatlid: '',
          wa_contactName: leadName,
          wa_ephemeralExpiration: 0,
          wa_fastid: `${owner}:${telefoneNumeros}`,
          wa_isBlocked: false,
          wa_isGroup: false,
          wa_isGroup_admin: false,
          wa_isGroup_announce: false,
          wa_isGroup_community: false,
          wa_isGroup_member: false,
          wa_isPinned: false,
          wa_label: [],
          wa_lastMessageSender: '',
          wa_lastMessageTextVote: mensagem,
          wa_lastMessageType: 'Conversation',
          wa_lastMsgTimestamp: timestamp,
          wa_muteEndTime: 0,
          wa_name: leadName,
          wa_unreadCount: 1,
        },
        chatSource: 'updated',
        instanceName: 'simulador',
        message: {
          buttonOrListid: '',
          chatid: `${telefoneNumeros}@s.whatsapp.net`,
          chatlid: '',
          content: mensagem,
          convertOptions: '',
          edited: '',
          fromMe: false,
          groupName: 'Unknown',
          id: `${owner}:${msgIdHex1}`,
          isGroup: false,
          mediaType: '',
          messageTimestamp: timestamp,
          messageType: 'Conversation',
          messageid: msgIdHex2,
          owner,
          quoted: '',
          reaction: '',
          sender: '',
          senderName: leadName,
          sender_lid: '',
          sender_pn: `${telefoneNumeros}@s.whatsapp.net`,
          source: 'unknown',
          status: '',
          text: mensagem,
          track_id: '',
          track_source: '',
          type: 'text',
          vote: '',
          wasSentByApi: false,
        },
        owner,
        token: simToken.trim(),
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      showToast('success', 'Mensagem simulada enviada com sucesso!');
      setSimMensagem('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', `Erro ao simular: ${msg}`);
    } finally {
      setSimEnviando(false);
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

        {/* Webhook Simulator */}
        <section className="card-dark p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-txt font-display flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              Simulador de Mensagem
            </h2>
            <p className="text-[11px] text-txt-dim mt-1">Simule uma mensagem como se tivesse vindo pelo WhatsApp</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Telefone do Lead *</label>
              <input
                type="text"
                value={simTelefone}
                onChange={(e) => setSimTelefone(e.target.value.replace(/\D/g, ''))}
                placeholder="5511999999999"
                className="input-dark"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Nome do Lead (pushName)</label>
              <input
                type="text"
                value={simNome}
                onChange={(e) => setSimNome(e.target.value)}
                placeholder="Nome que aparece no WhatsApp"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Token da Instância *</label>
              <input
                type="text"
                value={simToken}
                onChange={(e) => setSimToken(e.target.value)}
                placeholder="Ex: df650d4b-9618-4eff-8111-e953730eeb25"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Mensagem *</label>
              <textarea
                value={simMensagem}
                onChange={(e) => setSimMensagem(e.target.value)}
                placeholder="Digite a mensagem que o lead enviaria..."
                rows={3}
                className="input-dark resize-none"
              />
            </div>
            <button
              onClick={handleSimular}
              disabled={simEnviando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: simEnviando ? '#065f46' : '#10b981' }}
              onMouseEnter={(e) => { if (!simEnviando) e.currentTarget.style.background = '#059669'; }}
              onMouseLeave={(e) => { if (!simEnviando) e.currentTarget.style.background = '#10b981'; }}
            >
              {simEnviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FlaskConical className="w-4 h-4" />
              )}
              {simEnviando ? 'Enviando...' : 'Simular Mensagem'}
            </button>
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
