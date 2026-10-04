/**
 * Painel interno em /respostas: lista quem respondeu cada formulário
 * (arquetipo, anamnese) lendo os envios direto do Netlify Forms.
 *
 * Variáveis de ambiente:
 *   PAINEL_SENHA   senha do painel (usuário: qualquer um)
 *   NETLIFY_TOKEN  Personal access token do Netlify (User settings › Applications)
 *
 * ?form=arquetipo|anamnese filtra; ?formato=csv baixa a planilha.
 */

const escapar = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const COLUNAS = {
  arquetipo: [['nome', 'Nome'], ['email', 'E-mail'], ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['dominante', 'Dominante'], ['dominante_pct', '%'], ['apoio', 'Apoio'], ['nitidez', 'Nitidez']],
  anamnese: [['nome', 'Nome'], ['email', 'E-mail'], ['whatsapp', 'WhatsApp'], ['especialidade', 'Especialidade'], ['cidade', 'Cidade'], ['prazo', 'Prazo']]
};
const PADRAO = [['nome', 'Nome'], ['email', 'E-mail'], ['whatsapp', 'WhatsApp']];

function autorizado(req, senha) {
  const cab = req.headers.get('authorization') || '';
  if (!cab.startsWith('Basic ')) return false;
  let decodificado = '';
  try { decodificado = atob(cab.slice(6)); } catch { return false; }
  const recebida = decodificado.slice(decodificado.indexOf(':') + 1);
  if (recebida.length !== senha.length) return false;
  let dif = 0;
  for (let i = 0; i < senha.length; i++) dif |= recebida.charCodeAt(i) ^ senha.charCodeAt(i);
  return dif === 0;
}

async function api(caminho, token) {
  const r = await fetch(`https://api.netlify.com/api/v1${caminho}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Netlify API ${r.status} em ${caminho}`);
  return r.json();
}

/* Pagina até o fim: o painel precisa de todos os envios, não só dos 100 mais recentes. */
async function todosEnvios(formId, token) {
  const lista = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const lote = await api(`/forms/${formId}/submissions?per_page=100&page=${pagina}`, token);
    lista.push(...lote);
    if (lote.length < 100) break;
  }
  return lista;
}

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function csv(form, envios) {
  const cols = COLUNAS[form] || PADRAO;
  const campos = [...new Set([...cols.map(([c]) => c), ...envios.flatMap((e) => Object.keys(e.data || {}))])]
    .filter((c) => !['ip', 'user_agent', 'referrer'].includes(c));
  const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['data', ...campos].map(cel).join(';')];
  for (const e of envios) linhas.push([quando(e.created_at), ...campos.map((c) => e.data?.[c])].map(cel).join(';'));
  return '﻿' + linhas.join('\r\n');
}

function pagina(forms, atual, envios) {
  const cols = COLUNAS[atual] || PADRAO;
  const abas = forms.map((f) => `<a href="?form=${encodeURIComponent(f.name)}" class="${f.name === atual ? 'ativa' : ''}">${escapar(f.name)} <span>${f.submission_count}</span></a>`).join('');
  const linhas = envios.map((e) => {
    const extras = Object.entries(e.data || {})
      .filter(([c]) => !['ip', 'user_agent', 'referrer'].includes(c))
      .map(([c, v]) => `<dt>${escapar(c)}</dt><dd>${escapar(v).replace(/\n/g, '<br>')}</dd>`).join('');
    return `<tr>
      <td class="data">${escapar(quando(e.created_at))}</td>
      ${cols.map(([c]) => `<td>${c === 'email' && e.data?.[c] ? `<a href="mailto:${escapar(e.data[c])}">${escapar(e.data[c])}</a>` : escapar(e.data?.[c])}</td>`).join('')}
      <td><details><summary>ver</summary><dl>${extras}</dl></details></td>
    </tr>`;
  }).join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Respostas</title>
<style>
:root{--fundo:#EDEDEB;--cartao:#fff;--tinta:#16161A;--suave:#5A5A62;--linha:#D8D8D4;--acento:#5B3FA8}
@media (prefers-color-scheme:dark){:root{--fundo:#141417;--cartao:#1C1C21;--tinta:#EDEDEB;--suave:#A0A0A8;--linha:#2E2E35;--acento:#A792E8}}
*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--tinta);font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px}
h1{font:400 26px Georgia,serif;margin:0 0 16px}
nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
nav a{padding:6px 12px;border:1px solid var(--linha);color:var(--tinta);text-decoration:none;background:var(--cartao)}
nav a.ativa{border-color:var(--acento);color:var(--acento)}nav a span{color:var(--suave);margin-left:4px}
.barra{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px;color:var(--suave)}
.barra a{color:var(--acento)}
.tabela{overflow-x:auto;background:var(--cartao);border:1px solid var(--linha)}
table{border-collapse:collapse;width:100%;min-width:760px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--linha);vertical-align:top}
th{font-size:12px;color:var(--suave);font-weight:500;text-transform:uppercase;letter-spacing:.04em}
td.data{white-space:nowrap;color:var(--suave)}td a{color:var(--acento)}
dl{margin:8px 0 0;display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;max-width:520px}
dt{color:var(--suave)}dd{margin:0;word-break:break-word}summary{cursor:pointer;color:var(--acento)}
.vazio{padding:24px;color:var(--suave)}
</style></head><body><main>
<h1>Respostas</h1>
<nav>${abas}</nav>
<div class="barra"><span>${envios.length} resposta(s) em <b>${escapar(atual)}</b></span>
<a href="?form=${encodeURIComponent(atual)}&formato=csv">Baixar CSV</a></div>
<div class="tabela">${envios.length ? `<table><thead><tr><th>Data</th>${cols.map(([, r]) => `<th>${r}</th>`).join('')}<th>Tudo</th></tr></thead><tbody>${linhas}</tbody></table>` : '<p class="vazio">Nenhuma resposta ainda.</p>'}</div>
</main></body></html>`;
}

export default async (req, context) => {
  const senha = Netlify.env.get('PAINEL_SENHA');
  const token = Netlify.env.get('NETLIFY_TOKEN');
  if (!senha || !token) {
    return new Response('Painel não configurado: defina PAINEL_SENHA e NETLIFY_TOKEN.', { status: 503 });
  }
  if (!autorizado(req, senha)) {
    return new Response('Acesso restrito.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Respostas", charset="UTF-8"' }
    });
  }

  try {
    const url = new URL(req.url);
    const forms = await api(`/sites/${context.site.id}/forms`, token);
    const pedido = url.searchParams.get('form');
    const form = forms.find((f) => f.name === pedido) || forms.find((f) => f.name === 'arquetipo') || forms[0];
    const atual = form ? form.name : '';
    const envios = form ? await todosEnvios(form.id, token) : [];
    const semCache = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

    if (url.searchParams.get('formato') === 'csv') {
      return new Response(csv(atual, envios), {
        headers: { ...semCache, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="respostas-${atual}.csv"` }
      });
    }
    return new Response(pagina(forms, atual, envios), { headers: { ...semCache, 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error('Falha ao carregar respostas:', e.message);
    return new Response('Não foi possível carregar as respostas agora.', { status: 502 });
  }
};

export const config = { path: '/respostas' };
