/**
 * Notificações no Telegram: uma mensagem por resposta (anamnese e arquétipo)
 * e um alerta quando um e-mail falha.
 *
 * TELEGRAM_BOT_TOKEN vem do ambiente (criado no @BotFather). O chat é conectado
 * pelo painel (/respostas?aba=notificacoes) e fica salvo no Netlify Blobs,
 * store "config", chave "telegram"; TELEGRAM_CHAT_ID no ambiente tem prioridade.
 */

const SITE = 'https://fabianomartins.app.br';

const escapar = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const so = (v) => String(v ?? '').trim();

async function api(token, metodo, corpo) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo || {})
  });
  const json = await r.json().catch(() => ({}));
  if (!json.ok) throw new Error(`Telegram ${metodo}: ${json.description || r.status}`);
  return json.result;
}

async function chatSalvo(store) {
  const fixo = process.env.TELEGRAM_CHAT_ID;
  if (fixo) return { id: fixo, nome: 'definido no ambiente' };
  try { return (await store.get('telegram', { type: 'json' })) || null; } catch { return null; }
}

async function enviar(token, chatId, texto, botoes = []) {
  return api(token, 'sendMessage', {
    chat_id: chatId,
    text: texto,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(botoes.length ? { reply_markup: { inline_keyboard: [botoes.map(([text, url]) => ({ text, url }))] } } : {})
  });
}

/* ---------- Mensagens ---------- */

function mensagemResposta(form, dados, submissaoId, legivel, linkResultado) {
  const d = dados || {};
  const painel = `${SITE}/respostas?form=${form}${submissaoId ? `&id=${encodeURIComponent(submissaoId)}` : ''}`;
  if (form === 'anamnese') {
    const linhas = [
      '🟣 <b>Nova anamnese de marca</b>',
      `<b>${escapar(so(d.nome) || 'Sem nome')}</b>${so(d.especialidade) ? ' · ' + escapar(d.especialidade) : ''}`,
      so(d.cidade) ? `📍 ${escapar(d.cidade)}` : '',
      so(d.prazo) ? `⏱ Prazo: ${escapar(legivel ? legivel('prazo', d.prazo) : d.prazo)}` : '',
      so(d.whatsapp) ? `📱 ${escapar(d.whatsapp)}` : ''
    ];
    const wa = so(d.whatsapp).replace(/\D/g, '');
    const botoes = [['Abrir no painel', painel]];
    if (wa.length >= 10) botoes.push(['WhatsApp', `https://wa.me/${wa.length <= 11 ? '55' + wa : wa}`]);
    return { texto: linhas.filter(Boolean).join('\n'), botoes };
  }
  if (form === 'arquetipo') {
    const linhas = [
      '🔮 <b>Novo Mapa de Arquétipos</b>',
      `<b>${escapar(so(d.nome) || 'Sem nome')}</b> — ${escapar(so(d.dominante) || '?')}${so(d.dominante_pct) ? ' ' + escapar(d.dominante_pct) : ''}`,
      so(d.apoio) ? `Apoio: ${escapar(d.apoio)}` : '',
      so(d.nitidez) ? `Nitidez: ${escapar(d.nitidez)}` : ''
    ];
    const botoes = [['Abrir no painel', painel]];
    const link = linkResultado ? linkResultado(d) : '';
    if (link) botoes.push(['Ver resultado', link]);
    return { texto: linhas.filter(Boolean).join('\n'), botoes };
  }
  return { texto: `📨 <b>Novo envio</b> no formulário ${escapar(form)}`, botoes: [['Abrir no painel', painel]] };
}

function mensagemFalhaEmail(form, para, status, erro) {
  const quem = { interno: 'para você', respondente: 'para quem respondeu' }[para] || para;
  const nomeForm = { arquetipo: 'Mapa de Arquétipos', anamnese: 'Anamnese de marca' }[form] || form;
  return {
    texto: [`⚠️ <b>E-mail não enviado</b>`, `${escapar(nomeForm)} · ${escapar(quem)}`, `${status ? escapar(status) + ' · ' : ''}${escapar(erro || 'sem detalhe')}`].join('\n'),
    botoes: [['Ver métricas', `${SITE}/respostas?aba=metricas`]]
  };
}

/* Envia se houver token e chat conectado; nunca lança erro (notificação não pode derrubar o envio). */
async function notificar(store, mensagem) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const chat = await chatSalvo(store);
    if (!chat) return false;
    await enviar(token, chat.id, mensagem.texto, mensagem.botoes);
    return true;
  } catch (e) {
    console.error('Notificação no Telegram falhou:', e.message);
    return false;
  }
}

module.exports = { api, enviar, chatSalvo, notificar, mensagemResposta, mensagemFalhaEmail };
