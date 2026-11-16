/*
 * common.js — Utilidades compartidas por las dos páginas:
 * progreso local, nivel de explicación, glosario, copiar respuesta,
 * motor de cuestionarios y reproductor de simulaciones por pasos.
 * No usa innerHTML con datos del usuario; todo se construye con DOM seguro.
 */
(function () {
  'use strict';

  var CLAVE_PROGRESO = 'labArqBDvsSI.progreso.v1';
  var CLAVE_NIVEL = 'labArqBDvsSI.nivel.v1';

  var ACTIVIDADES = {
    p2: ['p2-simulador', 'p2-laboratorio', 'p2-juego', 'p2-quiz'],
    p7: ['p7-matriz', 'p7-decision', 'p7-lockin', 'p7-quiz']
  };
  var TODAS = ACTIVIDADES.p2.concat(ACTIVIDADES.p7);

  /* ---------- Utilidad DOM segura ---------- */
  function el(tag, attrs, hijos) {
    var nodo = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { return; }
        if (k === 'text') { nodo.textContent = v; }
        else if (k === 'class') { nodo.className = v; }
        else if (k.indexOf('on') === 0 && typeof v === 'function') { nodo.addEventListener(k.slice(2), v); }
        else { nodo.setAttribute(k, v === true ? '' : String(v)); }
      });
    }
    (hijos || []).forEach(function (h) {
      if (h === null || h === undefined) { return; }
      nodo.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
    });
    return nodo;
  }

  /* ---------- Almacenamiento local (sin datos personales) ---------- */
  function leer(clave, porDefecto) {
    try {
      var v = window.localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo privado: se ignora */ }
  }

  /* ---------- Progreso ---------- */
  function estadoProgreso() { return leer(CLAVE_PROGRESO, {}); }

  function marcarHecho(id) {
    var estado = estadoProgreso();
    if (estado[id] === true) { return; }
    estado[id] = true;
    guardar(CLAVE_PROGRESO, estado);
    pintarProgreso();
    var chip = document.querySelector('[data-actividad-chip="' + id + '"]');
    if (chip) { anunciar('Actividad completada. Progreso: ' + window.LabLogic.countProgress(estado, TODAS) + ' de ' + TODAS.length + '.'); }
  }

  function pintarProgreso() {
    var estado = estadoProgreso();
    var hechas = window.LabLogic.countProgress(estado, TODAS);
    var barra = document.getElementById('progreso-barra');
    var texto = document.getElementById('progreso-texto');
    if (barra) { barra.value = hechas; barra.max = TODAS.length; }
    if (texto) { texto.textContent = hechas + '/' + TODAS.length; }
    document.querySelectorAll('[data-actividad-chip]').forEach(function (chip) {
      var hecho = estado[chip.getAttribute('data-actividad-chip')] === true;
      chip.classList.toggle('hecho', hecho);
      chip.textContent = hecho ? '✓ Completada' : '○ Pendiente';
    });
  }

  function reiniciarProgreso() {
    guardar(CLAVE_PROGRESO, {});
    pintarProgreso();
    anunciar('Progreso reiniciado. Las actividades vuelven a estar pendientes.');
  }

  /* ---------- Región de anuncios global ---------- */
  function anunciar(msg) {
    var r = document.getElementById('anuncios');
    if (!r) { return; }
    r.textContent = '';
    window.setTimeout(function () { r.textContent = msg; }, 60);
  }

  /* ---------- Nivel de explicación ---------- */
  function aplicarNivel(nivel) {
    document.body.setAttribute('data-nivel', nivel);
    document.querySelectorAll('[data-set-nivel]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-nivel') === nivel ? 'true' : 'false');
    });
    guardar(CLAVE_NIVEL, nivel);
  }

  /* ---------- Movimiento reducido ---------- */
  function movimientoReducido() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- Copiar al portapapeles ---------- */
  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (resolve, reject) {
      var ta = el('textarea', { 'aria-hidden': 'true', class: 'fuera-de-pantalla' });
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy')); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function iniciarBotonesCopiar() {
    document.querySelectorAll('[data-copiar]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        var origen = document.getElementById(boton.getAttribute('data-copiar'));
        var estado = document.getElementById(boton.getAttribute('data-copiar') + '-estado');
        if (!origen) { return; }
        var texto = origen.innerText.replace(/\s+\n/g, '\n').trim();
        copiarTexto(texto).then(function () {
          if (estado) { estado.textContent = '✓ Respuesta copiada al portapapeles.'; }
        }, function () {
          if (estado) { estado.textContent = 'No se pudo copiar automáticamente. Selecciona el texto y usa Ctrl+C.'; }
        });
      });
    });
  }

  /* ---------- Glosario ---------- */
  var GLOSARIO = {
    'front-end': ['Front-end', 'Parte de la aplicación con la que interactúa la persona usuaria: interfaz, formularios y presentación de resultados.'],
    'back-end': ['Back-end', 'Servicios centrales que atienden solicitudes: lógica de negocio, acceso a datos y persistencia. Se ejecutan en servidores.'],
    'dbms': ['DBMS (SGBD)', 'Sistema gestor de bases de datos: software que almacena, consulta, protege y recupera datos (p. ej., PostgreSQL o MySQL).'],
    'cpu': ['CPU', 'Procesador: ejecuta las instrucciones, por ejemplo las operaciones de una consulta (filtrar, unir, agregar).'],
    'ram': ['RAM (memoria principal)', 'Memoria rápida y volátil donde el DBMS mantiene páginas de datos en uso, buffers y estructuras temporales.'],
    'disco': ['Disco (almacenamiento)', 'Almacenamiento persistente donde residen los archivos de datos, índices y registros del DBMS.'],
    'nodo': ['Nodo', 'Unidad de cómputo de un sistema paralelo o distribuido (uno o varios procesadores con sus recursos asociados).'],
    'api': ['API', 'Interfaz de programación: contrato que define qué solicitudes acepta un servicio y qué responde. En 3 capas suele alojar la lógica de negocio.'],
    'iaas': ['IaaS', 'Infraestructura como servicio: el proveedor entrega cómputo, red y almacenamiento virtualizados; el cliente administra desde el sistema operativo hacia arriba.'],
    'paas': ['PaaS', 'Plataforma como servicio: el proveedor administra infraestructura, sistema operativo y entorno de ejecución; el cliente despliega su código y gestiona sus datos.'],
    'saas': ['SaaS', 'Software como servicio: aplicación terminada que se usa por navegador; el proveedor la opera y el cliente gestiona usuarios, configuración y datos.'],
    'dbaas': ['DBaaS', 'Base de datos como servicio: base de datos gestionada por el proveedor (aprovisionamiento, parches y, según el plan, backups y escalado). Suele clasificarse dentro de la familia PaaS.'],
    'sla': ['SLA', 'Acuerdo de nivel de servicio: compromisos contractuales del proveedor (p. ej., disponibilidad) y lo que ocurre si no se cumplen.'],
    'lock-in': ['Vendor lock-in', 'Dependencia de un proveedor: dificultad técnica, económica u operativa para cambiar a otro. Se puede reducir, no eliminar del todo.'],
    'particion': ['Partición de datos', 'División de una tabla en fragmentos repartidos entre nodos (por rango, hash o lista) para que cada nodo procese su parte.'],
    'capa': ['Capa (tier)', 'Nivel lógico o físico de una aplicación con una responsabilidad definida: presentación, lógica de negocio o datos.']
  };

  var popover = null;
  var disparadorActivo = null;

  function cerrarPopover(devolverFoco) {
    if (!popover || popover.hidden) { return; }
    popover.hidden = true;
    if (disparadorActivo) {
      disparadorActivo.setAttribute('aria-expanded', 'false');
      if (devolverFoco) { disparadorActivo.focus(); }
    }
    disparadorActivo = null;
  }

  function abrirPopover(boton) {
    var clave = boton.getAttribute('data-termino');
    var def = GLOSARIO[clave];
    if (!def) { return; }
    if (disparadorActivo === boton) { cerrarPopover(false); return; }
    cerrarPopover(false);
    popover.querySelector('.pop-titulo').textContent = def[0];
    popover.querySelector('.pop-texto').textContent = def[1];
    popover.hidden = false;
    var r = boton.getBoundingClientRect();
    var ancho = Math.min(320, window.innerWidth - 24);
    var izq = Math.max(12, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - ancho - 12));
    popover.style.width = ancho + 'px';
    popover.style.left = izq + 'px';
    popover.style.top = (r.bottom + window.scrollY + 8) + 'px';
    boton.setAttribute('aria-expanded', 'true');
    disparadorActivo = boton;
  }

  function iniciarGlosario() {
    popover = el('div', { id: 'glosario-pop', class: 'glosario-pop', role: 'note', hidden: true }, [
      el('p', { class: 'pop-titulo' }),
      el('p', { class: 'pop-texto' }),
      el('button', { type: 'button', class: 'pop-cerrar', text: 'Cerrar', onclick: function () { cerrarPopover(true); } })
    ]);
    document.body.appendChild(popover);

    document.querySelectorAll('[data-termino]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', 'glosario-pop');
      b.addEventListener('click', function (e) { e.stopPropagation(); abrirPopover(b); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrarPopover(true); } });
    document.addEventListener('click', function (e) {
      if (popover && !popover.hidden && !popover.contains(e.target)) { cerrarPopover(false); }
    });

    var lista = document.getElementById('glosario-lista');
    if (lista) {
      Object.keys(GLOSARIO).forEach(function (k) {
        lista.appendChild(el('div', { class: 'glosario-item' }, [
          el('dt', { text: GLOSARIO[k][0] }),
          el('dd', { text: GLOSARIO[k][1] })
        ]));
      });
    }
  }

  /* ---------- Motor de cuestionarios ---------- */
  /*
   * preguntas: [{id, enunciado, opciones:[{id, texto}], correcta, explicacion}]
   */
  function renderQuiz(contenedor, preguntas, actividadId) {
    var form = el('form', { class: 'quiz', novalidate: true });
    preguntas.forEach(function (p, i) {
      var fs = el('fieldset', { class: 'quiz-pregunta', id: 'q-' + p.id });
      fs.appendChild(el('legend', {}, [el('span', { class: 'quiz-num', text: (i + 1) + '.' }), ' ' + p.enunciado]));
      var opts = el('div', { class: 'quiz-opciones' });
      p.opciones.forEach(function (o) {
        var idInput = 'q-' + p.id + '-' + o.id;
        opts.appendChild(el('label', { class: 'quiz-opcion', for: idInput }, [
          el('input', { type: 'radio', name: 'q-' + p.id, id: idInput, value: o.id }),
          el('span', { text: o.texto })
        ]));
      });
      fs.appendChild(opts);
      fs.appendChild(el('div', { class: 'quiz-feedback', id: 'fb-' + p.id, hidden: true }));
      form.appendChild(fs);
    });

    var resultado = el('p', { class: 'quiz-resultado', role: 'status', 'aria-live': 'polite' });
    var btnComprobar = el('button', { type: 'submit', class: 'btn btn-primario', text: 'Comprobar respuestas' });
    var btnReintentar = el('button', { type: 'button', class: 'btn', text: 'Reintentar', hidden: true });
    form.appendChild(el('div', { class: 'acciones' }, [btnComprobar, btnReintentar]));
    form.appendChild(resultado);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var respuestas = {};
      preguntas.forEach(function (p) {
        var marcada = form.querySelector('input[name="q-' + p.id + '"]:checked');
        if (marcada) { respuestas[p.id] = marcada.value; }
      });
      var r = window.LabLogic.scoreQuiz(preguntas, respuestas);
      if (!r.completo) {
        resultado.textContent = 'Responde las ' + r.total + ' preguntas antes de comprobar (faltan ' +
          r.detalle.filter(function (d) { return !d.respondida; }).length + ').';
        var primera = r.detalle.filter(function (d) { return !d.respondida; })[0];
        var input = form.querySelector('input[name="q-' + primera.id + '"]');
        if (input) { input.focus(); }
        return;
      }
      preguntas.forEach(function (p, i) {
        var d = r.detalle[i];
        var fb = document.getElementById('fb-' + p.id);
        fb.textContent = '';
        fb.className = 'quiz-feedback ' + (d.correcta ? 'ok' : 'error');
        fb.appendChild(el('strong', { text: d.correcta ? '✓ Correcto. ' : '✗ Incorrecto. ' }));
        if (!d.correcta) {
          var correcta = p.opciones.filter(function (o) { return o.id === p.correcta; })[0];
          fb.appendChild(el('span', { text: 'Respuesta correcta: «' + correcta.texto + '». ' }));
        }
        fb.appendChild(el('span', { text: p.explicacion }));
        fb.hidden = false;
        form.querySelectorAll('input[name="q-' + p.id + '"]').forEach(function (inp) { inp.disabled = true; });
      });
      resultado.textContent = 'Puntuación: ' + r.aciertos + ' de ' + r.total + '. ' +
        (r.aciertos === r.total ? '¡Dominas el tema!' : 'Revisa las explicaciones y vuelve a intentarlo.');
      btnComprobar.hidden = true;
      btnReintentar.hidden = false;
      if (actividadId) { marcarHecho(actividadId); }
      resultado.setAttribute('tabindex', '-1');
      resultado.focus();
    });

    btnReintentar.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('input').forEach(function (inp) { inp.disabled = false; });
      form.querySelectorAll('.quiz-feedback').forEach(function (fb) { fb.hidden = true; fb.textContent = ''; });
      resultado.textContent = 'Cuestionario reiniciado.';
      btnComprobar.hidden = false;
      btnReintentar.hidden = true;
      var primero = form.querySelector('input');
      if (primero) { primero.focus(); }
    });

    contenedor.appendChild(form);
  }

  /* ---------- Reproductor de pasos (simulaciones) ---------- */
  /*
   * opciones: {total, alPaso(i), alTerminar(), alReiniciar(), retardo}
   * Expone: iniciar(), pausar(), reanudar(), siguiente(), reiniciar(), estado
   */
  function Reproductor(opciones) {
    this.o = opciones;
    this.i = -1;
    this.temporizador = null;
    this.estado = 'detenido'; // detenido | reproduciendo | pausado | terminado
  }
  Reproductor.prototype._programar = function () {
    var self = this;
    window.clearTimeout(this.temporizador);
    var retardo = movimientoReducido() ? Math.max(this.o.retardo, 2200) : this.o.retardo;
    this.temporizador = window.setTimeout(function () { self._avanzar(true); }, retardo);
  };
  Reproductor.prototype._avanzar = function (continuar) {
    if (this.i >= this.o.total - 1) { this._fin(); return; }
    this.i += 1;
    this.o.alPaso(this.i);
    if (this.i >= this.o.total - 1) { this._fin(); return; }
    if (continuar && this.estado === 'reproduciendo') { this._programar(); }
  };
  Reproductor.prototype._fin = function () {
    window.clearTimeout(this.temporizador);
    this.estado = 'terminado';
    if (this.o.alTerminar) { this.o.alTerminar(); }
  };
  Reproductor.prototype.iniciar = function () {
    this.reiniciar(true);
    this.estado = 'reproduciendo';
    this._avanzar(true);
  };
  Reproductor.prototype.pausar = function () {
    if (this.estado !== 'reproduciendo') { return; }
    window.clearTimeout(this.temporizador);
    this.estado = 'pausado';
  };
  Reproductor.prototype.reanudar = function () {
    if (this.estado !== 'pausado') { return; }
    this.estado = 'reproduciendo';
    this._avanzar(true);
  };
  Reproductor.prototype.siguiente = function () {
    window.clearTimeout(this.temporizador);
    if (this.estado === 'terminado') { return; }
    if (this.estado === 'detenido') { this.reiniciar(true); }
    this.estado = 'pausado';
    this._avanzar(false);
  };
  Reproductor.prototype.reiniciar = function (silencioso) {
    window.clearTimeout(this.temporizador);
    this.i = -1;
    this.estado = 'detenido';
    if (this.o.alReiniciar) { this.o.alReiniciar(silencioso === true); }
  };

  /* ---------- Arranque ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    aplicarNivel(leer(CLAVE_NIVEL, 'universitario'));
    document.querySelectorAll('[data-set-nivel]').forEach(function (b) {
      b.addEventListener('click', function () {
        aplicarNivel(b.getAttribute('data-set-nivel'));
        anunciar(b.getAttribute('data-set-nivel') === 'sencillo' ? 'Modo explicación sencilla activado.' : 'Modo nivel universitario activado.');
      });
    });
    var btnReinicio = document.getElementById('reiniciar-progreso');
    if (btnReinicio) { btnReinicio.addEventListener('click', reiniciarProgreso); }
    pintarProgreso();
    iniciarBotonesCopiar();
    iniciarGlosario();
    var anio = document.getElementById('anio');
    if (anio) { anio.textContent = String(new Date().getFullYear()); }
  });

  window.Lab = {
    el: el,
    marcarHecho: marcarHecho,
    anunciar: anunciar,
    renderQuiz: renderQuiz,
    Reproductor: Reproductor,
    movimientoReducido: movimientoReducido,
    ACTIVIDADES: ACTIVIDADES
  };
})();
