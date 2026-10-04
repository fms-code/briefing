/**
 * Os 12 arquétipos do Mapa (mesmos ids e quadrantes de archetype/index.html)
 * e o link que reabre um resultado em modo leitura na própria página do teste.
 */

const QUADRANTES = [
  { id: 'ind', nome: 'Independência e realização' },
  { id: 'mas', nome: 'Maestria e risco' },
  { id: 'per', nome: 'Pertencimento e prazer' },
  { id: 'est', nome: 'Estabilidade e controle' }
];

const ARQUETIPOS = [
  { id: 'inocente', nome: 'Inocente', q: 'ind' }, { id: 'explorador', nome: 'Explorador', q: 'ind' }, { id: 'sabio', nome: 'Sábio', q: 'ind' },
  { id: 'heroi', nome: 'Herói', q: 'mas' }, { id: 'foradalei', nome: 'Fora da Lei', q: 'mas' }, { id: 'mago', nome: 'Mago', q: 'mas' },
  { id: 'caracomum', nome: 'Cara Comum', q: 'per' }, { id: 'amante', nome: 'Amante', q: 'per' }, { id: 'bobo', nome: 'Bobo da Corte', q: 'per' },
  { id: 'cuidador', nome: 'Cuidador', q: 'est' }, { id: 'criador', nome: 'Criador', q: 'est' }, { id: 'governante', nome: 'Governante', q: 'est' }
];

const BASE = 'https://fabianomartins.app.br/archetype/';

/* /archetype/?r=<36 respostas separadas por ponto>&n=<primeiro nome>; sem e-mail nem WhatsApp no link. */
function linkResultado(dados, base = BASE) {
  const respostas = String(dados?.respostas || '').split(',').map((v) => v.trim()).filter(Boolean);
  if (respostas.length !== 36) return '';
  const nome = String(dados?.nome || '').trim().split(/\s+/)[0] || '';
  return `${base}?r=${encodeURIComponent(respostas.join('.'))}${nome ? `&n=${encodeURIComponent(nome)}` : ''}`;
}

module.exports = { QUADRANTES, ARQUETIPOS, linkResultado };
