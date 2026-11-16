/*
 * pregunta7.js — Interacciones de la página 2 (Pregunta 7).
 * LAB 01 matriz de responsabilidades · LAB 02 decisiones · LAB 03 lock-in · LAB 04 quiz.
 * Simulación educativa: no se conecta a ningún proveedor de nube.
 */
(function () {
  'use strict';
  var el, Lab;

  /* =====================================================
     LAB 01 · Matriz de responsabilidades
     P = Proveedor · C = Cliente · S = Compartida · D = Depende del contrato
     ===================================================== */
  var MODELOS = ['Local', 'IaaS', 'PaaS', 'DBaaS', 'SaaS'];
  var ETIQUETA_RESP = { P: '■ Proveedor', C: '▲ Cliente', S: '◆ Compartida', D: '? Depende del contrato' };

  // [capa, nota opcional, valores Local..SaaS]
  var CAPAS = [
    ['Interfaz y usuarios finales', 'Quién construye la interfaz y quién gestiona a sus usuarios', ['C', 'C', 'C', 'C', 'S']],
    ['Código de la aplicación y lógica de negocio', null, ['C', 'C', 'C', 'C', 'P']],
    ['Datos del negocio y su clasificación', 'Siempre son del cliente: qué guarda, qué es sensible, cuánto conservar', ['C', 'C', 'C', 'C', 'C']],
    ['Permisos de acceso y configuración de seguridad', 'El proveedor ofrece mecanismos; alguien debe configurarlos', ['C', 'C', 'S', 'C', 'S']],
    ['Modelo de datos: tablas, esquema y consultas', null, ['C', 'C', 'C', 'C', 'P']],
    ['Copias de seguridad, restauración y alta disponibilidad', 'Alcance, retención y réplicas varían según el plan', ['C', 'C', 'D', 'D', 'D']],
    ['Motor de BD: instalación, versiones y parches', null, ['C', 'C', 'D', 'P', 'P']],
    ['Entorno de ejecución (runtime)', null, ['C', 'C', 'P', 'P', 'P']],
    ['Sistema operativo', null, ['C', 'C', 'P', 'P', 'P']],
    ['Virtualización', null, ['C', 'P', 'P', 'P', 'P']],
    ['Centro de datos, red física y hardware', null, ['C', 'P', 'P', 'P', 'P']]
  ];

  var INFO_MODELO = [
    'Local (on-premises), solo como referencia: la organización compra el hardware y administra absolutamente todo.',
    'IaaS: recibes máquinas virtuales, red y almacenamiento. Tú instalas y mantienes el sistema operativo y el DBMS (por ejemplo, PostgreSQL en una VM). Máximo control en la nube, máxima carga operativa.',
    'PaaS: la plataforma ejecuta tu código (por ejemplo, la API de facturación y stock). Si necesitas base de datos, normalmente contratas un servicio de datos gestionado aparte o lo provee la plataforma como complemento: por eso el motor aparece como «depende del contrato».',
    'DBaaS: base de datos gestionada, normalmente clasificada dentro de la familia PaaS. El proveedor opera el motor; tú diseñas el esquema, escribes las consultas, configuras permisos y proteges tus datos. Backups, escalado y alta disponibilidad dependen del plan.',
    'SaaS: usas una aplicación terminada (por ejemplo, un sistema de facturación web). No operas SQL; administras usuarios, configuración y tus datos, que siguen siendo tu responsabilidad.'
  ];

  var matriz = { actual: 1, vistos: {} };

  function pintarMatriz() {
    var i = matriz.actual;
    var pila = document.getElementById('pila');
    pila.textContent = '';
    CAPAS.forEach(function (c) {
      var v = c[2][i];
      pila.appendChild(el('li', { class: 'capa-fila f-' + v }, [
        el('span', { class: 'capa-nombre' }, [c[0], c[1] ? el('span', { class: 'capa-nota', text: c[1] }) : null]),
        el('span', { class: 'resp resp-' + v, text: ETIQUETA_RESP[v] })
      ]));
    });
    document.getElementById('info-modelo').textContent = INFO_MODELO[i];
    document.getElementById('rango-valor').textContent = MODELOS[i];
    var rango = document.getElementById('rango-servicio');
    rango.value = String(i);
    rango.setAttribute('aria-valuetext', MODELOS[i]);
    document.querySelectorAll('[data-servicio]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-servicio') === String(i) ? 'true' : 'false');
    });
    if (i >= 1) { matriz.vistos[i] = true; }
    var faltan = [1, 2, 3, 4].filter(function (k) { return !matriz.vistos[k]; }).map(function (k) { return MODELOS[k]; });
    document.getElementById('matriz-avance').textContent = faltan.length
      ? 'Modelos explorados: ' + (4 - faltan.length) + ' de 4. Te falta: ' + faltan.join(', ') + '.'
      : 'Has explorado los cuatro modelos. Observa cómo «Datos del negocio» es del cliente en todas las columnas.';
    if (!faltan.length) { Lab.marcarHecho('p7-matriz'); }
  }

  function construirTabla() {
    var t = document.getElementById('tabla-resp');
    var thead = el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: 'Capa' })].concat(
      MODELOS.map(function (m) { return el('th', { scope: 'col', text: m }); })))]);
    var tbody = el('tbody');
    CAPAS.forEach(function (c) {
      tbody.appendChild(el('tr', {}, [el('th', { scope: 'row', text: c[0] })].concat(
        c[2].map(function (v) { return el('td', {}, [el('span', { class: 'resp resp-' + v, text: ETIQUETA_RESP[v] })]); }))));
    });
    t.appendChild(thead);
    t.appendChild(tbody);
  }

  function iniciarMatriz() {
    construirTabla();
    var rango = document.getElementById('rango-servicio');
    rango.addEventListener('input', function () { matriz.actual = Number(rango.value); pintarMatriz(); });
    document.querySelectorAll('[data-servicio]').forEach(function (b) {
      b.addEventListener('click', function () {
        matriz.actual = Number(b.getAttribute('data-servicio'));
        pintarMatriz();
      });
    });
    pintarMatriz();
  }

  /* =====================================================
     LAB 02 · Constructor de decisiones
     ===================================================== */
  var OPCIONES = {
    iaas: { titulo: 'IaaS: máquina virtual con un DBMS administrado por el equipo', por: 'Da el mayor control en la nube: eliges sistema operativo, versión del motor y configuración. Usando un motor de código abierto (por ejemplo, PostgreSQL) y formatos estándar, cambiar de proveedor es más viable.', costo: 'El equipo asume instalación, parches, backups, monitorización y recuperación.' },
    dbaas: { titulo: 'PaaS / DBaaS: API en una plataforma gestionada y base de datos gestionada', por: 'Reduce la carga operativa: el proveedor opera el motor y, según el plan, backups y disponibilidad. El equipo se concentra en el esquema de facturas, clientes y bodegas, las consultas y la lógica.', costo: 'Menos control del sistema subyacente y riesgo de lock-in si se usan funciones exclusivas; los backups y el escalado dependen del plan.' },
    saas: { titulo: 'SaaS: sistema de facturación ya construido', por: 'Es lo más rápido si existe un producto que cubra el proceso: no hay que programar ni operar la base de datos.', costo: 'Poco control sobre funciones y modelo de datos; la comercializadora sigue siendo responsable de sus datos, usuarios y configuración, y migrar puede ser difícil.' }
  };
  var TENSIONES = {
    'control-vs-equipo': 'Tensión: quieres control total, pero el equipo es pequeño. IaaS da control a cambio de trabajo operativo que alguien debe asumir.',
    'applista-vs-dependencia': 'Tensión: una aplicación SaaS lista suele aumentar la dependencia del proveedor. Exige exportación de datos en formato abierto antes de firmar.',
    'applista-vs-control': 'Tensión: una aplicación lista limita cuánto puedes controlar y personalizar.'
  };
  var NOMBRE_OP = { iaas: 'IaaS', dbaas: 'PaaS/DBaaS', saas: 'SaaS' };

  function mostrarRecomendacion(prioridades) {
    var r = window.LabLogic.recommendCloud(prioridades);
    var caja = document.getElementById('recomendacion');
    caja.textContent = '';
    if (!r.opcion) {
      caja.appendChild(el('p', { class: 'feedback-caja', text: 'Marca al menos una prioridad para obtener una recomendación.' }));
      return;
    }
    var op = OPCIONES[r.opcion];
    var valores = Object.keys(r.puntajes).map(function (k) { return r.puntajes[k]; });
    var min = Math.min.apply(null, valores);
    var max = Math.max.apply(null, valores);
    var rango = Math.max(1, max - min);
    var barras = el('div', { class: 'barras', 'aria-label': 'Afinidad relativa de cada opción' });
    ['iaas', 'dbaas', 'saas'].forEach(function (k) {
      var pct = Math.round(((r.puntajes[k] - min) / rango) * 85 + 15);
      barras.appendChild(el('div', { class: 'barra-op' }, [
        el('span', { text: NOMBRE_OP[k] }),
        el('div', { class: 'pista', 'aria-hidden': 'true' }, [el('div', { class: 'relleno', style: 'width:' + pct + '%' })]),
        el('span', { text: (r.puntajes[k] > 0 ? '+' : '') + r.puntajes[k] })
      ]));
    });
    var hijos = [
      el('h3', { text: 'Recomendación: ' + op.titulo }),
      el('p', {}, [el('strong', { text: 'Por qué: ' }), op.por]),
      el('p', {}, [el('strong', { text: 'A cambio: ' }), op.costo]),
      el('p', { class: 'contador', text: 'Afinidad relativa según las prioridades marcadas (puntaje didáctico, no una medición):' }),
      barras
    ];
    r.tensiones.forEach(function (t) { hijos.push(el('p', { class: 'advertencia', text: TENSIONES[t] })); });
    hijos.push(el('p', { class: 'contador', text: 'No es una recomendación universal: cambia si cambian el presupuesto, las normas sobre datos o las capacidades del equipo.' }));
    var cont = el('div', { class: 'recomendacion' }, hijos);
    caja.appendChild(cont);
    Lab.marcarHecho('p7-decision');
  }

  function iniciarDecision() {
    var form = document.getElementById('form-decision');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var marcadas = Array.prototype.slice.call(form.querySelectorAll('input[name="prioridad"]:checked')).map(function (i) { return i.value; });
      mostrarRecomendacion(marcadas);
    });
    form.addEventListener('reset', function () { document.getElementById('recomendacion').textContent = ''; });
  }

  /* =====================================================
     LAB 03 · Minijuego de vendor lock-in
     ===================================================== */
  var MITIGACIONES = [
    { id: 'sql-estandar', nombre: 'SQL estándar', detalle: 'Escribir consultas portables y evitar dialectos exclusivos sin necesidad.' },
    { id: 'backup-portable', nombre: 'Backup portable', detalle: 'Respaldos exportables en formatos abiertos (p. ej., volcado SQL o CSV).' },
    { id: 'pruebas-migracion', nombre: 'Pruebas de migración', detalle: 'Ensayar periódicamente la salida y la restauración en otro entorno, midiendo tiempo y costo.' },
    { id: 'documentacion', nombre: 'Documentación', detalle: 'Inventario de servicios usados, dependencias, volúmenes de datos y plan de salida.' },
    { id: 'abstraccion', nombre: 'Abstracción de acceso', detalle: 'Una capa (repositorio, ORM o API interna) que aísla el código del servicio concreto.' }
  ];
  var RIESGOS = [
    { id: 'sql-propietario', nombre: 'SQL propietario', detalle: 'Consultas con funciones que solo existen en ese servicio.', mitigaciones: ['sql-estandar', 'abstraccion'],
      explica: 'Si las consultas usan SQL estándar y pasan por una capa de abstracción, cambiar de motor exige reescribir mucho menos.' },
    { id: 'exportacion', nombre: 'Exportación de datos difícil', detalle: 'Sacar los datos completos es lento o solo posible en formatos cerrados.', mitigaciones: ['backup-portable', 'pruebas-migracion'],
      explica: 'Un respaldo en formato abierto, verificado con pruebas de restauración, demuestra que los datos pueden salir.' },
    { id: 'tarifas-salida', nombre: 'Tarifas de salida', detalle: 'Transferir grandes volúmenes fuera del proveedor tiene un costo.', mitigaciones: ['pruebas-migracion', 'documentacion'],
      explica: 'Ensayar la migración y documentar volúmenes permite estimar el costo de salida antes de necesitarla y negociarlo en el contrato.' },
    { id: 'extensiones', nombre: 'Extensiones exclusivas', detalle: 'Funcionalidades del motor que solo ofrece ese proveedor.', mitigaciones: ['abstraccion', 'documentacion'],
      explica: 'Aislar esas funciones tras una abstracción y documentar dónde se usan permite reemplazarlas; mejor aún, evitarlas si no son necesarias.' }
  ];
  var lock = { riesgo: null, resueltos: {} };

  function fichaBoton(item, tipo) {
    return el('button', { type: 'button', class: 'ficha ' + tipo, 'data-id': item.id, 'aria-pressed': 'false' }, [
      el('strong', { text: item.nombre }),
      el('small', { text: item.detalle })
    ]);
  }

  function feedbackLock(clase, partes) {
    var f = document.getElementById('lockin-feedback');
    f.className = 'feedback-caja' + (clase ? ' ' + clase : '');
    f.textContent = '';
    partes.forEach(function (p) { f.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); });
  }

  function pintarMarcadorLock() {
    var n = Object.keys(lock.resueltos).length;
    document.getElementById('lockin-marcador').textContent = 'Riesgos mitigados: ' + n + ' de ' + RIESGOS.length +
      (n === RIESGOS.length ? ' · ¡Completado! Recuerda: el lock-in se reduce, pero no desaparece del todo.' : '');
    if (n === RIESGOS.length) { Lab.marcarHecho('p7-lockin'); }
  }

  function construirLockin() {
    lock.riesgo = null;
    lock.resueltos = {};
    var lr = document.getElementById('lista-riesgos');
    var lm = document.getElementById('lista-mitigaciones');
    lr.textContent = '';
    lm.textContent = '';
    RIESGOS.forEach(function (r) {
      var b = fichaBoton(r, 'riesgo');
      b.addEventListener('click', function () {
        if (lock.resueltos[r.id]) {
          feedbackLock('ok', [el('strong', { text: r.nombre + ': ya mitigado. ' }), r.explica]);
          return;
        }
        lock.riesgo = r.id;
        lr.querySelectorAll('.ficha').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        feedbackLock('', ['Riesgo elegido: ', el('strong', { text: r.nombre }), '. Ahora elige una mitigación.']);
      });
      lr.appendChild(b);
    });
    MITIGACIONES.forEach(function (m) {
      var b = fichaBoton(m, 'mitigacion');
      b.removeAttribute('aria-pressed');
      b.addEventListener('click', function () {
        if (!lock.riesgo) { feedbackLock('', ['Primero elige un riesgo de la columna izquierda.']); return; }
        var r = RIESGOS.filter(function (x) { return x.id === lock.riesgo; })[0];
        var ok = window.LabLogic.checkMitigation(RIESGOS, r.id, m.id);
        if (ok) {
          lock.resueltos[r.id] = m.id;
          var fr = lr.querySelector('[data-id="' + r.id + '"]');
          fr.classList.add('resuelto');
          fr.setAttribute('aria-pressed', 'false');
          fr.setAttribute('aria-label', r.nombre + ': mitigado con ' + m.nombre);
          lock.riesgo = null;
          feedbackLock('ok', [el('strong', { text: '✓ Bien: «' + m.nombre + '» reduce «' + r.nombre + '». ' }), r.explica]);
        } else {
          feedbackLock('error', [el('strong', { text: '✗ «' + m.nombre + '» no ataca directamente «' + r.nombre + '». ' }),
            'Piensa qué hace difícil el cambio en este caso y prueba otra mitigación.']);
        }
        pintarMarcadorLock();
      });
      lm.appendChild(b);
    });
    feedbackLock('', ['Elige primero un riesgo.']);
    pintarMarcadorLock();
  }

  /* =====================================================
     LAB 04 · Quiz
     ===================================================== */
  var QUIZ_P7 = [
    {
      id: 'p7q1',
      enunciado: '¿DBaaS elimina toda responsabilidad del cliente sobre los datos?',
      opciones: [
        { id: 'a', texto: 'Sí: el proveedor responde por todo, incluidos permisos y clasificación de datos.' },
        { id: 'b', texto: 'No: el cliente sigue a cargo del esquema, las consultas, los permisos y la protección de sus datos.' },
        { id: 'c', texto: 'Sí, siempre que el plan incluya backups automáticos.' },
        { id: 'd', texto: 'Solo elimina la responsabilidad sobre las consultas.' }
      ],
      correcta: 'b',
      explicacion: 'La responsabilidad es compartida: el proveedor opera el motor, pero los datos, los accesos y la recuperación que se necesita siguen siendo del cliente.'
    },
    {
      id: 'p7q2',
      enunciado: '¿Dónde suele ubicarse DBaaS respecto de IaaS, PaaS y SaaS?',
      opciones: [
        { id: 'a', texto: 'Como una cuarta capa universal, obligatoriamente al mismo nivel que las otras tres.' },
        { id: 'b', texto: 'Dentro de los servicios gestionados de tipo PaaS, como oferta especializada de datos.' },
        { id: 'c', texto: 'Dentro de IaaS, porque usa máquinas virtuales.' },
        { id: 'd', texto: 'Dentro de SaaS, porque se usa desde un navegador.' }
      ],
      correcta: 'b',
      explicacion: 'DBaaS es una base de datos gestionada que suele clasificarse en la familia PaaS; su nombre y alcance varían según el proveedor.'
    },
    {
      id: 'p7q3',
      enunciado: 'En IaaS, con PostgreSQL instalado en una máquina virtual, ¿quién aplica los parches del motor?',
      opciones: [
        { id: 'a', texto: 'El proveedor, automáticamente.' },
        { id: 'b', texto: 'Nadie: en la nube no hace falta.' },
        { id: 'c', texto: 'El cliente, porque él instaló y administra el DBMS.' },
        { id: 'd', texto: 'El fabricante del navegador.' }
      ],
      correcta: 'c',
      explicacion: 'En IaaS el proveedor llega hasta la virtualización; sistema operativo y motor de BD los administra el cliente.'
    },
    {
      id: 'p7q4',
      enunciado: '¿Qué medida reduce mejor el vendor lock-in?',
      opciones: [
        { id: 'a', texto: 'Usar todas las extensiones exclusivas del proveedor.' },
        { id: 'b', texto: 'Mantener backups exportables en formato abierto y probar su restauración.' },
        { id: 'c', texto: 'Firmar el SLA más largo posible.' },
        { id: 'd', texto: 'No documentar los servicios usados.' }
      ],
      correcta: 'b',
      explicacion: 'Respaldos portables y probados demuestran que los datos pueden salir. Aun así, el lock-in se reduce, no desaparece.'
    }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    el = window.Lab.el;
    Lab = window.Lab;
    iniciarMatriz();
    iniciarDecision();
    construirLockin();
    document.getElementById('lockin-reintentar').addEventListener('click', function () {
      construirLockin();
      Lab.anunciar('Minijuego reiniciado.');
    });
    Lab.renderQuiz(document.getElementById('quiz-p7'), QUIZ_P7, 'p7-quiz');

    var revelar = document.getElementById('caso-revelar');
    revelar.addEventListener('click', function () {
      var panel = document.getElementById('caso-revelacion');
      var abrir = panel.hidden;
      panel.hidden = !abrir;
      revelar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      revelar.textContent = abrir ? 'Ocultar' : 'Ver cómo se contrata el DBMS';
    });

    var oral = document.getElementById('resp-oral');
    document.getElementById('resp-oral-contador').textContent =
      'Extensión: ' + window.LabLogic.countWords(oral.textContent) + ' palabras (objetivo: 80–110, unos 45 segundos de exposición).';
  });

  window.__P7 = { QUIZ_P7: QUIZ_P7, RIESGOS: RIESGOS, CAPAS: CAPAS };
})();
