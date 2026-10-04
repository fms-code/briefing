/**
 * Aba "Métricas" do painel /respostas: agrega os eventos do Netlify Blobs
 * (ver metricas.js) em visitas, funil dos formulários, abandono e e-mails.
 */

const { SECOES } = require('./anamnese.js');

const escapar = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fuso = { timeZone: 'America/Sao_Paulo' };
const dataHora = (ms) => new Date(ms).toLocaleString('pt-BR', { ...fuso, dateStyle: 'short', timeStyle: 'short' });
const diaLocal = (ms) => new Date(ms).toLocaleDateString('en-CA', fuso); /* AAAA-MM-DD */

const PAGINAS = { '/': 'Landing', '/briefing/': 'Anamnese de marca', '/archetype/': 'Mapa de Arquétipos' };
const FORMULARIOS = [
  {
    pagina: '/briefing/', titulo: 'Anamnese de marca',
    etapas: SECOES.map((s) => [`secao-${s.num}`, `${s.num} ${s.titulo}`])
  },
  {
    pagina: '/archetype/', titulo: 'Mapa de Arquétipos',
    etapas: [['perguntas-25', 'Até 25% das perguntas'], ['perguntas-50', 'Até 50% das perguntas'], ['perguntas-75', 'Até 75% das perguntas'],
      ['perguntas-100', 'Todas as perguntas'], ['dados', 'Tela de dados de contato'], ['resultado', 'Viu o resultado']]
  }
];
const ABANDONO_MS = 30 * 60 * 1000; /* sem envio 30 min depois do último evento = abandonou */

function agregar(eventos, dias, agora = Date.now()) {
  const sessoes = new Map(); /* `${pagina}|${sessao}` → resumo */
  const visitantes = new Set();
  const porDia = new Map();
  const origens = new Map();
  const dispositivos = { celular: new Set(), computador: new Set() };
  const emails = [];
  const errosEnvio = [];

  for (const ev of eventos) {
    if (ev.tipo === 'email') { emails.push(ev); continue; }
    if (!ev.sessao) continue;
    if (ev.tipo === 'erro_envio') errosEnvio.push(ev);
    const k = `${ev.pagina}|${ev.sessao}`;
    const s = sessoes.get(k) || { pagina: ev.pagina, sessao: ev.sessao, etapas: new Set(), inicio: false, envio: false, ultimo: 0 };
    s.ultimo = Math.max(s.ultimo, ev.t);
    if (ev.tipo === 'inicio') s.inicio = true;
    if (ev.tipo === 'envio') s.envio = true;
    if (ev.tipo === 'etapa') s.etapas.add(ev.etapa);
    sessoes.set(k, s);
    if (ev.tipo === 'visita') {
      visitantes.add(ev.sessao);
      const d = diaLocal(ev.t);
      if (!porDia.has(d)) porDia.set(d, new Set());
      porDia.get(d).add(ev.sessao);
      if (ev.origem) origens.set(ev.origem, (origens.get(ev.origem) || new Set()).add(ev.sessao));
      if (dispositivos[ev.disp]) dispositivos[ev.disp].add(ev.sessao);
    }
  }

  const visitasPorPagina = {};
  for (const s of sessoes.values()) visitasPorPagina[s.pagina] = (visitasPorPagina[s.pagina] || 0) + 1;

  const funis = FORMULARIOS.map((f) => {
    const daPagina = [...sessoes.values()].filter((s) => s.pagina === f.pagina);
    const abandonos = daPagina.filter((s) => s.inicio && !s.envio && agora - s.ultimo > ABANDONO_MS);
    const ondeParou = f.etapas.map(([id, rotulo], i) => ({
      rotulo,
      total: abandonos.filter((s) => {
        const ultima = Math.max(-1, ...[...s.etapas].map((e) => f.etapas.findIndex(([x]) => x === e)));
        return ultima === i;
      }).length
    }));
    const semEtapa = abandonos.filter((s) => ![...s.etapas].some((e) => f.etapas.some(([x]) => x === e))).length;
    if (semEtapa) ondeParou.unshift({ rotulo: 'Antes da primeira etapa', total: semEtapa });
    return {
      ...f,
      visitaram: daPagina.length,
      comecaram: daPagina.filter((s) => s.inicio).length,
      enviaram: daPagina.filter((s) => s.envio).length,
      emAndamento: daPagina.filter((s) => s.inicio && !s.envio && agora - s.ultimo <= ABANDONO_MS).length,
      abandonaram: abandonos.length,
      ondeParou
    };
  });

  const serie = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = diaLocal(agora - i * 86400000);
    serie.push({ dia: d, total: porDia.get(d)?.size || 0 });
  }

  return {
    visitantes: visitantes.size,
    visitasPorPagina,
    serie,
    funis,
    origens: [...origens.entries()].map(([o, s]) => ({ origem: o, total: s.size })).sort((a, b) => b.total - a.total).slice(0, 8),
    dispositivos: { celular: dispositivos.celular.size, computador: dispositivos.computador.size },
    emails: emails.slice().reverse(),
    errosEnvio: errosEnvio.slice().reverse()
  };
}

