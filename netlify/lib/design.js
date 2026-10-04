/**
 * Converte uma resposta da Anamnese de marca num briefing em Markdown para
 * colar (ou anexar) no Claude Design e gerar o protótipo do site da cliente.
 * As regras de SEO e performance repetem o CLAUDE.md do repositório.
 */

const { legivel } = require('./anamnese.js');

/* Mesmos tons das amostras em briefing/index.html. */
const HEX = {
  areia: '#E3D5C4', argila: '#C08B72', borgonha: '#6E2233', rosa: '#D9A0A8', ameixa: '#5B3FA8',
  petroleo: '#1F4A4E', oliva: '#6F7A52', grafite: '#2C2C31', marfim: '#F1EDE4', dourado: '#B99050'
};

const RECURSO_SECAO = {
  galeria: 'casos em grade (imagens com `loading="lazy"`, WebP, `width`/`height` declarados)',
  depoimentos: 'citações curtas com nome e procedimento',
  metricas: 'Relatório de visitas (não aparece no layout; só registrar que o site terá analytics)',
  email: 'E-mail automático de boas-vindas (fora do layout; prever o formulário que o dispara)',
  cadastro: 'formulário curto: nome, WhatsApp e procedimento de interesse'
};

const so = (v) => String(v ?? '').trim();
const L = (campo, valor) => (so(valor) ? legivel(campo, so(valor)) : '');
const lista = (v) => so(v).split(',').map((x) => x.trim()).filter(Boolean);
const linha = (rotulo, valor) => (so(valor) ? `- **${rotulo}:** ${so(valor).replace(/\n+/g, ' ')}` : '');
const bloco = (titulo, linhas) => {
  const corpo = linhas.filter(Boolean);
  return corpo.length ? `## ${titulo}\n\n${corpo.join('\n')}\n` : '';
};

function whatsapp(v) {
  const d = so(v).replace(/\D/g, '');
  if (d.length < 10) return '';
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
}

