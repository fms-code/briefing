const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, PageBreak
} = require('docx');

/* Divide o texto em runs, destacando em amarelo tudo que estiver entre [[ ]]
   para o Fabiano localizar de relance o que precisa preencher por cliente. */
function runs(texto, base = {}) {
  return texto.split(/(\[\[.+?\]\])/g).filter(Boolean).map((pedaco) => {
    if (pedaco.startsWith('[[')) {
      return new TextRun({
        ...base,
        text: pedaco.slice(2, -2),
        bold: true,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFE9A8' }
      });
    }
    return new TextRun({ ...base, text: pedaco });
  });
}

const P = (texto, opcoes = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 130, line: 276 },
  children: runs(texto, opcoes.base || {}),
  ...opcoes.paragrafo
});

const CLAUSULA = (texto) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 140 },
  children: [new TextRun({ text: texto, bold: true, size: 22, font: 'Arial' })]
});

const TITULO = (texto, nivel = HeadingLevel.HEADING_1) => new Paragraph({
  heading: nivel,
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 260 },
  children: [new TextRun({ text: texto, bold: true, size: 26, font: 'Arial' })]
});

const LINHA_ASSINATURA = (rotulo) => [
  new Paragraph({ spacing: { before: 460 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } } }),
  new Paragraph({ spacing: { after: 40 }, children: runs(rotulo) })
];

/* ---------- tabelas ---------- */
const LARGURA = 9070;
const celula = (texto, { negrito = false, fundo = null, largura } = {}) => new TableCell({
  width: { size: largura, type: WidthType.DXA },
  shading: fundo ? { type: ShadingType.CLEAR, fill: fundo, color: 'auto' } : undefined,
  margins: { top: 90, bottom: 90, left: 110, right: 110 },
  children: [new Paragraph({
    spacing: { after: 0 },
    children: runs(texto, { bold: negrito, size: 19 })
  })]
});

const tabela = (colunas, linhas) => new Table({
  columnWidths: colunas,
  width: { size: LARGURA, type: WidthType.DXA },
  rows: linhas.map((linha, i) => new TableRow({
    tableHeader: i === 0,
    children: linha.map((txt, j) => celula(txt, {
      negrito: i === 0,
      fundo: i === 0 ? 'EDEDEB' : null,
      largura: colunas[j]
    }))
  }))
});