/* ---------- HTML ---------- */

function barras(itens, max, vazio) {
  if (!itens.some((i) => i.total > 0)) return `<p class="sub">${vazio}</p>`;
  return `<div class="hbar">${itens.map((i) => `<div><span>${escapar(i.rotulo)}</span><i><b style="width:${max ? Math.round((i.total / max) * 100) : 0}%"></b></i><span>${i.total}${i.extra ? ` <em>${escapar(i.extra)}</em>` : ''}</span></div>`).join('')}</div>`;
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

function colunas(serie) {
  const max = Math.max(1, ...serie.map((s) => s.total));
  const curto = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return `<div class="colunas" role="img" aria-label="Visitantes por dia">
    ${serie.map((s) => `<div class="col" tabindex="0"><b style="height:${Math.max(s.total ? 4 : 0, Math.round((s.total / max) * 100))}%"></b><span class="dica">${curto(s.dia)} · ${s.total} visitante${s.total === 1 ? '' : 's'}</span></div>`).join('')}
  </div>
  <div class="colunas-eixo"><span>${curto(serie[0].dia)}</span><span>máx. ${max}/dia</span><span>${curto(serie[serie.length - 1].dia)}</span></div>
  <details class="tabela-dados"><summary>Ver em tabela</summary><table><thead><tr><th>Dia</th><th>Visitantes</th></tr></thead><tbody>${serie.slice().reverse().map((s) => `<tr><td>${curto(s.dia)}</td><td>${s.total}</td></tr>`).join('')}</tbody></table></details>`;
}

function htmlMetricas(m, dias, inicioColeta) {
  const falhas = m.emails.filter((e) => e.ok !== 'sim');
  const okEmails = m.emails.length - falhas.length;
  const periodo = [7, 30, 90].map((d) => `<a href="?aba=metricas&dias=${d}" class="${d === dias ? 'ativo' : ''}">${d} dias</a>`).join('');
  const paraRotulo = { interno: 'para você', respondente: 'para quem respondeu' };

  const funis = m.funis.map((f) => {
    const max = Math.max(f.visitaram, 1);
    const maxParou = Math.max(1, ...f.ondeParou.map((o) => o.total));
    return `<section class="detalhe metrica">
      <span class="eyebrow">Funil</span><h2>${escapar(f.titulo)}</h2>
      <p class="sub">${pct(f.enviaram, f.comecaram)} de quem começou enviou · ${f.emAndamento} preenchendo agora</p>
      ${barras([
        { rotulo: 'Visitaram', total: f.visitaram },
        { rotulo: 'Começaram', total: f.comecaram, extra: pct(f.comecaram, f.visitaram) },
        { rotulo: 'Enviaram', total: f.enviaram, extra: pct(f.enviaram, f.visitaram) },
        { rotulo: 'Abandonaram', total: f.abandonaram }
      ], max, 'Ninguém visitou esta página no período.')}
      <div class="secao"><div class="secao-topo"><span class="n">↳</span><h3>Onde pararam</h3></div>
      ${barras(f.ondeParou, maxParou, 'Nenhum abandono no período.')}</div>
    </section>`;
  }).join('');

  const linhasEmail = m.emails.slice(0, 40).map((e) => `<tr>
    <td class="data">${escapar(dataHora(e.t))}</td>
    <td>${e.ok === 'sim' ? '<span class="st ok">✓ Aceito pelo Resend</span>' : '<span class="st falha">✕ Falhou</span>'}</td>
    <td>${escapar(e.form === 'arquetipo' ? 'Arquétipos' : e.form === 'anamnese' ? 'Anamnese' : e.form)} · ${escapar(paraRotulo[e.para] || e.para)}</td>
    <td>${e.ok === 'sim' ? '' : escapar(`${e.status ? e.status + ' · ' : ''}${e.erro}`)}</td></tr>`).join('');

  const linhasErro = m.errosEnvio.slice(0, 20).map((e) => `<tr><td class="data">${escapar(dataHora(e.t))}</td><td>${escapar(PAGINAS[e.pagina] || e.pagina)}</td><td>${escapar(e.etapa)}</td></tr>`).join('');

  return `<div class="periodo">${periodo}</div>
  <div class="numeros quatro">
    <div class="num"><b>${m.visitantes}</b><span>visitantes</span></div>
    <div class="num"><b>${m.funis.reduce((a, f) => a + f.comecaram, 0)}</b><span>começaram um formulário</span></div>
    <div class="num"><b>${m.funis.reduce((a, f) => a + f.enviaram, 0)}</b><span>enviaram</span></div>
    <div class="num"><b>${falhas.length}</b><span>e-mails com falha</span></div>
  </div>
  <section class="detalhe metrica">
    <span class="eyebrow">Visitantes por dia</span>
    ${colunas(m.serie)}
    <div class="tres">
      <div><h3>Por página</h3>${barras(Object.entries(PAGINAS).map(([p, r]) => ({ rotulo: r, total: m.visitasPorPagina[p] || 0 })), Math.max(1, ...Object.values(m.visitasPorPagina)), 'Sem visitas.')}</div>
      <div><h3>De onde vieram</h3>${barras(m.origens.map((o) => ({ rotulo: o.origem, total: o.total })), m.origens[0]?.total || 1, 'Acesso direto ou sem origem informada.')}</div>
      <div><h3>Dispositivo</h3>${barras([{ rotulo: 'Celular', total: m.dispositivos.celular }, { rotulo: 'Computador', total: m.dispositivos.computador }], Math.max(1, m.dispositivos.celular, m.dispositivos.computador), 'Sem visitas.')}</div>
    </div>
  </section>
  <div class="grade-metricas">${funis}</div>
  <section class="detalhe metrica">
    <span class="eyebrow">E-mails</span><h2>${okEmails} aceitos · ${falhas.length} com falha</h2>
    <p class="sub">"Aceito" quer dizer que o Resend recebeu o pedido; entrega e bounce aparecem no painel do Resend.</p>
    ${linhasEmail ? `<div class="rolagem"><table class="log"><thead><tr><th>Quando</th><th>Status</th><th>Formulário</th><th>Motivo</th></tr></thead><tbody>${linhasEmail}</tbody></table></div>` : '<p class="sub">Nenhum e-mail no período.</p>'}
  </section>
  <section class="detalhe metrica">
    <span class="eyebrow">Falhas no envio do formulário</span><h2>${m.errosEnvio.length}</h2>
    <p class="sub">Quando o navegador da pessoa não conseguiu registrar o envio (conexão, bloqueio, erro do servidor).</p>
    ${linhasErro ? `<div class="rolagem"><table class="log"><thead><tr><th>Quando</th><th>Página</th><th>Erro</th></tr></thead><tbody>${linhasErro}</tbody></table></div>` : ''}
  </section>
  <p class="nota">Contagem própria, sem cookies e sem dados pessoais: cada aba aberta conta como um visitante. ${inicioColeta ? `Coleta desde ${escapar(inicioColeta)}.` : ''}</p>`;
}

module.exports = { agregar, htmlMetricas };
