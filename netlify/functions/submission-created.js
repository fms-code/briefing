/**
 * Dispara o briefing por e-mail via Resend a cada envio do formulário.
 * Netlify chama esta função no evento `submission-created`, depois de já
 * ter gravado o envio — se o e-mail falhar, o dado continua no painel.
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

/* Os campos de escolha chegam como slug; aqui viram o texto que ela leu na tela. */
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

const escapar = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Grupos de múltipla escolha chegam como "a, b, c" — traduz item a item. */
function legivel(campo, valor) {
  const mapa = VALORES[campo];
  if (!mapa) return valor;
  return String(valor).split(',').map((v) => mapa[v.trim()] || v.trim()).join(' · ');
}

function montarHtml(dados, quando) {
  const blocos = SECOES.map((secao) => {
    const linhas = secao.campos
      .filter((campo) => String(dados[campo] ?? '').trim() !== '')
      .map((campo) => {
        const valor = escapar(legivel(campo, dados[campo])).replace(/\n/g, '<br>');
        return `<tr>
          <td style="padding:10px 16px 10px 0;vertical-align:top;width:34%;color:#5A5A62;font-size:13px;">${ROTULOS[campo] || campo}</td>
          <td style="padding:10px 0;vertical-align:top;color:#16161A;font-size:15px;line-height:1.55;">${valor}</td>
        </tr>`;
      });

    if (!linhas.length) return '';
    return `<section style="margin:0 0 34px;">
      <div style="border-bottom:1px solid #D8D8D4;padding-bottom:8px;margin-bottom:6px;">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#5B3FA8;letter-spacing:.08em;">${secao.num}</span>
        <span style="font-size:17px;color:#16161A;margin-left:10px;">${secao.titulo}</span>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${linhas.join('')}</table>
    </section>`;
  }).join('');

  return `<div style="background:#EDEDEB;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#FFFFFF;padding:38px 34px;border:1px solid #D8D8D4;">
      <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#16161A;">Nova anamnese de marca</h1>
      <p style="margin:0 0 30px;color:#8E8E96;font-size:13px;">${escapar(quando)}</p>
      ${blocos}
      <p style="margin:30px 0 0;padding-top:16px;border-top:1px solid #D8D8D4;color:#8E8E96;font-size:12px;">
        Enviado pelo formulário em fabianomartins.app.br · responda este e-mail para falar direto com ela.
      </p>
    </div>
  </div>`;
}

