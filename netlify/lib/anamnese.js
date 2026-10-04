/**
 * Estrutura da Anamnese de marca (formulário `anamnese`): seções, rótulos dos
 * campos e tradução dos slugs de escolha. Usada pelo e-mail e pelo painel /respostas.
 */

const SECOES = [
  { num: '01', titulo: 'Identificação', campos: ['nome', 'especialidade', 'registro', 'cidade', 'email', 'whatsapp'] },
  { num: '02', titulo: 'Queixa principal', campos: ['descricao', 'diferencial', 'objetivo', 'tom', 'referencias'] },
  { num: '03', titulo: 'Procedimentos', campos: ['procedimentos', 'preco', 'valores'] },
  { num: '04', titulo: 'Fototipo da marca', campos: ['cor', 'cor_livre', 'cor_vetada', 'logo', 'arquivos_marca'] },
  { num: '05', titulo: 'Documentação fotográfica', campos: ['acervo', 'autorizacao', 'presenca', 'fotos_link', 'texto'] },
  { num: '06', titulo: 'Recursos clínicos', campos: ['recursos'] },
  { num: '07', titulo: 'Canais de contato', campos: ['instagram', 'tiktok', 'whatsapp_atendimento', 'email_comercial', 'endereco', 'dominio_status', 'dominio_1', 'dominio_2', 'dominio_3'] },
  { num: '08', titulo: 'Conduta e prazo', campos: ['prazo', 'data_limite', 'observacoes'] }
];

const ROTULOS = {
  nome: 'Nome profissional',
  especialidade: 'Especialidade',
  registro: 'Registro profissional',
  cidade: 'Cidade e estado',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  descricao: 'Descrição do trabalho',
  diferencial: 'Por que escolhem ela',
  objetivo: 'O que o site precisa resolver',
  tom: 'Como a marca deve soar',
  referencias: 'Sites ou perfis que admira',
  procedimentos: 'Procedimentos a destacar',
  preco: 'Exibição de valores',
  valores: 'Faixa de valores',
  cor: 'Cores que representam',
  cor_livre: 'Outra cor em mente',
  cor_vetada: 'Cor vetada',
  logo: 'Situação da identidade visual',
  arquivos_marca: 'Arquivos da marca',
  acervo: 'Acervo de antes e depois',
  autorizacao: 'Autorização de imagem',
  presenca: 'Presença nas fotos',
  fotos_link: 'Onde estão as fotos',
  texto: 'Textos sobre ela',
  recursos: 'Recursos desejados',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  whatsapp_atendimento: 'WhatsApp de atendimento',
  email_comercial: 'E-mail comercial',
  endereco: 'Endereço do consultório',
  dominio_status: 'Situação do domínio',
  dominio_1: 'Domínio — 1ª opção',
  dominio_2: 'Domínio — 2ª opção',
  dominio_3: 'Domínio — 3ª opção',
  prazo: 'Prazo desejado',
  data_limite: 'Data que não pode passar',
  observacoes: 'Observações'
};

const VALORES = {
  tom: { clinica: 'Clínica e precisa', acolhedora: 'Acolhedora e próxima', discreta: 'Discreta e sofisticada', autoral: 'Autoral e criativa', cientifica: 'Científica e didática' },
  preco: { visivel: 'Preço visível', apartir: 'A partir de', consulta: 'Sob consulta', decidir: 'Decidir depois' },
  cor: { areia: 'Areia', argila: 'Argila', borgonha: 'Borgonha', rosa: 'Rosé', ameixa: 'Ameixa', petroleo: 'Petróleo', oliva: 'Oliva', grafite: 'Grafite', marfim: 'Marfim', dourado: 'Dourado' },
  logo: { pronta: 'Tem logo e manual', apenaslogo: 'Tem só a logo', refazer: 'Tem, mas quer refazer', nenhuma: 'Ainda não tem' },
  acervo: { amplo: 'Mais de 10 casos', medio: 'Entre 4 e 10', poucos: 'Menos de 4', nenhum: 'Ainda vai registrar' },
  autorizacao: { todas: 'Tem de todas', algumas: 'De algumas', nenhuma: 'Não tem', providenciar: 'Vai providenciar' },
  presenca: { protagonista: 'Aparece bastante', pontual: 'Uma foto de apresentação', maos: 'Só em atendimento', ausente: 'Prefere não aparecer' },
  texto: { pronto: 'Já tem escritos', rascunho: 'Tem rascunho', semtexto: 'Ainda não tem' },
  recursos: { galeria: 'Galeria de antes e depois', depoimentos: 'Depoimentos de pacientes', metricas: 'Relatório de visitas', email: 'E-mail automático de boas-vindas', cadastro: 'Cadastro de interessadas' },
  dominio_status: { registrado: 'Já registrou', registrar: 'Precisa registrar', trocar: 'Tem um, mas quer trocar' },
  prazo: { urgente: 'Esta semana', quinzena: 'Até quinze dias', mes: 'Dentro de um mês', tranquilo: 'Sem data fixa' }
};

/* Os campos de escolha chegam como slug; aqui viram o texto que ela leu na tela. */
function legivel(campo, valor) {
  const mapa = VALORES[campo];
  if (!mapa) return valor;
  return String(valor).split(',').map((v) => mapa[v.trim()] || v.trim()).join(' · ');
}

module.exports = { SECOES, ROTULOS, VALORES, legivel };
