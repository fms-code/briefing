/**
 * Painel interno em /respostas: quem respondeu cada formulário (Mapa de
 * Arquétipos e Anamnese de marca), lendo os envios direto do Netlify Forms.
 *
 * Variáveis de ambiente:
 *   PAINEL_SENHA   senha do painel (usuário: qualquer um)
 *   NETLIFY_TOKEN  Personal access token do Netlify (User settings › Applications)
 *
 * ?form=arquetipo|anamnese escolhe a aba; ?formato=csv baixa a planilha.
 */

import anamnese from '../lib/anamnese.js';

const { SECOES, ROTULOS, legivel } = anamnese;

const ABAS = [
  { form: 'arquetipo', titulo: 'Mapa de Arquétipos' },
  { form: 'anamnese', titulo: 'Anamnese de marca' }
];
const OCULTOS = ['ip', 'user_agent', 'referrer', 'bot-field', 'form-name'];

const escapar = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fuso = { timeZone: 'America/Sao_Paulo' };
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { ...fuso, dateStyle: 'short', timeStyle: 'short' });
const curta = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { ...fuso, day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('pt-BR', { ...fuso, hour: '2-digit', minute: '2-digit' })}`;
};

function autorizado(req, senha) {
  const cab = req.headers.get('authorization') || '';
  if (!cab.startsWith('Basic ')) return false;
  let decodificado = '';
  try { decodificado = new TextDecoder().decode(Uint8Array.from(atob(cab.slice(6)), (c) => c.charCodeAt(0))); } catch { return false; }
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

/* ---------- CSV ---------- */

function csv(form, envios) {
  const base = form === 'anamnese' ? SECOES.flatMap((s) => s.campos) : ['nome', 'email', 'whatsapp', 'instagram', 'dominante', 'dominante_pct', 'apoio', 'nitidez', 'mapa', 'respostas'];
  const campos = [...new Set([...base, ...envios.flatMap((e) => Object.keys(e.data || {}))])].filter((c) => !OCULTOS.includes(c));
  const rotulo = (c) => (form === 'anamnese' && ROTULOS[c]) || c;
  const valor = (c, v) => (form === 'anamnese' ? legivel(c, v ?? '') : v);
  const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Data', ...campos.map(rotulo)].map(cel).join(';')];
  for (const e of envios) linhas.push([dataHora(e.created_at), ...campos.map((c) => valor(c, e.data?.[c]))].map(cel).join(';'));
  return '﻿' + linhas.join('\r\n');
}

/* ---------- Partes da tela ---------- */

const so = (v) => String(v ?? '').trim();
const digitos = (v) => so(v).replace(/\D/g, '');
const linkWhats = (v) => {
  const d = digitos(v);
  if (d.length < 10) return '';
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
};

function contatos(d) {
  const itens = [];
  const wa = linkWhats(d.whatsapp);
  if (wa) itens.push(`<a class="wa" href="${wa}" target="_blank" rel="noopener">WhatsApp ${escapar(d.whatsapp)}</a>`);
  if (so(d.email)) itens.push(`<a href="mailto:${escapar(so(d.email))}">${escapar(so(d.email))}</a>`);
  const insta = so(d.instagram).replace(/^@/, '');
  if (insta) itens.push(`<a href="https://instagram.com/${encodeURIComponent(insta)}" target="_blank" rel="noopener">@${escapar(insta)}</a>`);
  return itens.length ? `<div class="acoes">${itens.join('')}</div>` : '';
}

function dl(pares) {
  const linhas = pares.filter(([, v]) => so(v) !== '').map(([r, v, chips]) => chips
    ? `<dt>${escapar(r)}</dt><dd class="chips">${String(v).split(' · ').map((x) => `<span>${escapar(x)}</span>`).join('')}</dd>`
    : `<dt>${escapar(r)}</dt><dd>${escapar(v).replace(/\n/g, '<br>')}</dd>`);
  return linhas.length ? `<dl>${linhas.join('')}</dl>` : '';
}

function secao(num, titulo, corpo) {
  if (!corpo) return '';
  return `<section class="secao"><div class="secao-topo"><span class="n">${num}</span><h3>${escapar(titulo)}</h3></div>${corpo}</section>`;
}

/* "Sábio 78% · Criador 70% · …" → [{ nome, pct }] */
function lerMapa(texto) {
  return so(texto).split('·').map((p) => p.trim().match(/^(.+?)\s+(\d+)%$/)).filter(Boolean)
    .map((m) => ({ nome: m[1], pct: Number(m[2]) }));
}

const ARQUETIPO = {
  item(e) {
    const d = e.data || {};
    return {
      titulo: so(d.nome) || 'Sem nome',
      linha2: [so(d.email), so(d.whatsapp)].filter(Boolean).join(' · '),
      tag: so(d.dominante) ? `${d.dominante}${d.dominante_pct ? ' · ' + d.dominante_pct : ''}` : '',
      busca: [d.nome, d.email, d.whatsapp, d.instagram, d.dominante].join(' ')
    };
  },
  detalhe(e) {
    const d = e.data || {};
    const mapa = lerMapa(d.mapa);
    const barras = mapa.length
      ? `<div class="barras">${mapa.map((m) => `<div><span>${escapar(m.nome)}</span><i><b style="width:${Math.max(0, Math.min(100, m.pct))}%"></b></i><span>${m.pct}%</span></div>`).join('')}</div>`
      : '';
    return `<span class="eyebrow">Arquétipo dominante · recebido em ${escapar(dataHora(e.created_at))}</span>
      <h2>${escapar(so(d.dominante) || '—')}${d.dominante_pct ? ' · ' + escapar(d.dominante_pct) : ''}</h2>
      <p class="sub">${escapar(so(d.nome) || 'Sem nome')}${d.nitidez ? ' · nitidez ' + escapar(String(d.nitidez).toLowerCase()) : ''}</p>
      ${contatos(d)}
      ${secao('01', 'Mapa completo', barras || dl([['Mapa', d.mapa]]))}
      ${secao('02', 'Dados do envio', dl([['Arquétipos de apoio', d.apoio], ['Nitidez do resultado', d.nitidez], ['Respostas brutas', d.respostas]]))}`;
  },
  numeros(envios) {
    const contagem = {};
    for (const e of envios) { const k = so(e.data?.dominante); if (k) contagem[k] = (contagem[k] || 0) + 1; }
    const topo = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
    return { valor: topo ? topo[0] : '—', rotulo: 'mais comum' };
  }
};

const ANAMNESE = {
  item(e) {
    const d = e.data || {};
    return {
      titulo: so(d.nome) || 'Sem nome',
      linha2: [so(d.especialidade), so(d.cidade)].filter(Boolean).join(' · ') || so(d.email),
      tag: so(d.prazo) ? `Prazo: ${legivel('prazo', d.prazo).toLowerCase()}` : '',
      busca: [d.nome, d.email, d.whatsapp, d.cidade, d.especialidade, d.instagram].join(' ')
    };
  },
  detalhe(e) {
    const d = e.data || {};
    const multiplos = ['tom', 'cor', 'recursos'];
    const corpo = SECOES.slice(1).map((s) => secao(s.num, s.titulo,
      dl(s.campos.map((c) => [ROTULOS[c] || c, legivel(c, d[c] ?? ''), multiplos.includes(c)])))).join('');
    const conhecidos = new Set([...SECOES.flatMap((s) => s.campos), ...OCULTOS]);
    const extras = dl(Object.entries(d).filter(([c]) => !conhecidos.has(c)).map(([c, v]) => [c, v]));
    return `<span class="eyebrow">Anamnese de marca · recebida em ${escapar(dataHora(e.created_at))}</span>
      <h2>${escapar(so(d.nome) || 'Sem nome')}</h2>
      <p class="sub">${escapar([d.especialidade, d.registro, d.cidade].map(so).filter(Boolean).join(' · '))}</p>
      ${contatos(d)}
      ${corpo || '<p class="sub">Nenhum outro campo preenchido.</p>'}
      ${secao('—', 'Outros campos', extras)}`;
  },
  numeros(envios) {
    return { valor: envios.length ? curta(envios[0].created_at).split(' · ')[0] : '—', rotulo: 'última resposta' };
  }
};

const MODELOS = { arquetipo: ARQUETIPO, anamnese: ANAMNESE };
const GENERICO = {
  item(e) { const d = e.data || {}; return { titulo: so(d.nome) || so(d.email) || 'Envio', linha2: so(d.email), tag: '', busca: Object.values(d).join(' ') }; },
  detalhe(e) { return `<span class="eyebrow">Recebido em ${escapar(dataHora(e.created_at))}</span><h2>${escapar(so(e.data?.nome) || 'Envio')}</h2>${dl(Object.entries(e.data || {}).filter(([c]) => !OCULTOS.includes(c)))}`; },
  numeros(envios) { return { valor: envios.length ? curta(envios[0].created_at).split(' · ')[0] : '—', rotulo: 'última resposta' }; }
};

function pagina(abas, atual, envios) {
  const modelo = MODELOS[atual] || GENERICO;
  const seteDias = Date.now() - 7 * 24 * 3600 * 1000;
  const recentes = envios.filter((e) => new Date(e.created_at).getTime() >= seteDias).length;
  const destaque = modelo.numeros(envios);

  const nav = abas.map((a) => `<a href="?form=${encodeURIComponent(a.form)}" class="${a.form === atual ? 'ativa' : ''}">${escapar(a.titulo)}<span class="n">${a.total}</span></a>`).join('');
  const itens = envios.map((e, i) => {
    const it = modelo.item(e);
    return `<a class="item${i === 0 ? ' sel' : ''}" href="#r-${i}" data-alvo="r-${i}" data-busca="${escapar(it.busca.toLowerCase())}">
      <div class="l1"><span>${escapar(it.titulo)}</span><span class="quando">${escapar(curta(e.created_at))}</span></div>
      ${it.linha2 ? `<div class="l2">${escapar(it.linha2)}</div>` : ''}
      ${it.tag ? `<span class="tag${i === 0 ? ' forte' : ''}">${escapar(it.tag)}</span>` : ''}
    </a>`;
  }).join('');
  const detalhes = envios.map((e, i) => `<article class="detalhe" id="r-${i}"${i === 0 ? '' : ' hidden'}>${modelo.detalhe(e)}</article>`).join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Respostas</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--porcelana:#EDEDEB;--papel:#F7F7F6;--cartao:#FFFFFF;--linha:#D8D8D4;--pontilhado:#E6E6E2;--tinta:#16161A;--tinta-media:#5A5A62;--tinta-fraca:#8E8E96;--marcador:#5B3FA8;--marcador-claro:#EDE7FA;--ok:#2F7A55;
--serif:'Bodoni Moda',Georgia,serif;--sans:'Manrope',-apple-system,BlinkMacSystemFont,sans-serif;--mono:'IBM Plex Mono',ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root{--porcelana:#121215;--papel:#18181C;--cartao:#1E1E23;--linha:#2E2E35;--pontilhado:#2A2A30;--tinta:#EDEDEB;--tinta-media:#A8A8B0;--tinta-fraca:#7C7C86;--marcador:#A792E8;--marcador-claro:#2A2340;--ok:#5CBF8A}}
*{box-sizing:border-box}body{margin:0;background:var(--porcelana);color:var(--tinta);font:15px/1.55 var(--sans)}
.topo{border-bottom:1px solid var(--linha);background:var(--papel)}
.topo-in{max-width:1240px;margin:0 auto;padding:22px 24px 0}
.eyebrow{font:500 11px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--marcador)}
h1{font:400 34px/1.1 var(--serif);margin:6px 0 18px}
.abas{display:flex;gap:28px;overflow-x:auto}
.abas a{padding:0 0 12px;color:var(--tinta-media);text-decoration:none;border-bottom:2px solid transparent;font-weight:500;white-space:nowrap}
.abas a.ativa{color:var(--tinta);border-color:var(--marcador)}
.abas .n{font:500 12px var(--mono);color:var(--tinta-fraca);margin-left:6px}.abas a.ativa .n{color:var(--marcador)}
main{max-width:1240px;margin:0 auto;padding:22px 24px 48px}
.numeros{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.num{background:var(--cartao);border:1px solid var(--linha);padding:14px 16px;min-width:0}
.num b{display:block;font:400 28px/1.1 var(--serif);font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.num span{display:block;font-size:12px;color:var(--tinta-media);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ferramentas{display:flex;gap:10px;margin-bottom:14px}
.busca{flex:1;min-width:0;border:1px solid var(--linha);background:var(--cartao);padding:10px 14px;font:inherit;color:var(--tinta)}
.busca:focus{outline:2px solid var(--marcador);outline-offset:-1px}
.btn{display:inline-flex;align-items:center;border:1px solid var(--tinta);background:transparent;color:var(--tinta);padding:10px 16px;font:500 14px var(--sans);white-space:nowrap;text-decoration:none}
.grade{display:grid;grid-template-columns:380px minmax(0,1fr);gap:16px;align-items:start}
.lista{background:var(--cartao);border:1px solid var(--linha)}
.item{display:block;padding:14px 16px;border-bottom:1px solid var(--linha);color:inherit;text-decoration:none}
.item:last-child{border-bottom:0}.item:hover{background:var(--papel)}
.item.sel{background:var(--marcador-claro);box-shadow:inset 3px 0 0 var(--marcador)}
.item .l1{display:flex;justify-content:space-between;gap:8px;font-weight:600}
.item .quando{font:400 12px var(--mono);color:var(--tinta-fraca);white-space:nowrap}
.item .l2{font-size:13px;color:var(--tinta-media);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tag{display:inline-block;margin-top:6px;font:500 11px var(--mono);letter-spacing:.04em;padding:2px 8px;border:1px solid var(--linha);color:var(--tinta-media)}
.item.sel .tag{border-color:var(--marcador);color:var(--marcador)}
.detalhe{background:var(--cartao);border:1px solid var(--linha);padding:26px 28px;min-width:0}
.detalhe h2{font:400 28px/1.15 var(--serif);margin:4px 0 4px;overflow-wrap:anywhere}
.sub{color:var(--tinta-media);font-size:14px;margin:0 0 16px}
.acoes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.acoes a{font-size:13px;padding:7px 12px;border:1px solid var(--linha);color:var(--tinta);text-decoration:none;overflow-wrap:anywhere}
.acoes a.wa{border-color:var(--ok);color:var(--ok)}
.secao{margin-top:22px}
.secao-topo{display:flex;align-items:baseline;gap:10px;border-bottom:1px solid var(--linha);padding-bottom:6px;margin-bottom:4px}
.secao-topo .n{font:500 12px var(--mono);color:var(--marcador);letter-spacing:.08em}
.secao-topo h3{margin:0;font:400 18px var(--serif)}
dl{display:grid;grid-template-columns:200px minmax(0,1fr);margin:0}
dt,dd{padding:8px 0;border-bottom:1px dashed var(--pontilhado);margin:0}
dt{color:var(--tinta-media);font-size:13px;padding-right:12px}dd{font-size:14.5px;overflow-wrap:anywhere}
.chips span{display:inline-block;margin:0 6px 4px 0;padding:2px 9px;background:var(--porcelana);font-size:13px}
.barras{padding-top:6px}.barras div{display:grid;grid-template-columns:110px 1fr 44px;gap:10px;align-items:center;font-size:13px;margin:6px 0}
.barras i{display:block;height:8px;background:var(--porcelana)}.barras i b{display:block;height:100%;background:var(--marcador)}
.barras span:last-child{font-family:var(--mono);text-align:right;color:var(--tinta-media)}
.vazio{background:var(--cartao);border:1px solid var(--linha);padding:24px;color:var(--tinta-media)}
@media (max-width:760px){
 .topo-in{padding:16px 16px 0}h1{font-size:28px}.abas{gap:18px}
 main{padding:16px 16px 40px}.numeros{gap:8px}.num{padding:10px}.num b{font-size:22px}
 .grade{grid-template-columns:1fr}.detalhe{padding:20px 16px}
 dl{grid-template-columns:1fr}dt{border-bottom:0;padding-bottom:0}
}
</style></head><body>
<header class="topo"><div class="topo-in"><span class="eyebrow">fabianomartins.app.br · painel interno</span><h1>Respostas</h1>
<nav class="abas">${nav}</nav></div></header>
<main>
<div class="numeros">
 <div class="num"><b>${envios.length}</b><span>total</span></div>
 <div class="num"><b>${recentes}</b><span>últimos 7 dias</span></div>
 <div class="num"><b>${escapar(destaque.valor)}</b><span>${escapar(destaque.rotulo)}</span></div>
</div>
${envios.length ? `<div class="ferramentas">
 <input class="busca" id="busca" type="search" placeholder="Buscar nome, e-mail, WhatsApp${atual === 'anamnese' ? ', cidade' : ''}" aria-label="Buscar respostas">
 <a class="btn" href="?form=${encodeURIComponent(atual)}&formato=csv">Baixar CSV</a>
