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

## Envio por e-mail
`netlify/functions/submission-created.js` roda a cada envio e manda o e-mail via
Resend, escolhendo o modelo pelo `form_name`:

- `anamnese` → "Anamnese — {nome} · {especialidade}"
- `arquetipo` → "Arquétipo — {nome} · {dominante}"
- qualquer outro → ignorado (registrado no log)

Variáveis de ambiente: `RESEND_API_KEY`, `BRIEFING_TO`, `BRIEFING_FROM`.