function briefingDesign(d, recebidaEm) {
  const nome = so(d.nome) || 'Cliente';
  const especialidade = so(d.especialidade) || 'clínica estética';
  const cidade = so(d.cidade);
  const procedimentos = so(d.procedimentos);
  const principal = procedimentos.split(/[,;\n]/)[0]?.trim() || especialidade;
  const cores = lista(d.cor).map((c) => `${legivel('cor', c)} \`${HEX[c] || '?'}\``);
  const recursos = lista(d.recursos);
  const wa = whatsapp(d.whatsapp_atendimento || d.whatsapp);
  const semAutorizacao = ['nenhuma', 'providenciar', 'algumas'].includes(so(d.autorizacao));

  const extras = recursos.filter((r) => ['galeria', 'depoimentos', 'cadastro'].includes(r));
  const secoes = [
    `**Hero** — único \`<h1>\` no formato "${principal}${cidade ? ' em ' + cidade : ''}", subtítulo com o diferencial e botão de WhatsApp.`,
    '**Sobre** — quem é a profissional, com foto de apresentação se ela aparecer nas fotos.',
    '**Procedimentos** — um card por procedimento destacado (`<h2>` da seção, `<h3>` por procedimento).',
    '**Benefícios** — `<h2>` próprio, itens em `<h3>`.',
    ...extras.map((r) => `**${legivel('recursos', r)}** — ${RECURSO_SECAO[r]}.`),
    '**Perguntas frequentes** — `<h2>` da seção, cada pergunta em `<h3>`.',
    '**Rodapé** — `<footer>` com endereço completo em texto, WhatsApp, Instagram e horário.'
  ].map((t, i) => `${i + 1}. ${t}`);

  return [
    `# Protótipo de site — ${nome}`,
    '',
    `> Briefing gerado da Anamnese de marca recebida em ${recebidaEm}. Use como especificação para o protótipo de alta fidelidade.`,
    '',
    '## Pedido',
    '',
    `Crie o protótipo de um site institucional de uma página para **${nome}**, ${especialidade}${cidade ? ' em ' + cidade : ''}. ` +
      'Mobile-first (390px) e versão desktop (1280px). Use o conteúdo real abaixo; onde faltar texto, escreva no tom indicado e marque como rascunho.',
    '',
    bloco('Quem é', [
      linha('Nome profissional', d.nome), linha('Especialidade', d.especialidade), linha('Registro profissional', d.registro),
      linha('Cidade', d.cidade), linha('Descrição do trabalho', d.descricao), linha('Por que escolhem ela', d.diferencial)
    ]),
    bloco('O que o site precisa resolver', [so(d.objetivo) ? so(d.objetivo) : '']),
    bloco('Tom de voz', [
      linha('Como a marca deve soar', L('tom', d.tom)), linha('Sites ou perfis que ela admira', d.referencias),
      linha('Textos próprios', L('texto', d.texto))
    ]),
    bloco('Identidade visual', [
      cores.length ? `- **Paleta escolhida:** ${cores.join(', ')}` : '',
      linha('Outra cor em mente', d.cor_livre),
      so(d.cor_vetada) ? `- **Não usar:** ${so(d.cor_vetada)}` : '',
      linha('Situação da identidade visual', L('logo', d.logo)), linha('Arquivos da marca', d.arquivos_marca),
      '- Respeite contraste AA em todo texto sobre essas cores.'
    ]),
    bloco('Procedimentos', [
      procedimentos.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean).map((p) => `- ${p}`).join('\n'),
      linha('Exibição de valores', L('preco', d.preco)), linha('Faixa de valores', d.valores)
    ]),
    bloco('Fotos', [
      linha('Acervo de antes e depois', L('acervo', d.acervo)), linha('Autorização de imagem', L('autorizacao', d.autorizacao)),
      linha('Presença dela nas fotos', L('presenca', d.presenca)), linha('Onde estão as fotos', d.fotos_link),
      semAutorizacao ? '- Sem autorização para todas as imagens: use placeholders neutros com proporção fixa no lugar dos casos de antes e depois.' : ''
    ]),
    '## Estrutura sugerida\n\n' + secoes.join('\n') + '\n',
    bloco('Contato', [
      wa ? `- **WhatsApp (link direto):** ${wa}` : '', linha('Instagram', d.instagram), linha('TikTok', d.tiktok),
      linha('E-mail comercial', d.email_comercial), linha('Endereço do consultório', d.endereco),
      linha('Domínio', [L('dominio_status', d.dominio_status), d.dominio_1, d.dominio_2, d.dominio_3].map(so).filter(Boolean).join(' · '))
    ]),
    bloco('Regras técnicas (obrigatórias)', [
      `- Apenas um \`<h1>\` na página, no formato [Procedimento/Nome + Cidade]${cidade ? ` — ex.: "${principal} em ${cidade}"` : ''}.`,
      '- Conteúdo dividido em `<h2>` e `<h3>`, inclusive nas seções de perguntas frequentes e de benefícios.',
      '- Imagens de antes e depois com `loading="lazy"`, em WebP (com fallback quando necessário) e `width`/`height` ou `aspect-ratio` explícitos.',
      '- `<footer>` com o endereço físico completo em texto, idêntico ao do Google Maps.',
      `- Botões de contato apontando para \`${wa || 'https://wa.me/55DDDNUMERO'}\`.`,
      '- JSON-LD `MedicalBusiness` (ou `BeautySalon`) com `name`, `address`, `geo` (latitude/longitude) e `openingHours`.'
    ]),
    bloco('Prazo e observações', [
      linha('Prazo desejado', L('prazo', d.prazo)), linha('Data que não pode passar', d.data_limite), linha('Observações', d.observacoes)
    ])
  ].map((p) => p.trim()).filter(Boolean).join('\n\n') + '\n';
}

module.exports = { briefingDesign };