</div>
<div class="grade"><div class="lista" id="lista">${itens}</div><div id="detalhes">${detalhes}</div></div>` : '<p class="vazio">Nenhuma resposta ainda neste formulário.</p>'}
</main>
<script>
(function(){
  var lista=document.getElementById('lista'); if(!lista) return;
  var estreito=window.matchMedia('(max-width:760px)');
  function abrir(id,rolar){
    lista.querySelectorAll('.item').forEach(function(a){a.classList.toggle('sel',a.dataset.alvo===id)});
    document.querySelectorAll('#detalhes .detalhe').forEach(function(d){d.hidden=d.id!==id});
    if(rolar&&estreito.matches) document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'});
  }
  lista.addEventListener('click',function(ev){
    var a=ev.target.closest('.item'); if(!a) return;
    ev.preventDefault(); abrir(a.dataset.alvo,true); history.replaceState(null,'','#'+a.dataset.alvo);
  });
  if(/^#r-\\d+$/.test(location.hash)&&document.getElementById(location.hash.slice(1))) abrir(location.hash.slice(1),false);
  var busca=document.getElementById('busca');
  busca.addEventListener('input',function(){
    var q=busca.value.trim().toLowerCase();
    lista.querySelectorAll('.item').forEach(function(a){a.hidden=q&&a.dataset.busca.indexOf(q)<0});
  });
})();
</script>
</body></html>`;
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
    const abas = [
      ...ABAS.map((a) => ({ ...a, total: forms.find((f) => f.name === a.form)?.submission_count ?? 0 })),
      ...forms.filter((f) => !ABAS.some((a) => a.form === f.name)).map((f) => ({ form: f.name, titulo: f.name, total: f.submission_count }))
    ];
    const pedido = url.searchParams.get('form');
    const atual = (abas.find((a) => a.form === pedido) || abas[0]).form;
    const form = forms.find((f) => f.name === atual);
    const envios = form ? await todosEnvios(form.id, token) : [];
    envios.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const semCache = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

    if (url.searchParams.get('formato') === 'csv') {
      return new Response(csv(atual, envios), {
        headers: { ...semCache, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="respostas-${atual}.csv"` }
      });
    }
    return new Response(pagina(abas, atual, envios), { headers: { ...semCache, 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error('Falha ao carregar respostas:', e.message);
    return new Response('Não foi possível carregar as respostas agora.', { status: 502 });
  }
};

export const config = { path: '/respostas' };
