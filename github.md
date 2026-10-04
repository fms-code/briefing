# fms-code/briefing

Site estático publicado no Netlify em `fabianomartins.app.br` (publish = raiz do repo).

## Last sync
2026-10-04 — rota `/archetype/` (Mapa de Arquétipos) implementada a partir do
handoff de design; function `submission-created` passa a tratar os formulários
`anamnese` e `arquetipo`.

## Screen map

| Rota | Arquivo | Telas | Formulário Netlify | Indexação |
|---|---|---|---|---|
| `/` | `index.html` | Landing (Método, Entregas, Planos, Trabalhos, Cerne, Quem sou) | — | index |
| `/briefing/` | `briefing/index.html` | Anamnese de marca (8 seções) → Obrigado | `anamnese` | index |
| `/archetype/` | `archetype/index.html` | Intro → 36 perguntas → Dados de contato → Resultado → Detalhe do arquétipo | `arquetipo` | `noindex` até entrar no link da landing |
| `/respostas` | `netlify/functions/respostas.mjs` | Painel interno: abas Arquétipos e Anamnese | — | `noindex` + senha |

## Envio por e-mail
`netlify/functions/submission-created.js` roda a cada envio e manda o e-mail via
Resend, escolhendo o modelo pelo `form_name`:

- `anamnese` → "Anamnese — {nome} · {especialidade}"
- `arquetipo` → "Arquétipo — {nome} · {dominante}" para `BRIEFING_TO` **e** "Seu arquétipo: {dominante}"
  para o e-mail que a pessoa digitou no formulário (só se o endereço for válido)
- qualquer outro → ignorado (registrado no log)

Variáveis de ambiente: `RESEND_API_KEY`, `BRIEFING_TO`, `BRIEFING_FROM`.
`BRIEFING_FROM` precisa ser de um domínio verificado no Resend com envio habilitado;
caso contrário o Resend só entrega para o dono da conta.

## Painel de respostas
`/respostas` (`netlify/functions/respostas.mjs`) mostra quem respondeu cada formulário,
com uma aba para **Mapa de Arquétipos** e outra para **Anamnese de marca**: totais,
busca, detalhe de cada resposta (anamnese organizada pelas 8 seções, com os textos
legíveis) e exportação CSV. Lê direto do Netlify Forms, então inclui o histórico todo.
Protegido por senha (Basic Auth, qualquer usuário).

Variáveis de ambiente: `PAINEL_SENHA` e `NETLIFY_TOKEN` (personal access token do Netlify).

Rótulos e seções da anamnese ficam em `netlify/lib/anamnese.js`, compartilhado entre
o e-mail e o painel.
