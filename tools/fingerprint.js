/* =============================================================================
   Huella de layout – pegar en la consola del navegador
   -----------------------------------------------------------------------------
   Define window.__fp(selectoresDeSección, nombre). Recorre la página y manda al
   colector (http://localhost:5599) la posición y el estilo de cada texto,
   imagen, video, campo y botón, relativos a su sección.

   Uso:
     1. node tools/collector.js
     2. pega este archivo en la consola
     3. __fp(SECCIONES_ORIGINAL, 'orig')     // en el sitio original
        __fp(SECCIONES_REPLICA, 'replica')   // en la réplica
     4. node tools/diff.js replica orig
   ========================================================================== */

window.__fp = function (sectionSelectors, name) {
  // Neutraliza las animaciones de entrada para medir el estado final
  var st = document.createElement('style');
  st.textContent =
    '.elementor-invisible,.reveal{visibility:visible!important;opacity:1!important;transform:none!important;animation:none!important}';
  document.head.appendChild(st);
  document.querySelectorAll('.reveal').forEach(function (e) {
    e.classList.add('is-visible');
  });

  // Normaliza el texto para poder emparejar elementos entre las dos páginas
  var norm = function (s) {
    return s.replace(/\s+/g, ' ').replace(/^[✓*\s]+/, '').trim();
  };
  var sleep = function (ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  };

  return (async function () {
    // Recorre la página para forzar la carga de imágenes lazy
    var H = document.documentElement.scrollHeight;
    for (var y = 0; y < H; y += 500) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await sleep(60);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await sleep(500);

    var secs = sectionSelectors.map(function (s) {
      return document.querySelector(s);
    });
    var tops = secs.map(function (s) {
      return s ? s.getBoundingClientRect().top : 0;
    });
    var sizes = secs.map(function (s) {
      var r = s ? s.getBoundingClientRect() : null;
      return r ? [Math.round(r.width), Math.round(r.height)] : null;
    });
    var sectionOf = function (el) {
      for (var i = 0; i < secs.length; i++) if (secs[i] && secs[i].contains(el)) return i;
      return -1;
    };

    var items = [];
    var push = function (kind, key, el, rect, extra) {
      var si = sectionOf(el);
      if (si < 0) return;
      var cs = getComputedStyle(el);
      items.push(
        Object.assign(
          {
            k: kind,
            key: key,
            s: si,
            x: Math.round(rect.left),
            y: Math.round(rect.top - tops[si]),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            ff: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
            fs: cs.fontSize,
            fw: cs.fontWeight,
            lh: cs.lineHeight,
            ta: cs.textAlign,
            c: cs.color,
          },
          extra || {}
        )
      );
    };

    // 1. Nodos de texto: el rect se saca con Range, así da igual el envoltorio
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var t = norm(n.textContent);
      if (!t) continue;
      var p = n.parentElement;
      if (!p) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(p.tagName)) continue;
      var cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var rg = document.createRange();
      rg.selectNodeContents(n);
      var r = rg.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) continue;
      if (r.left < -500) continue; // fuera de pantalla (skip-link, honeypot)
      push('t', t.slice(0, 70), p, r);
    }

    // 2. Imágenes
    Array.prototype.forEach.call(document.images, function (img) {
      var r = img.getBoundingClientRect();
      if (r.width < 2) return;
      var f = (img.currentSrc || img.src).split('/').pop().split('?')[0];
      push('img', f, img, r, {
        nat: img.naturalWidth + 'x' + img.naturalHeight,
        rad: getComputedStyle(img).borderRadius,
      });
    });

    // 3. Videos (iframe en el original, facade en la réplica)
    var vids = document.querySelectorAll('iframe[src*="youtube"],.video[data-video-id]');
    Array.prototype.forEach.call(vids, function (v, i) {
      var r = v.getBoundingClientRect();
      if (r.width < 2) return;
      push('video', 'video' + i, v, r, { rad: getComputedStyle(v).borderRadius });
    });

    // 4. Campos del formulario
    document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.width < 2 || r.left < -500) return;
      var nm = (f.name || f.id || '').replace(/^form_fields\[|\]$/g, '');
      var cs = getComputedStyle(f);
      push('field', nm, f, r, { rad: cs.borderRadius, bg: cs.backgroundColor, pad: cs.padding });
    });

    // 5. Botones y CTAs
    document
      .querySelectorAll(
        'a[class*=button],a[class*=btn],button[class*=button],button[class*=btn],button[type=submit]'
      )
      .forEach(function (b) {
        var r = b.getBoundingClientRect();
        if (r.width < 2 || r.left < -500) return;
        var cs = getComputedStyle(b);
        push('btn', norm(b.textContent).slice(0, 30) || '(sin texto)', b, r, {
          rad: cs.borderRadius,
          bg: cs.backgroundColor,
          pad: cs.padding,
        });
      });

    var payload = {
      name: name,
      vw: innerWidth,
      docW: document.documentElement.scrollWidth,
      docH: document.documentElement.scrollHeight,
      sections: sizes,
      items: items,
    };
    await fetch('http://localhost:5599/fp?name=' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return 'enviado ' + name + ': ' + items.length + ' elementos, docH=' + payload.docH;
  })();
};

/* --------------------------------------------------------------------------
   Selectores de sección, en el mismo orden en las dos páginas:
   header, hero, franja, testimonios, resultados, cómo funciona,
   por qué elegirnos, CTA, cuotas, footer
   -------------------------------------------------------------------------- */

window.SECCIONES_ORIGINAL = [
  '.elementor-element-4e0348d7',
  '.elementor-element-25e3632e',
  '.elementor-element-526350c',
  '.elementor-element-6ddd2653',
  '.elementor-element-ef964f8',
  '.elementor-element-6c5f19d8',
  '.elementor-element-4a7d9727',
  '.elementor-element-5d0e9b6',
  '.elementor-element-b7495f5',
  '.elementor-element-1ee8874',
];

window.SECCIONES_REPLICA = [
  '.site-header',
  '.hero',
  '.claim',
  '.testimonials',
  '.results',
  '.how',
  '.why',
  '.cta',
  '.installments',
  '.site-footer',
];