const doc = new Document({
  creator: 'Contrato — modelo',
  title: 'Contrato de Prestação de Serviços de Desenvolvimento de Site',
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 21 } }
    }
  },
  sections: [{
    properties: { page: { margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } },
    children: [

      TITULO('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DE SITE'),

      /* ---------------- partes ---------------- */
      CLAUSULA('DAS PARTES'),

      P('CONTRATADO: [[nome ou razão social]], [[nacionalidade, estado civil, profissão]], inscrito no [[CPF/CNPJ]] sob o nº [[000.000.000-00]], com endereço em [[endereço completo]], e-mail [[e-mail]], telefone [[telefone]], doravante denominado simplesmente CONTRATADO.'),

      P('CONTRATANTE: [[nome completo do cliente]], [[nacionalidade, estado civil]], [[profissão]], inscrito(a) no conselho profissional [[sigla e nº de inscrição]], portador(a) do CPF nº [[000.000.000-00]] [[e do CNPJ nº ..., se pessoa jurídica]], com endereço em [[endereço completo]], e-mail [[e-mail]], telefone [[telefone]], doravante denominado(a) simplesmente CONTRATANTE.'),

      P('As partes acima qualificadas têm entre si justo e contratado o presente instrumento particular de prestação de serviços, que se regerá pelas cláusulas seguintes e pelas disposições dos artigos 593 e seguintes do Código Civil.'),

      /* ---------------- 1 ---------------- */
      CLAUSULA('CLÁUSULA 1ª — DO OBJETO'),
      P('1.1. O objeto deste contrato é a prestação, pelo CONTRATADO, dos serviços de concepção, desenvolvimento, configuração e publicação de site na internet destinado à divulgação da atividade profissional do CONTRATANTE, conforme o plano [[nome do plano contratado]], cujos entregáveis estão descritos no Anexo I.'),
      P('1.2. O formulário de anamnese de marca preenchido pelo CONTRATANTE em [[data de preenchimento]] integra este contrato como Anexo III e constitui a base do escopo, da direção visual e do conteúdo do site.'),
      P('1.3. Tudo o que não estiver expressamente descrito no Anexo I não integra o objeto deste contrato e, se solicitado, será tratado na forma da cláusula 2.4.'),

      /* ---------------- 2 ---------------- */
      CLAUSULA('CLÁUSULA 2ª — DO ESCOPO, DAS REVISÕES E DAS ALTERAÇÕES'),
      P('2.1. O site será entregue com layout responsivo, adaptado à visualização em computadores, tablets e telefones celulares, e compatível com as versões estáveis mais recentes dos navegadores Google Chrome, Safari, Microsoft Edge e Mozilla Firefox.'),
      P('2.2. O CONTRATADO apresentará ao CONTRATANTE uma proposta visual inicial. A partir dela, o CONTRATANTE terá direito a [[2 (duas)]] rodadas de revisão, entendendo-se por rodada a consolidação de todos os pedidos de ajuste em uma única solicitação escrita.'),
      P('2.3. Pedidos de ajuste enviados de forma fracionada, após o encerramento de uma rodada, serão computados como nova rodada.'),
      P('2.4. Rodadas adicionais, mudanças de direção visual após aprovação, inclusão de páginas, seções ou funcionalidades não previstas no Anexo I serão orçadas à parte e somente executadas após aprovação escrita do CONTRATANTE, mediante termo aditivo ou confirmação por e-mail, que passará a integrar este contrato.'),
      P('2.5. A aprovação da proposta visual pelo CONTRATANTE é etapa vinculante do cronograma. Mudança de direção visual após essa aprovação caracteriza alteração de escopo.'),

      /* ---------------- 3 ---------------- */
      CLAUSULA('CLÁUSULA 3ª — DAS OBRIGAÇÕES DO CONTRATADO'),
      P('3.1. Executar os serviços com zelo técnico, observando as boas práticas de desenvolvimento web e os prazos ajustados na cláusula 5ª.'),
      P('3.2. Manter o CONTRATANTE informado sobre o andamento do projeto e comunicar, tão logo tenha ciência, qualquer fato que possa comprometer o cronograma.'),
      P('3.3. Entregar o site publicado e funcional no endereço eletrônico definido, com certificado de segurança (HTTPS) ativo.'),
      P('3.4. Prestar a garantia técnica prevista na cláusula 14ª.'),
      P('3.5. Guardar sigilo sobre as informações a que tiver acesso, nos termos da cláusula 13ª.'),
      P('3.6. O CONTRATADO não assume obrigação de resultado quanto a faturamento, número de visitas, captação de pacientes ou posicionamento em mecanismos de busca, tratando-se de obrigação de meio.'),

      /* ---------------- 4 ---------------- */
      CLAUSULA('CLÁUSULA 4ª — DAS OBRIGAÇÕES DO CONTRATANTE'),
      P('4.1. Fornecer, no prazo da cláusula 5.2, todo o material necessário à execução dos serviços, conforme a relação constante do Anexo II, incluindo fotografias, textos, dados de contato e arquivos de identidade visual, quando existentes.'),
      P('4.2. Responder às solicitações de aprovação do CONTRATADO no prazo de [[5 (cinco)]] dias úteis contados do envio.'),
      P('4.3. Responsabilizar-se integralmente pela veracidade, licitude e exatidão de todo o conteúdo fornecido, especialmente quanto a títulos, especializações, registros profissionais e descrição de procedimentos.'),
      P('4.4. Obter e manter arquivada autorização escrita e específica de cada paciente cuja imagem, depoimento ou caso clínico seja utilizado no site, nos termos dos artigos 20 do Código Civil e 5º, X, da Constituição Federal, apresentando-a ao CONTRATADO sempre que solicitado.'),
      P('4.5. Efetuar os pagamentos nas datas ajustadas.'),
      P('4.6. Manter atualizados os dados de contato indicados na qualificação das partes.'),

      /* ---------------- 5 ---------------- */
      CLAUSULA('CLÁUSULA 5ª — DOS PRAZOS E DO CRONOGRAMA'),
      P('5.1. O prazo estimado para entrega do site é de [[30 (trinta)]] dias corridos, contados na forma da cláusula 5.2.'),
      P('5.2. O prazo previsto na cláusula 5.1 somente começa a fluir a partir da data em que o CONTRATANTE houver entregue a integralidade do material relacionado no Anexo II e efetuado o pagamento da parcela inicial prevista na cláusula 6.2.'),
      P('5.3. O cronograma fica automaticamente suspenso durante os períodos de espera por material, informação ou aprovação de responsabilidade do CONTRATANTE, sendo o prazo final prorrogado por período igual ao da suspensão, sem qualquer ônus para o CONTRATADO.'),
      P('5.4. Decorridos [[15 (quinze)]] dias corridos de inércia do CONTRATANTE quanto a uma solicitação de aprovação, e após aviso escrito concedendo prazo adicional de 5 (cinco) dias, a etapa será considerada tacitamente aprovada, prosseguindo o projeto para a fase seguinte.'),
      P('5.5. A paralisação do projeto por inércia do CONTRATANTE por prazo superior a [[60 (sessenta)]] dias corridos faculta ao CONTRATADO considerar o contrato rescindido, aplicando-se a cláusula 15.3.'),

      /* ---------------- 6 ---------------- */
      CLAUSULA('CLÁUSULA 6ª — DO PREÇO E DA FORMA DE PAGAMENTO'),
      P('6.1. Pelos serviços descritos na cláusula 1ª, o CONTRATANTE pagará ao CONTRATADO o valor total de R$ [[0.000,00]] ([[valor por extenso]]).'),
      P('6.2. O pagamento será realizado da seguinte forma: [[50% (cinquenta por cento)]] na assinatura deste contrato, a título de sinal e início dos trabalhos, e o saldo de [[50% (cinquenta por cento)]] na data da publicação do site, mediante [[forma de pagamento: PIX, transferência, cartão em X parcelas]].'),
      P('6.3. Havendo contratação de plano com manutenção recorrente, o CONTRATANTE pagará mensalidade de R$ [[000,00]] ([[valor por extenso]]), com vencimento todo dia [[00]] de cada mês, iniciando-se em [[data]].'),
      P('6.4. Os valores recorrentes serão reajustados anualmente pela variação positiva do IPCA/IBGE, ou, na sua extinção, por índice que venha a substituí-lo.'),
      P('6.5. O atraso no pagamento de qualquer parcela sujeitará o CONTRATANTE a multa de 2% (dois por cento) sobre o valor em atraso, juros de mora de 1% (um por cento) ao mês, calculados pro rata die, e correção monetária pelo IPCA/IBGE.'),
      P('6.6. Verificado atraso superior a [[15 (quinze)]] dias, e mediante notificação prévia com prazo de 5 (cinco) dias para purgação da mora, o CONTRATADO poderá suspender a prestação dos serviços e a exibição do site, sem que tal suspensão configure inadimplemento de sua parte e sem prejuízo da cobrança dos valores devidos.'),

      /* ---------------- 7 ---------------- */
      CLAUSULA('CLÁUSULA 7ª — DOS CUSTOS DE TERCEIROS'),
      P('7.1. Salvo indicação expressa em contrário no Anexo I, não estão incluídos no preço os custos de registro e renovação de domínio, hospedagem paga, licenças de fontes tipográficas, imagens de bancos comerciais, serviços de envio de e-mail, integrações pagas e demais serviços de terceiros.'),
      P('7.2. Tais custos serão informados previamente ao CONTRATANTE e por ele suportados diretamente ou reembolsados ao CONTRATADO mediante comprovação.'),
      P('7.3. O CONTRATADO não responde por alterações de preço, de política de uso ou por descontinuidade de serviços de terceiros.'),

      /* ---------------- 8 ---------------- */
      CLAUSULA('CLÁUSULA 8ª — DO DOMÍNIO, DA HOSPEDAGEM E DA MANUTENÇÃO'),
      P('8.1. O domínio será registrado em nome e sob titularidade do CONTRATANTE, a quem pertencem, desde o registro, todos os direitos sobre ele. O CONTRATADO poderá figurar como contato técnico.'),
      P('8.2. Quando o plano contratado incluir manutenção, esta compreende: [[monitoramento de disponibilidade, atualizações de segurança, correção de falhas técnicas, pequenos ajustes de texto e troca de imagens, limitados a X solicitações ou Y horas por mês]].'),
      P('8.3. Não se incluem na manutenção: criação de novas páginas ou seções, redesenho de layout, produção de conteúdo, campanhas de mídia paga e desenvolvimento de novas funcionalidades.'),
      P('8.4. A disponibilidade do site depende de serviços de infraestrutura prestados por terceiros. O CONTRATADO não garante disponibilidade ininterrupta e não responde por indisponibilidade decorrente de falha de provedor de hospedagem, de registro de domínio, de conectividade ou de eventos alheios ao seu controle, comprometendo-se a envidar os melhores esforços para o restabelecimento.'),

      /* ---------------- 9 ---------------- */
      CLAUSULA('CLÁUSULA 9ª — DO CONTEÚDO E DA RESPONSABILIDADE PROFISSIONAL'),
      P('9.1. O conteúdo publicado no site é de exclusiva responsabilidade do CONTRATANTE, que declara deter todos os direitos e autorizações necessários à sua veiculação.'),
      P('9.2. O CONTRATANTE declara conhecer e obriga-se a observar as normas de publicidade e propaganda do seu conselho profissional, respondendo com exclusividade por eventual sanção ético-disciplinar decorrente do conteúdo publicado, inclusive quanto à divulgação de imagens de casos clínicos, uso de expressões que possam configurar promessa de resultado, concorrência desleal ou mercantilização da profissão.'),
      P('9.3. O CONTRATADO poderá alertar o CONTRATANTE sobre conteúdo que aparente conflitar com tais normas, sem que isso configure assunção de responsabilidade ou dever de fiscalização, e poderá recusar-se a publicar conteúdo manifestamente ilícito, ofensivo ou que viole direito de terceiro.'),
      P('9.4. O CONTRATANTE isenta o CONTRATADO de qualquer responsabilidade perante terceiros, conselhos profissionais e autoridades administrativas ou judiciais em razão do conteúdo por ele fornecido, obrigando-se a reembolsá-lo de custos, despesas e condenações que venha a suportar por esse motivo.'),

      /* ---------------- 10 ---------------- */
      CLAUSULA('CLÁUSULA 10ª — DA PROPRIEDADE INTELECTUAL'),
      P('10.1. Quitado integralmente o preço, o CONTRATADO cede ao CONTRATANTE, em caráter definitivo e para todo o território nacional e exterior, os direitos patrimoniais de autor sobre o layout, os arquivos e o código-fonte desenvolvidos especificamente para este projeto, nos termos da Lei nº 9.610/1998.'),
      P('10.2. Enquanto não houver quitação integral, o CONTRATANTE detém mera licença precária de uso, revogável na hipótese da cláusula 6.6.'),
      P('10.3. Não são objeto de cessão: componentes de terceiros, bibliotecas de código aberto, fontes tipográficas e imagens licenciadas, que permanecem regidos por suas próprias licenças; nem os métodos, modelos, ferramentas e conhecimentos preexistentes do CONTRATADO, que poderá reutilizá-los livremente em outros projetos.'),
      P('10.4. Os direitos morais de autor do CONTRATADO são inalienáveis e irrenunciáveis, na forma do artigo 27 da Lei nº 9.610/1998.'),

      /* ---------------- 11 ---------------- */
      CLAUSULA('CLÁUSULA 11ª — DO USO EM PORTFÓLIO'),
      P('11.1. O CONTRATANTE autoriza o CONTRATADO a exibir o trabalho desenvolvido em seu portfólio, sítio eletrônico, redes sociais e propostas comerciais, com menção ao nome do CONTRATANTE, para fins exclusivos de demonstração de capacidade técnica.'),
      P('11.2. A autorização da cláusula 11.1 não abrange dados de pacientes, informações financeiras ou material expressamente identificado como confidencial, e pode ser revogada a qualquer tempo por comunicação escrita do CONTRATANTE.'),

      /* ---------------- 12 ---------------- */
      CLAUSULA('CLÁUSULA 12ª — DA PROTEÇÃO DE DADOS PESSOAIS'),
      P('12.1. As partes obrigam-se a observar a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).'),
      P('12.2. Para os fins da LGPD, o CONTRATANTE é o controlador dos dados pessoais coletados por meio do site, cabendo-lhe definir as finalidades e os meios do tratamento; o CONTRATADO atua como operador, tratando os dados exclusivamente conforme as instruções do controlador e na medida necessária à execução deste contrato.'),
      P('12.3. O CONTRATADO adotará medidas técnicas e administrativas de segurança compatíveis com a natureza dos dados tratados e obriga-se a não utilizá-los para finalidade diversa da contratada.'),
      P('12.4. Na hipótese de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, o CONTRATADO comunicará o CONTRATANTE em até [[48 (quarenta e oito)]] horas do conhecimento do fato, prestando as informações necessárias ao cumprimento do artigo 48 da LGPD.'),
      P('12.5. O CONTRATANTE declara ciência de que dados referentes à saúde são dados pessoais sensíveis, nos termos do artigo 5º, II, da LGPD, e responsabiliza-se por definir as bases legais do tratamento realizado por meio de formulários do site, bem como pela publicação de política de privacidade adequada à sua atividade.'),
      P('12.6. Encerrado o contrato, o CONTRATADO eliminará ou devolverá ao CONTRATANTE os dados pessoais a que tiver acesso, salvo obrigação legal de retenção.'),

      /* ---------------- 13 ---------------- */
      CLAUSULA('CLÁUSULA 13ª — DA CONFIDENCIALIDADE'),
      P('13.1. As partes obrigam-se a manter sigilo sobre informações comerciais, técnicas, financeiras e estratégicas a que tiverem acesso em razão deste contrato, obrigação que subsiste por [[2 (dois)]] anos após o seu término.'),
      P('13.2. Não se considera violação a divulgação exigida por lei, ordem judicial ou autoridade competente, hipótese em que a parte notificada informará a outra previamente, sempre que possível.'),

      /* ---------------- 14 ---------------- */
      CLAUSULA('CLÁUSULA 14ª — DA GARANTIA TÉCNICA'),
      P('14.1. O CONTRATADO garante, pelo prazo de [[90 (noventa)]] dias corridos contados da publicação do site, a correção sem custo adicional de defeitos de funcionamento que lhe sejam imputáveis.'),
      P('14.2. A garantia não abrange: alterações de conteúdo, inclusão de novas funcionalidades, defeitos decorrentes de alterações realizadas pelo CONTRATANTE ou por terceiros, falhas de serviços de terceiros, uso indevido, ataques cibernéticos e casos fortuitos ou de força maior.'),
      P('14.3. Os defeitos deverão ser comunicados por escrito, com descrição do problema, para o e-mail indicado na qualificação das partes.'),

      /* ---------------- 15 ---------------- */
      CLAUSULA('CLÁUSULA 15ª — DA VIGÊNCIA E DA RESCISÃO'),
      P('15.1. Este contrato vigora a partir da data de sua assinatura e extingue-se com a entrega do site e a quitação integral do preço, permanecendo em vigor por prazo indeterminado, quanto à manutenção recorrente, se contratada.'),
      P('15.2. Qualquer das partes poderá rescindir imotivadamente a parcela recorrente do contrato mediante comunicação escrita com antecedência mínima de [[30 (trinta)]] dias, permanecendo devidos os valores até o término do aviso.'),
      P('15.3. Em caso de rescisão imotivada pelo CONTRATANTE antes da entrega do site, serão retidos os valores já pagos, a título de remuneração das etapas executadas, e será devida multa compensatória de [[20% (vinte por cento)]] sobre o saldo remanescente do preço.'),
      P('15.4. Em caso de rescisão por descumprimento contratual, a parte inadimplente responderá por multa de [[20% (vinte por cento)]] sobre o valor total do contrato, sem prejuízo das perdas e danos que vierem a ser apuradas.'),
      P('15.5. Rescindido o contrato antes da quitação, não se opera a cessão prevista na cláusula 10.1, permanecendo o material desenvolvido sob titularidade exclusiva do CONTRATADO.'),

      /* ---------------- 16 ---------------- */
      CLAUSULA('CLÁUSULA 16ª — DA LIMITAÇÃO DE RESPONSABILIDADE'),
      P('16.1. A responsabilidade do CONTRATADO por perdas e danos decorrentes deste contrato fica limitada ao valor total efetivamente pago pelo CONTRATANTE nos 12 (doze) meses anteriores ao evento danoso.'),
      P('16.2. Nenhuma das partes responderá por lucros cessantes, perda de oportunidade comercial ou danos indiretos.'),
      P('16.3. A limitação prevista nesta cláusula não se aplica às hipóteses de dolo.'),

      /* ---------------- 17 ---------------- */
      CLAUSULA('CLÁUSULA 17ª — DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO'),
      P('17.1. Este contrato não gera vínculo empregatício, societário ou de representação entre as partes, atuando o CONTRATADO com autonomia técnica, sem subordinação, pessoalidade ou exclusividade, respondendo por seus próprios encargos fiscais, trabalhistas e previdenciários.'),

      /* ---------------- 18 ---------------- */
      CLAUSULA('CLÁUSULA 18ª — DO CASO FORTUITO E DA FORÇA MAIOR'),
      P('18.1. Nenhuma das partes responderá pelo descumprimento de obrigações decorrente de caso fortuito ou força maior, nos termos do artigo 393 do Código Civil, devendo comunicar a outra parte tão logo tenha ciência do evento e retomar o cumprimento assim que cessados os efeitos.'),

      /* ---------------- 19 ---------------- */
      CLAUSULA('CLÁUSULA 19ª — DAS COMUNICAÇÕES'),
      P('19.1. As comunicações operacionais do projeto poderão ser feitas por e-mail ou aplicativo de mensagens, nos contatos indicados na qualificação das partes, tendo validade entre elas.'),
      P('19.2. Notificações de natureza contratual — em especial as relativas a mora, suspensão e rescisão — deverão ser feitas por e-mail com confirmação de recebimento ou por carta registrada.'),

      /* ---------------- 20 ---------------- */
      CLAUSULA('CLÁUSULA 20ª — DAS DISPOSIÇÕES GERAIS'),
      P('20.1. A tolerância de qualquer das partes quanto ao descumprimento de obrigação não implica novação, renúncia ou alteração do pactuado.'),
      P('20.2. A eventual nulidade de qualquer cláusula não afeta a validade das demais.'),
      P('20.3. Nenhuma das partes poderá ceder ou transferir a terceiros os direitos e obrigações deste contrato sem anuência escrita da outra.'),
      P('20.4. Toda alteração deste contrato somente terá validade se formalizada por escrito, ressalvado o disposto na cláusula 2.4.'),
      P('20.5. Os Anexos I, II e III integram este contrato para todos os efeitos.'),

      /* ---------------- 21 ---------------- */
      CLAUSULA('CLÁUSULA 21ª — DA ASSINATURA ELETRÔNICA'),
      P('21.1. As partes reconhecem como válida e eficaz a assinatura deste contrato por meio eletrônico, ainda que sem certificado ICP-Brasil, nos termos do artigo 10, § 2º, da Medida Provisória nº 2.200-2/2001 e do artigo 6º da Lei nº 14.063/2020, comprometendo-se a não impugnar sua autenticidade por esse fundamento.'),

      /* ---------------- 22 ---------------- */
      CLAUSULA('CLÁUSULA 22ª — DO FORO'),
      P('22.1. Fica eleito o foro da Comarca de [[cidade/UF]] para dirimir as controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.'),

      P('E, por estarem justas e contratadas, as partes assinam o presente instrumento, na presença de duas testemunhas.', { paragrafo: { spacing: { before: 300, after: 200 } } }),

      P('[[cidade]], [[00]] de [[mês]] de [[ano]].', { paragrafo: { alignment: AlignmentType.RIGHT, spacing: { after: 200 } } }),

      ...LINHA_ASSINATURA('CONTRATADO — [[nome]]'),
      ...LINHA_ASSINATURA('CONTRATANTE — [[nome]]'),

      new Paragraph({ spacing: { before: 340, after: 60 }, children: [new TextRun({ text: 'TESTEMUNHAS', bold: true })] }),
      ...LINHA_ASSINATURA('Nome: [[nome]] — CPF: [[000.000.000-00]]'),
      ...LINHA_ASSINATURA('Nome: [[nome]] — CPF: [[000.000.000-00]]'),

      /* ================= ANEXO I ================= */
      new Paragraph({ children: [new PageBreak()] }),
      TITULO('ANEXO I — PLANOS, ENTREGÁVEIS E VALORES'),

      P('Assinale abaixo o plano contratado. O plano assinalado define o escopo a que se refere a cláusula 1.1.'),

      tabela([1300, 4200, 1800, 1770], [
        ['Plano', 'Entregáveis', 'Valor', 'Prazo'],
        ['(     )  Essencial', 'Página única, até [[6]] seções, formulário de contato, botão de WhatsApp, otimização básica para busca, publicação e certificado HTTPS.', 'R$ [[0.000,00]]', '[[20]] dias'],
        ['(     )  Clínico', 'Tudo do Essencial, mais galeria de antes e depois, seção de depoimentos, relatório mensal de visitas e domínio próprio configurado.', 'R$ [[0.000,00]]', '[[30]] dias'],
        ['(     )  Completo', 'Tudo do Clínico, mais e-mail automático de boas-vindas, cadastro de interessadas, redação de todos os textos e acompanhamento de [[3]] meses.', 'R$ [[0.000,00]]', '[[45]] dias']
      ]),

      P('', { paragrafo: { spacing: { after: 120 } } }),

      tabela([3200, 5870], [
        ['Manutenção mensal (opcional)', 'Descrição'],
        ['R$ [[000,00]] / mês', '[[Hospedagem, monitoramento, atualizações de segurança, backup e até X alterações de conteúdo por mês.]]']
      ]),

      P('Observações e itens negociados fora da tabela: [[descrever]]', { paragrafo: { spacing: { before: 200 } } }),

      /* ================= ANEXO II ================= */
      new Paragraph({ children: [new PageBreak()] }),
      TITULO('ANEXO II — MATERIAL A SER FORNECIDO PELO CONTRATANTE'),

      P('O prazo de execução previsto na cláusula 5.1 somente se inicia após a entrega integral dos itens assinalados abaixo como necessários.'),

      tabela([700, 5570, 1400, 1400], [
        ['Nº', 'Item', 'Entregue em', 'Rubrica'],
        ['01', 'Fotografias dos casos clínicos, em alta resolução', '', ''],
        ['02', 'Autorizações escritas de uso de imagem das pacientes', '', ''],
        ['03', 'Fotografia de apresentação do profissional', '', ''],
        ['04', 'Textos institucionais, quando não contratada a redação', '', ''],
        ['05', 'Depoimentos de pacientes, quando aplicável', '', ''],
        ['06', 'Arquivos de identidade visual (logo, manual de marca)', '', ''],
        ['07', 'Dados de contato, endereço e horários de atendimento', '', ''],
        ['08', 'Relação de procedimentos a serem divulgados', '', ''],
        ['09', 'Acessos a domínio e hospedagem, quando já existentes', '', ''],
        ['10', '[[outro]]', '', '']
      ]),

      /* ================= ANEXO III ================= */
      new Paragraph({ children: [new PageBreak()] }),
      TITULO('ANEXO III — ANAMNESE DE MARCA'),

      P('Integra este contrato, como Anexo III, o formulário de anamnese de marca preenchido pelo CONTRATANTE em [[data]], cujas respostas orientam a direção visual, o conteúdo e as funcionalidades do site.'),
      P('Declaro que as informações prestadas na anamnese são verdadeiras e que estou ciente de que orientam as decisões de projeto.'),
      P('Cópia do formulário preenchido: [[anexar impressão ou indicar o link]]'),

      ...LINHA_ASSINATURA('CONTRATANTE — [[nome]]')
    ]
  }]
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('/home/user/briefing/contratos/contrato-desenvolvimento-site.docx', buf);
  console.log('gerado:', buf.length, 'bytes');
});
