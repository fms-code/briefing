/**
 * Eventos de métricas no Netlify Blobs (store "metricas").
 *
 * O evento inteiro vai codificado na própria chave, com o valor vazio: assim
 * um único list() por dia devolve todos os eventos, sem um get() para cada um.
 * Chave: e/AAAA-MM-DD/<ms>-<aleatório>/<campos separados por "~">
 */

const CAMPOS = ['tipo', 'pagina', 'sessao', 'etapa', 'origem', 'disp', 'form', 'para', 'ok', 'status', 'erro'];
const limpar = (v) => encodeURIComponent(String(v ?? '').slice(0, 80)).replace(/~/g, '%7E');
const dia = (ms) => new Date(ms).toISOString().slice(0, 10);

function chave(evento, ms = Date.now()) {
  const sufixo = Math.random().toString(36).slice(2, 8);
  return `e/${dia(ms)}/${ms}-${sufixo}/${CAMPOS.map((c) => limpar(evento[c])).join('~')}`;
}

function lerChave(k) {
  const [, , marca, dados = ''] = k.split('/');
  const partes = dados.split('~');
  const ev = { t: Number(String(marca).split('-')[0]) };
  CAMPOS.forEach((c, i) => { ev[c] = decodeURIComponent(partes[i] || ''); });
  return ev;
}

async function registrar(store, evento) {
  await store.set(chave(evento), '');
}

/* Todos os eventos dos últimos `dias` dias (UTC), do mais antigo ao mais novo. */
async function lerPeriodo(store, dias) {
  const hoje = Date.now();
  const listas = await Promise.all(Array.from({ length: dias }, (_, i) =>
    store.list({ prefix: `e/${dia(hoje - i * 86400000)}/` }).then((r) => r.blobs.map((b) => lerChave(b.key)))));
  return listas.flat().sort((a, b) => a.t - b.t);
}

module.exports = { registrar, lerPeriodo, chave, lerChave };
