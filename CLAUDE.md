# Regras de Front-End e SEO Técnico para páginas de HOF

Sempre que gerar código, componentes ou estruturas de páginas de Harmonização
Orofacial (HOF) — ou de clínicas estéticas em geral — neste repositório,
siga rigorosamente as regras abaixo. Elas valem para toda branch criada a
partir da `main`.

## 1. Hierarquia semântica rígida
- Apenas uma tag `<h1>` por página, contendo `[Procedimento/Nome + Cidade]`.
- Subdividir o conteúdo com `<h2>` e `<h3>`, incluindo as seções de
  perguntas frequentes (FAQs) e de benefícios.

## 2. Performance (Core Web Vitals)
- Imagens de "Antes e Depois" com `loading="lazy"`.
- Formatos modernos (WebP, com fallback quando necessário).
- Sempre declarar `width`/`height` (ou `aspect-ratio`) explícitos nas tags
  de imagem para evitar layout shift (CLS).

## 3. SEO local on-page
- `<footer>` estruturado com o endereço físico completo em texto,
  idêntico ao cadastrado no Google Maps.
- Link de clique direto para o WhatsApp (`https://wa.me/...`).

## 4. Schema markup
- Quando aplicável, gerar JSON-LD na categoria `MedicalBusiness` ou
  `BeautySalon`, incluindo `name`, `address`, `geo` (latitude/longitude) e
  `openingHours`.
