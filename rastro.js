/*
 * Métricas próprias do site, sem cookies e sem dados pessoais: cada aba do
 * navegador ganha um id aleatório (sessionStorage) e manda poucos eventos
 * para /api/evento — visita, início do formulário, etapas, envio e erro.
 * As páginas chamam window.rastro(tipo, etapa); eventos repetidos na mesma
 * página são ignorados.
 */
(function () {
  /* Resultado reaberto pelo link (?r=…) não é visita nova ao teste. */
  if (/[?&]r=/.test(location.search) && /\/archetype\//.test(location.pathname)) {
    window.rastro = function () {};
    return;
  }
  var sessao;
  try {
    sessao = sessionStorage.getItem('rastro-sessao');
    if (!sessao) {
      sessao = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('rastro-sessao', sessao);
    }
  } catch (e) {
    sessao = 'x' + Math.random().toString(36).slice(2);
  }

  var pagina = location.pathname.replace(/index\.html$/, '') || '/';
  var origem = '';
  try {
    origem = new URLSearchParams(location.search).get('utm_source') || '';
    if (!origem && document.referrer) {
      var host = new URL(document.referrer).host;
      if (host !== location.host) origem = host;
    }
  } catch (e) {}
  var disp = window.matchMedia && matchMedia('(max-width: 760px)').matches ? 'celular' : 'computador';
  var vistos = {};

  window.rastro = function (tipo, etapa) {
    var chave = tipo + '|' + (etapa || '');
    if (vistos[chave]) return;
    vistos[chave] = 1;
    var corpo = JSON.stringify({ tipo: tipo, etapa: etapa || '', pagina: pagina, sessao: sessao, origem: origem, disp: disp });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/evento', new Blob([corpo], { type: 'application/json' }))) return;
    } catch (e) {}
    try { fetch('/api/evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true }); } catch (e) {}
  };

  window.rastro('visita');
})();