function montarTexto(dados) {
  return SECOES.map((secao) => {
    const linhas = secao.campos
      .filter((campo) => String(dados[campo] ?? '').trim() !== '')
      .map((campo) => `${ROTULOS[campo] || campo}: ${legivel(campo, dados[campo])}`);
    return linhas.length ? `${secao.num} ${secao.titulo}\n${linhas.join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
}

exports.handler = async (event) => {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.BRIEFING_TO;
  const remetente = process.env.BRIEFING_FROM;

  if (!apiKey || !destino || !remetente) {
    const faltando = [['RESEND_API_KEY', apiKey], ['BRIEFING_TO', destino], ['BRIEFING_FROM', remetente]]
      .filter(([, v]) => !v).map(([k]) => k);
    console.error('Faltam variáveis de ambiente:', faltando.join(', '), '| contexto:', process.env.CONTEXT || '?');
    return { statusCode: 500, body: 'configuração incompleta' };
  }

  let dados, formulario;
  try {
    const payload = JSON.parse(event.body || '{}').payload || {};
    dados = payload.data || {};
    formulario = payload.form_name || dados['form-name'] || '';
  } catch (e) {
    console.error('Payload inválido:', e.message);
    return { statusCode: 400, body: 'payload inválido' };
  }

  const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  /* /archetype — resultado do Mapa de Arquétipos */
  if (formulario === 'arquetipo') {
    const corpoArq = {
      from: remetente,
      to: [destino],
      subject: `Arquétipo — ${dados.nome || 'sem nome'} · ${dados.dominante || '?'}`,
      html: montarHtmlArquetipo(dados, quando),
      text: CAMPOS_ARQ.filter(([c]) => dados[c]).map(([c, r]) => `${r}: ${dados[c]}`).join('\n')
    };
    const emailValido = dados.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(dados.email).trim());
    if (emailValido) corpoArq.reply_to = String(dados.email).trim();
    const interno = await enviar(apiKey, corpoArq, 'Arquétipo registrado: ' + (dados.dominante || '?'));

    /* Cópia do resultado para quem respondeu, no e-mail que digitou no formulário. */
    if (emailValido) {
      await enviar(apiKey, {
        from: remetente,
        to: [String(dados.email).trim()],
        reply_to: destino,
        subject: `Seu arquétipo: ${dados.dominante || 'resultado'}`,
        html: montarHtmlRespondente(dados),
        text: montarTextoRespondente(dados)
      }, 'Resultado enviado ao respondente');
    } else {
      console.log('Respondente sem e-mail válido; cópia não enviada.');
    }
    return interno;
  }

  if (formulario && formulario !== 'anamnese') {
    console.log('Formulário sem e-mail configurado:', formulario);
    return { statusCode: 200, body: 'ignorado' };
  }
  const identificacao = [dados.nome, dados.especialidade].filter(Boolean).join(' · ') || 'sem identificação';

  const corpo = {
    from: remetente,
    to: [destino],
    subject: `Anamnese — ${identificacao}`,
    html: montarHtml(dados, quando),
    text: montarTexto(dados)
  };

  /* Responder o e-mail cai direto na caixa dela, sem copiar endereço na mão. */
  if (dados.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email)) {
    corpo.reply_to = dados.email;
  }

  return enviar(apiKey, corpo, 'Briefing enviado: ' + identificacao);
};

async function enviar(apiKey, corpo, logOk) {
  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    console.error('Resend recusou o envio:', resposta.status, detalhe);
    return { statusCode: 502, body: 'falha no envio' };
  }

  console.log(logOk);
  return { statusCode: 200, body: 'ok' };
}

const CAMPOS_ARQ = [
  ['nome', 'Nome'],
  ['email', 'E-mail'],
  ['whatsapp', 'WhatsApp'],
  ['instagram', 'Instagram'],
  ['dominante', 'Arquétipo dominante'],
  ['dominante_pct', 'Aderência'],
  ['apoio', 'Arquétipos de apoio'],
  ['nitidez', 'Nitidez do resultado'],
  ['mapa', 'Mapa completo'],
  ['respostas', 'Respostas brutas']
];

function montarHtmlArquetipo(dados, quando) {
  const linhas = CAMPOS_ARQ
    .filter(([c]) => String(dados[c] ?? '').trim() !== '')
    .map(([c, rotulo]) => `<tr>
      <td style="padding:10px 16px 10px 0;vertical-align:top;width:34%;color:#5A5A62;font-size:13px;">${rotulo}</td>
      <td style="padding:10px 0;vertical-align:top;color:#16161A;font-size:15px;line-height:1.55;">${escapar(dados[c])}</td>
    </tr>`).join('');

  return `<div style="background:#EDEDEB;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#FFFFFF;padding:38px 34px;border:1px solid #D8D8D4;">
      <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#16161A;">Novo resultado de arquétipo</h1>
      <p style="margin:0 0 30px;color:#8E8E96;font-size:13px;">${escapar(quando)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${linhas}</table>
      <p style="margin:30px 0 0;padding-top:16px;border-top:1px solid #D8D8D4;color:#8E8E96;font-size:12px;">Enviado pelo Mapa de Arquétipos em fabianomartins.app.br/archetype</p>
    </div>
  </div>`;
}

const primeiroNome = (nome) => String(nome || '').trim().split(/\s+/)[0] || '';

function montarHtmlRespondente(dados) {
  const nome = primeiroNome(dados.nome);
  const linha = (rotulo, valor) => String(valor ?? '').trim() === '' ? '' : `<tr>
      <td style="padding:10px 16px 10px 0;vertical-align:top;width:34%;color:#5A5A62;font-size:13px;">${rotulo}</td>
      <td style="padding:10px 0;vertical-align:top;color:#16161A;font-size:15px;line-height:1.55;">${escapar(valor)}</td>
    </tr>`;

  return `<div style="background:#EDEDEB;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#FFFFFF;padding:38px 34px;border:1px solid #D8D8D4;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#5B3FA8;letter-spacing:.08em;">MAPA DE ARQUÉTIPOS</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:400;font-size:28px;color:#16161A;">${nome ? escapar(nome) + ', seu' : 'Seu'} arquétipo dominante é ${escapar(dados.dominante || '—')}${dados.dominante_pct ? ' · ' + escapar(dados.dominante_pct) : ''}</h1>
      <p style="margin:0 0 26px;color:#3A3A42;font-size:15px;line-height:1.6;">Obrigado por responder. Este é o registro do seu resultado.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${linha('Arquétipos de apoio', dados.apoio)}
        ${linha('Nitidez do resultado', dados.nitidez)}
        ${linha('Mapa completo', dados.mapa)}
      </table>
      <p style="margin:28px 0 0;">
        <a href="https://fabianomartins.app.br/archetype/" style="display:inline-block;background:#16161A;color:#FFFFFF;text-decoration:none;padding:12px 20px;font-size:14px;">Rever o resultado completo</a>
      </p>
      <p style="margin:30px 0 0;padding-top:16px;border-top:1px solid #D8D8D4;color:#8E8E96;font-size:12px;">
        Você recebeu este e-mail porque fez o Mapa de Arquétipos em fabianomartins.app.br. Responda esta mensagem se quiser conversar sobre o resultado.
      </p>
    </div>
  </div>`;
}

function montarTextoRespondente(dados) {
  const nome = primeiroNome(dados.nome);
  return [
    `${nome ? nome + ', seu' : 'Seu'} arquétipo dominante é ${dados.dominante || '—'}${dados.dominante_pct ? ' (' + dados.dominante_pct + ')' : ''}.`,
    dados.apoio ? `Arquétipos de apoio: ${dados.apoio}` : '',
    dados.nitidez ? `Nitidez do resultado: ${dados.nitidez}` : '',
    dados.mapa ? `Mapa completo: ${dados.mapa}` : '',
    '',
    'Rever o resultado completo: https://fabianomartins.app.br/archetype/'
  ].filter((l, i) => l !== '' || i === 4).join('\n');
}
