/* =============================================================================
   Clínica Témpora – JS de la landing (vanilla, sin dependencias)
   -----------------------------------------------------------------------------
   01. Utilidades
   02. Menú móvil
   03. Animaciones de entrada
   04. Contadores
   05. Carruseles
   06. Videos de YouTube (facade)
   07. Formulario multi-paso + envío del lead
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.TEMPORA_CONFIG || {};
  var OPTS = CONFIG.options || {};
  var PENDING_KEY = "tempora_pending_leads";

  /* ==========================================================================
     01. UTILIDADES
     ====================================================================== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 150);
    };
  }

  /* ==========================================================================
     02. MENÚ MÓVIL
     ====================================================================== */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;

    /* El panel se despliega animando max-height. Como no se puede animar
       height:auto, medimos el contenido y lo publicamos en --nav-h. */
    function measure() {
      nav.style.setProperty("--nav-h", nav.scrollHeight + "px");
    }

    function setOpen(open) {
      if (open) measure();
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Cerrar al navegar a una sección
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    // Cerrar con Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Al pasar a escritorio el panel deja de aplicar: limpiamos el estado
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth > 1024) setOpen(false);
      else if (nav.classList.contains("is-open")) measure();
    }, 150));
  }

  /* ==========================================================================
     03. ANIMACIONES DE ENTRADA
     ====================================================================== */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     04. CONTADORES
     ====================================================================== */
  function animateCounter(el) {
    var to = parseFloat(el.dataset.to || "0");
    var duration = parseInt(el.dataset.duration || "2000", 10);

    if (prefersReducedMotion) { el.textContent = String(to); return; }

    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // easeOutQuad
      var eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = String(Math.round(to * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = $$(".counter");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     05. CARRUSELES
     ====================================================================== */
  function initCarousel(root) {
    var track = $(".carousel__track", root);
    var slides = $$(".carousel__slide", root);
    var prev = $(".carousel__arrow--prev", root);
    var next = $(".carousel__arrow--next", root);
    var dotsWrap = $(".carousel__dots", root);
    if (!track || !slides.length) return;

    var GAP = 10;
    var index = 0;
    var autoplayMs = parseInt(root.dataset.autoplay || "0", 10);
    var timer = null;

    function perView() {
      var w = window.innerWidth;
      if (w <= 767) return parseInt(root.dataset.perViewMobile || root.dataset.perView || "1", 10);
      if (w <= 1024) return parseInt(root.dataset.perViewTablet || root.dataset.perView || "1", 10);
      return parseInt(root.dataset.perView || "1", 10);
    }

    function maxIndex() { return Math.max(0, slides.length - perView()); }

    function layout() {
      var pv = perView();
      var width = "calc((100% - " + (GAP * (pv - 1)) + "px) / " + pv + ")";
      slides.forEach(function (s) { s.style.setProperty("--slide-width", width); });
      index = Math.min(index, maxIndex());
      render();
    }

    function step() { return slides[0].getBoundingClientRect().width + GAP; }

    function render() {
      track.style.transform = "translate3d(" + (-index * step()) + "px,0,0)";

      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();

      if (dotsWrap) {
        $$(".carousel__dot", dotsWrap).forEach(function (dot, i) {
          var active = i === index;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", String(active));
        });
      }
    }

    function goTo(i) {
      var max = maxIndex();
      index = i < 0 ? max : (i > max ? 0 : i);
      render();
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      var total = maxIndex() + 1;
      if (total < 2) return;
      for (var i = 0; i < total; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Ir al slide " + (i + 1));
        dot.dataset.index = String(i);
        dot.addEventListener("click", function () {
          goTo(parseInt(this.dataset.index, 10));
          restartAutoplay();
        });
        dotsWrap.appendChild(dot);
      }
    }

    function startAutoplay() {
      if (!autoplayMs || prefersReducedMotion) return;
      timer = setInterval(function () { goTo(index + 1); }, autoplayMs);
    }
    function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    if (prev) prev.addEventListener("click", function () { goTo(index - 1); restartAutoplay(); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); restartAutoplay(); });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);

    /* ---- Arrastre con mouse y con el dedo -------------------------------
       Un solo camino con Pointer Events. El CSS pone touch-action: pan-y en
       la pista, así que el navegador se queda el scroll vertical y nosotros
       el gesto horizontal. ------------------------------------------------ */
    var drag = { active: false, id: null, startX: 0, base: 0, moved: 0 };
    var DRAG_THRESHOLD = 8;   // a partir de aquí es arrastre y no click
    var SWIPE_MIN = 40;       // recorrido mínimo para cambiar de slide

    function dragStart(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.active = true;
      drag.id = e.pointerId;
      drag.startX = e.clientX;
      drag.base = -index * step();
      drag.moved = 0;
      track.style.transition = "none";
      root.classList.add("is-dragging");
      stopAutoplay();
    }

    function dragMove(e) {
      if (!drag.active || e.pointerId !== drag.id) return;
      drag.moved = e.clientX - drag.startX;
      var min = -maxIndex() * step();
      var offset = drag.base + drag.moved;
      // resistencia al pasarse de los extremos
      if (offset > 0) offset *= 0.35;
      else if (offset < min) offset = min + (offset - min) * 0.35;
      track.style.transform = "translate3d(" + offset + "px,0,0)";
    }

    function dragEnd(e) {
      if (!drag.active || (e && e.pointerId !== drag.id)) return;
      // el último pointermove puede quedarse corto en un gesto rápido
      if (e && e.type === "pointerup") drag.moved = e.clientX - drag.startX;
      drag.active = false;
      track.style.transition = "";
      root.classList.remove("is-dragging");
      if (Math.abs(drag.moved) > SWIPE_MIN) goTo(index + (drag.moved < 0 ? 1 : -1));
      else render();
      startAutoplay();
    }

    track.addEventListener("pointerdown", dragStart);
    window.addEventListener("pointermove", dragMove);
    window.addEventListener("pointerup", dragEnd);
    // el navegador se queda el gesto (scroll vertical): volvemos al sitio
    track.addEventListener("pointercancel", function (e) {
      if (!drag.active) return;
      drag.moved = 0;
      dragEnd(e);
    });

    // Si hubo arrastre, el click no debe abrir el video
    track.addEventListener("click", function (e) {
      if (Math.abs(drag.moved) > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Evita el "fantasma" de arrastrar la imagen con el mouse
    $$("img", track).forEach(function (img) { img.setAttribute("draggable", "false"); });

    // Teclado
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { goTo(index - 1); restartAutoplay(); }
      if (e.key === "ArrowRight") { goTo(index + 1); restartAutoplay(); }
    });

    window.addEventListener("resize", debounce(function () { buildDots(); layout(); }, 150));

    buildDots();
    layout();
    startAutoplay();
  }

  function initCarousels() { $$("[data-carousel]").forEach(initCarousel); }

  /* ==========================================================================
     06. VIDEOS DE YOUTUBE (se carga el iframe sólo al hacer click)
     ====================================================================== */
  function initVideos() {
    $$(".video[data-video-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.videoId;
        if (!id || btn.dataset.loaded === "true") return;
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + id +
          "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
        iframe.title = "Video de Clínica Témpora";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        btn.innerHTML = "";
        btn.appendChild(iframe);
        btn.dataset.loaded = "true";
        btn.style.cursor = "default";
      });
    });
  }

  /* ==========================================================================
     07. FORMULARIO MULTI-PASO
     ====================================================================== */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  function fieldOf(step) { return $("input, select, textarea", step); }

  function validateField(input) {
    if (!input) return null;
    var value = (input.value || "").trim();

    if (input.required && !value) return "Este campo es obligatorio.";

    if (input.type === "email" && !EMAIL_RE.test(value)) {
      return "Ingresa un email válido.";
    }
    if (input.type === "tel") {
      var digits = value.replace(/\D/g, "");
      if (digits.length !== 9) return "El teléfono debe tener 9 dígitos (ej: 912345678).";
    }
    if ((input.name === "nombre" || input.name === "apellido") && value.length < 2) {
      return "Ingresa al menos 2 caracteres.";
    }
    return null;
  }

  function readUtm(form) {
    var params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
      var input = form.querySelector('input[name="' + key + '"]');
      if (input) input.value = params.get(key) || "";
    });
    var campaign = form.querySelector('input[name="campaign_id"]');
    if (campaign) campaign.value = params.get("campaign_id") || params.get("gclid") || "";
  }

  /**
   * Arma el payload. Los campos vacíos se omiten para que en la base queden
   * NULL en vez de '' (los índices parciales y los filtros por utm lo esperan).
   */
  function buildPayload(form) {
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) {
      if (key === "empresa_web") return; // honeypot: se envía aparte
      var clean = typeof value === "string" ? value.trim() : "";
      if (clean === "") return;
      payload[key] = clean;
    });
    if (payload.telefono) payload.telefono = payload.telefono.replace(/\D/g, "");
    if (payload.email) payload.email = payload.email.toLowerCase();
    payload.honeypot = (data.get("empresa_web") || "").toString();
    payload.page_url = window.location.href;
    if (document.referrer) payload.referrer = document.referrer;
    return payload;
  }

  /* ---- Envío: Render API -> Supabase REST -> modo demo ---- */
  function sendLead(payload) {
    var apiBase = (CONFIG.apiBaseUrl || "").replace(/\/+$/, "");
    var sb = CONFIG.supabase || {};

    if (apiBase) {
      return fetch(apiBase + (CONFIG.leadsPath || "/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(handleJsonResponse);
    }

    if (sb.url && sb.anonKey) {
      var row = Object.assign({}, payload);
      delete row.honeypot;
      return fetch(sb.url.replace(/\/+$/, "") + "/rest/v1/" + (sb.table || "leads"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: sb.anonKey,
          Authorization: "Bearer " + sb.anonKey,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(row)
      }).then(handleJsonResponse);
    }

    // Modo demo: sin backend configurado
    console.info("[Témpora] Modo demo – lead capturado:", payload);
    return Promise.resolve({ ok: true, demo: true });
  }

  function handleJsonResponse(res) {
    if (res.ok) {
      return res.status === 204 ? { ok: true } : res.json().catch(function () { return { ok: true }; });
    }
    return res.json().catch(function () { return {}; }).then(function (body) {
      var msg = body && (body.error || body.message) ? (body.error || body.message) : "HTTP " + res.status;
      throw new Error(msg);
    });
  }

  /* ---- Cola de reintento si la red falla ---- */
  function queueLead(payload) {
    if (!OPTS.retryOnReconnect) return;
    try {
      var queue = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
      queue.push({ payload: payload, at: Date.now() });
      localStorage.setItem(PENDING_KEY, JSON.stringify(queue.slice(-10)));
    } catch (e) { /* localStorage no disponible */ }
  }

  function flushQueue() {
    var queue;
    try { queue = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch (e) { return; }
    if (!queue.length) return;

    var remaining = [];
    var done = 0;
    queue.forEach(function (item) {
      sendLead(item.payload)
        .catch(function () { remaining.push(item); })
        .then(function () {
          done++;
          if (done === queue.length) {
            try { localStorage.setItem(PENDING_KEY, JSON.stringify(remaining)); } catch (e) {}
          }
        });
    });
  }

  function initLeadForm() {
    var form = $("#lead-form");
    if (!form) return;

    var steps = $$(".lead-form__step", form);
    var total = steps.length;
    var progress = $("#lead-progress");
    var status = $("#lead-status");
    var btnPrev = $("#lead-prev");
    var btnNext = $("#lead-next");
    var btnSubmit = $("#lead-submit");
    var stepsBox = $(".lead-form__steps", form);
    var buttonsBox = $(".lead-form__buttons", form);
    var current = 0;

    readUtm(form);

    function setStatus(message, type) {
      status.textContent = message || "";
      status.className = "lead-form__status" + (message ? " is-" + type : "");
    }

    function render(focusField) {
      // current siempre dentro de rango: así nunca quedan 0 pasos visibles
      current = Math.max(0, Math.min(current, total - 1));
      steps.forEach(function (step, i) { step.classList.toggle("is-active", i === current); });

      // Si el envío había ocultado el formulario, lo devolvemos a la vida
      stepsBox.hidden = false;
      buttonsBox.hidden = false;

      // El original usa el porcentaje truncado (1/8 = 12%)
      var pct = Math.floor(((current + 1) / total) * 100);
      progress.style.width = pct + "%";
      progress.textContent = pct + "%";

      btnPrev.hidden = current === 0;
      btnNext.hidden = current === total - 1;
      btnSubmit.hidden = current !== total - 1;

      // Al cambiar de paso el foco va al campo, también al volver atrás
      if (focusField !== false) {
        var input = fieldOf(steps[current]);
        if (input) input.focus({ preventScroll: true });
      }
    }

    function checkCurrentStep() {
      var input = fieldOf(steps[current]);
      var error = validateField(input);
      if (input) input.classList.toggle("has-error", Boolean(error));
      if (error) { setStatus(error, "error"); return false; }
      setStatus("", null);
      return true;
    }

    btnNext.addEventListener("click", function () {
      if (!checkCurrentStep()) return;
      if (current < total - 1) { current++; render(); }
    });

    btnPrev.addEventListener("click", function () {
      if (current > 0) { current--; setStatus("", null); render(); }
    });

    // Enter avanza en lugar de enviar (salvo en el último paso)
    form.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (current < total - 1) { e.preventDefault(); btnNext.click(); }
    });

    // Limpia el error al escribir
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("has-error")) {
        e.target.classList.remove("has-error");
        setStatus("", null);
      }
    });

    // Teléfono: sólo dígitos
    var tel = form.querySelector('input[type="tel"]');
    if (tel) {
      tel.addEventListener("input", function () {
        tel.value = tel.value.replace(/\D/g, "").slice(0, 9);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Revalida todos los pasos antes de enviar
      for (var i = 0; i < total; i++) {
        var error = validateField(fieldOf(steps[i]));
        if (error) {
          current = i;
          render();
          setStatus(error, "error");
          return;
        }
      }

      var payload = buildPayload(form);

      // Honeypot relleno = bot: fingimos éxito y no enviamos nada
      if (payload.honeypot) {
        setStatus(OPTS.successMessage || "¡Gracias!", "success");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "Enviando…";
      setStatus("", null);

      sendLead(payload)
        .then(function () {
          if (window.dataLayer && OPTS.dataLayerEvent) {
            window.dataLayer.push({ event: OPTS.dataLayerEvent, form_name: "implante_capilar_providencia" });
          }
          form.reset();
          setStatus(OPTS.successMessage || "¡Gracias! Te contactaremos pronto.", "success");
          stepsBox.hidden = true;
          buttonsBox.hidden = true;
          progress.style.width = "100%";
          progress.textContent = "100%";

          if (OPTS.redirectTo) {
            setTimeout(function () { window.location.href = OPTS.redirectTo; }, 1200);
          }
        })
        .catch(function (err) {
          console.error("[Témpora] Error enviando el lead:", err);
          queueLead(payload);
          setStatus(OPTS.errorMessage || "No pudimos enviar tus datos.", "error");
        })
        .then(function () {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Quiero Agendar";
        });
    });

    render(false);
  }

  /* ==========================================================================
     INIT
     ====================================================================== */
  function init() {
    initNav();
    initReveals();
    initCounters();
    initCarousels();
    initVideos();
    initLeadForm();
    flushQueue();
    window.addEventListener("online", flushQueue);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
