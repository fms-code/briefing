/**
 * Recebe os eventos de rastro.js (visitas, início, etapas, envio e erro dos
 * formulários) e grava no Netlify Blobs. Responde 204 sempre que possível:
 * métrica nunca pode atrapalhar a página.
 */

import { getStore } from '@netlify/blobs';
import metricas from '../lib/metricas.js';

const TIPOS = ['visita', 'inicio', 'etapa', 'envio', 'erro_envio'];
const PAGINAS = ['/', '/briefing/', '/archetype/'];
const ROBO = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;

export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (ROBO.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204 });

  try {
    const texto = await req.text();
    if (texto.length > 2000) return new Response(null, { status: 413 });
    const ev = JSON.parse(texto);
    if (!TIPOS.includes(ev.tipo) || !PAGINAS.includes(ev.pagina) || !/^[a-z0-9]{6,40}$/i.test(String(ev.sessao))) {
      return new Response(null, { status: 400 });
    }
    await metricas.registrar(getStore('metricas'), {
      tipo: ev.tipo,
      pagina: ev.pagina,
      sessao: ev.sessao,
      etapa: ev.etapa,
      origem: ev.origem,
      disp: ev.disp === 'celular' ? 'celular' : 'computador'
    });
  } catch (e) {
    console.error('Evento descartado:', e.message);
  }
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/evento' };
