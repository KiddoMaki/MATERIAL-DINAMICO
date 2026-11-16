/*
 * pregunta2.js — Interacciones de la página 1 (Pregunta 2).
 * LAB 01 simulador 2/3 capas · LAB 02 DBMS paralelo · LAB 03 clasificación · LAB 04 reto.
 * Simulación educativa: ningún mensaje se envía a un servidor real.
 */
(function () {
  'use strict';
  var el, Lab;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function icono(id, clase) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    if (clase) { s.setAttribute('class', clase); }
    var u = document.createElementNS(SVGNS, 'use');
    u.setAttribute('href', '#' + id);
    s.appendChild(u);
    return s;
  }

  /* =====================================================
     LAB 01 · Simulador de solicitudes 2 vs 3 capas
     ===================================================== */
  var COMPONENTES = {
    '2': [
      { nombre: 'Cliente', rol: 'Aplicación de escritorio: interfaz + parte de la lógica', icono: 'i-navegador' },
      { nombre: 'Servidor de datos', rol: 'DBMS', icono: 'i-bd' }
    ],
    '3': [
      { nombre: 'Navegador', rol: 'Capa de presentación', icono: 'i-navegador' },
      { nombre: 'API', rol: 'Capa de lógica de negocio', icono: 'i-api' },
      { nombre: 'DBMS', rol: 'Capa de datos', icono: 'i-bd' }
    ]
  };

  var CASOS = {
    stock: {
      accion: 'El vendedor escribe el código del producto en «Consultar stock» y elige la bodega.',
      http: 'GET /api/productos/P-0001/stock?bodega=BOD-01',
      sql: 'SELECT producto_id, bodega_id, existencias\nFROM productos_bodega\nWHERE producto_id = $1 AND bodega_id = $2 AND activo = true;',
      regla: 'Valida que el código y la bodega existan y aplica la regla de negocio «mostrar solo productos activos con existencias disponibles».',
      filas: '2 filas (bodegas con existencias ficticias de ejemplo)',
      muestra: 'Se muestran las existencias del producto en cada bodega consultada.'
    },
    factura: {
      accion: 'El contador abre «Estado de factura» y consulta la factura F-0001.',
      http: 'GET /api/facturas/F-0001',
      sql: 'SELECT numero, estado, total\nFROM factura\nWHERE numero = $1;',
      regla: 'Comprueba la sesión y aplica la regla «solo el personal autorizado consulta facturas»; valida el número de factura.',
      filas: '1 fila: F-0001 · APR · 1250.00 (dato ficticio)',
      muestra: 'Se muestran el estado aprobado y el total de la factura en pantalla.'
    }
  };

  // Cada paso: {comp: índice activo | null, enlace: {i, dir} | null, donde, texto, codigo?}
  function pasosPara(topo, c) {
    if (topo === '3') {
      return [
        { comp: 0, donde: 'Navegador (presentación)', texto: c.accion + ' La interfaz construye la solicitud.' },
        { enlace: { i: 0, dir: 'ida' }, donde: 'Navegador → API', texto: 'Viaja una solicitud HTTP. El navegador no conoce la base de datos: solo habla con la API.', codigo: c.http },
        { comp: 1, donde: 'API (lógica de negocio)', texto: c.regla },
        { enlace: { i: 1, dir: 'ida' }, donde: 'API → DBMS', texto: 'La API envía una consulta SQL parametrizada (simulada) usando el protocolo del DBMS.', codigo: c.sql },
        { comp: 2, donde: 'DBMS (datos)', texto: 'El DBMS planifica y ejecuta la consulta y lee datos e índices. Cómo reparte ese trabajo entre CPU, memoria y discos es su arquitectura interna (mírala en el LAB 02).' },
        { enlace: { i: 1, dir: 'vuelta' }, donde: 'DBMS → API', texto: 'El DBMS devuelve el resultado: ' + c.filas + '.' },
        { comp: 1, donde: 'API (lógica de negocio)', texto: 'La API transforma las filas en JSON y omite campos internos que el cliente no debe ver.' },
        { enlace: { i: 0, dir: 'vuelta' }, donde: 'API → Navegador', texto: 'Respuesta HTTP 200 con el JSON.', codigo: 'HTTP/1.1 200 OK\nContent-Type: application/json' },
        { comp: 0, donde: 'Navegador (presentación)', texto: c.muestra + ' Fin del recorrido de ida y vuelta.' }
      ];
    }
    return [
      { comp: 0, donde: 'Cliente', texto: c.accion + ' En este diseño de 2 capas, el propio cliente valida los datos y arma la consulta (cliente «pesado»).' },
      { enlace: { i: 0, dir: 'ida' }, donde: 'Cliente → Servidor de datos', texto: 'El cliente envía la consulta SQL simulada por medio del controlador del DBMS (por ejemplo, ODBC o JDBC).', codigo: c.sql },
      { comp: 1, donde: 'Servidor de datos (DBMS)', texto: 'El DBMS verifica los permisos del usuario de base de datos y ejecuta la consulta. Si la lógica se ubicó en el servidor, aquí correría un procedimiento almacenado.' },
      { enlace: { i: 0, dir: 'vuelta' }, donde: 'Servidor de datos → Cliente', texto: 'El servidor devuelve el resultado: ' + c.filas + '.' },
      { comp: 0, donde: 'Cliente', texto: c.muestra + ' Fin del recorrido de ida y vuelta.' }
    ];
  }

  var NOTAS_TOPO = {
    '2': 'En 2 capas, la ubicación de la lógica de negocio varía según el diseño: puede estar en el cliente o en el servidor (vistas, procedimientos almacenados). No todas las aplicaciones conectan el cliente directamente al DBMS; este es solo un ejemplo clásico.',
    '3': 'En 3 capas, cada capa tiene una responsabilidad: la presentación pide, la API valida y aplica reglas, y el DBMS consulta y persiste. Así se puede cambiar la interfaz o escalar la API sin tocar la base de datos.'
  };

  var sim = { topo: '3', caso: 'stock', pasos: [], rep: null };

  function dibujarTopologia() {
    var cont = document.getElementById('topologia');
    cont.textContent = '';
    var comps = COMPONENTES[sim.topo];
    comps.forEach(function (c, i) {
      cont.appendChild(el('div', { class: 'comp', 'data-comp': i }, [
        icono(c.icono),
        el('span', { class: 'comp-nombre', text: c.nombre }),
        el('span', { class: 'comp-rol', text: c.rol })
      ]));
      if (i < comps.length - 1) {
        cont.appendChild(el('div', { class: 'enlace', 'data-enlace': i }, [
          el('span', { class: 'flecha', text: '⇄' }),
          el('div', { class: 'via' }, [el('span', { class: 'paquete' })]),
          el('span', { text: i === 0 && sim.topo === '3' ? 'HTTP' : 'SQL' })
        ]));
      }
    });
    document.getElementById('topologia-desc').textContent = 'Diagrama: ' +
      comps.map(function (c) { return c.nombre + ' (' + c.rol + ')'; }).join(' conectado con ') + '.';
    document.getElementById('sim-nota').textContent = NOTAS_TOPO[sim.topo];
  }

  function limpiarResaltado() {
    document.querySelectorAll('#topologia .comp').forEach(function (n) { n.classList.remove('activo'); });
    document.querySelectorAll('#topologia .enlace').forEach(function (n) { n.classList.remove('ida', 'vuelta'); });
  }

  function mostrarPaso(i) {
    var p = sim.pasos[i];
    limpiarResaltado();
    if (p.comp !== undefined) {
      var c = document.querySelector('#topologia [data-comp="' + p.comp + '"]');
      if (c) { c.classList.add('activo'); }
    }
    if (p.enlace) {
      var e = document.querySelector('#topologia [data-enlace="' + p.enlace.i + '"]');
      if (e) { e.classList.add(p.enlace.dir); }
    }
    var li = el('li', {}, [
      el('div', {}, [
        el('span', { class: 'donde', text: p.donde }),
        el('span', { text: p.texto }),
        p.codigo ? el('code', { class: 'sql', text: p.codigo }) : null
      ])
    ]);
    document.getElementById('sim-registro').appendChild(li);
  }

  function prepararSimulacion() {
    sim.pasos = pasosPara(sim.topo, CASOS[sim.caso]);
    var btnPausa = document.getElementById('sim-pausa');
    sim.rep = new Lab.Reproductor({
      total: sim.pasos.length,
      retardo: 1700,
      alPaso: mostrarPaso,
      alTerminar: function () {
        btnPausa.disabled = true;
        btnPausa.textContent = '⏸ Pausar';
        document.getElementById('sim-siguiente').disabled = true;
        Lab.marcarHecho('p2-simulador');
      },
      alReiniciar: function () {
        document.getElementById('sim-registro').textContent = '';
        limpiarResaltado();
        btnPausa.disabled = true;
        btnPausa.textContent = '⏸ Pausar';
        document.getElementById('sim-siguiente').disabled = false;
      }
    });
  }

  function iniciarSimulador() {
    dibujarTopologia();
    prepararSimulacion();
    document.querySelectorAll('[data-topologia]').forEach(function (b) {
      b.addEventListener('click', function () {
        sim.topo = b.getAttribute('data-topologia');
        document.querySelectorAll('[data-topologia]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        sim.rep.reiniciar();
        dibujarTopologia();
        prepararSimulacion();
        Lab.anunciar('Topología de ' + sim.topo + ' capas seleccionada.');
      });
    });
    document.getElementById('caso-sim').addEventListener('change', function (e) {
      sim.caso = e.target.value;
      sim.rep.reiniciar();
      prepararSimulacion();
    });
    var btnPausa = document.getElementById('sim-pausa');
    document.getElementById('sim-enviar').addEventListener('click', function () {
      sim.rep.iniciar();
      if (sim.rep.estado === 'reproduciendo') { btnPausa.disabled = false; }
    });
    btnPausa.addEventListener('click', function () {
      if (sim.rep.estado === 'reproduciendo') { sim.rep.pausar(); btnPausa.textContent = '▶ Reanudar'; }
      else if (sim.rep.estado === 'pausado') { sim.rep.reanudar(); btnPausa.textContent = '⏸ Pausar'; }
    });
    document.getElementById('sim-siguiente').addEventListener('click', function () {
      sim.rep.siguiente();
      if (sim.rep.estado === 'pausado') { btnPausa.disabled = false; btnPausa.textContent = '▶ Reanudar'; }
    });
    document.getElementById('sim-reiniciar').addEventListener('click', function () {
      sim.rep.reiniciar();
      Lab.anunciar('Simulación reiniciada.');
    });
  }

  /* =====================================================
     LAB 02 · Laboratorio de DBMS paralelo
     ===================================================== */
  var ARQ = {
    sm: {
      nombre: 'Shared Memory',
      nodo: ['cpu'],
      comun: ['ram', 'disco'],
      etiquetaComun: { ram: 'Memoria principal común', disco: 'Discos del sistema' },
      badge: { ram: 'compartida' },
      descripcion: 'Descripción del diagrama: tres procesadores (CPU 1, CPU 2 y CPU 3) sin memoria propia; todos se conectan, a través de un bus o red de interconexión, a una única memoria principal común. Debajo aparecen los discos del sistema. Lo que define esta arquitectura es la memoria común.',
      ficha: ['Memoria principal entre todos los procesadores', 'Coordinación y comunicación muy rápidas: los procesadores leen y escriben en la misma memoria', 'Contención de memoria y de la interconexión: añadir procesadores deja de rendir a partir de cierto punto'],
      pasos: [
        { foco: ['cpu'], texto: 'El optimizador divide el recorrido de la tabla de facturas en tres tramos, uno por procesador (consulta simulada: contar facturas por estado ABI, ANU y APR).' },
        { foco: ['cpu', 'ram'], texto: 'Cada CPU lee sus páginas de datos desde el búfer en la memoria común. No necesita enviar mensajes: los datos ya están en la memoria que todos ven.' },
        { foco: ['cpu'], cuello: ['ram'], texto: 'Cuello de botella típico: las tres CPU compiten por la misma memoria y el mismo bus. Cuantos más procesadores, más contención; por eso esta arquitectura no escala indefinidamente.' },
        { foco: ['ram'], texto: 'Los conteos parciales se combinan directamente en memoria común. Resultado listo, con coordinación muy barata.' }
      ]
    },
    sd: {
      nombre: 'Shared Disk',
      nodo: ['cpu', 'ram'],
      comun: ['red', 'disco'],
      etiquetaComun: { red: 'Interconexión al almacenamiento', disco: 'Almacenamiento común (p. ej., SAN)' },
      badge: { disco: 'compartido' },
      descripcion: 'Descripción del diagrama: tres nodos, cada uno con su CPU y su memoria privada. Debajo, una red de interconexión los une a un único almacenamiento común al que todos pueden acceder.',
      ficha: ['Los discos; cada nodo conserva su memoria privada', 'Cualquier nodo puede leer cualquier dato; si un nodo falla, otro puede seguir accediendo a los mismos discos', 'Coordinar bloqueos y cachés entre nodos y contención del subsistema de almacenamiento'],
      pasos: [
        { foco: ['cpu'], texto: 'El trabajo de la consulta simulada se reparte entre los tres nodos.' },
        { foco: ['cpu', 'ram', 'red', 'disco'], texto: 'Cada nodo pide bloques al almacenamiento común y los guarda en su memoria privada (caché local).' },
        { foco: ['cpu'], cuello: ['disco', 'red'], texto: 'Cuello de botella típico: todas las lecturas llegan al mismo subsistema de almacenamiento. Además, si un nodo modifica un bloque, los demás deben invalidar su copia en caché, lo que exige coordinar bloqueos.' },
        { foco: ['ram', 'red'], texto: 'Los resultados parciales se envían a un nodo coordinador, que los combina.' }
      ]
    },
    sn: {
      nombre: 'Shared Nothing',
      nodo: ['cpu', 'ram', 'disco'],
      comun: ['red'],
      etiquetaComun: { red: 'Red de interconexión (mensajes)' },
      badge: { red: 'solo la red' },
      descripcion: 'Descripción del diagrama: tres nodos independientes, cada uno con su CPU, su memoria y su disco con una partición de los datos. Debajo, solo una red de interconexión por la que intercambian mensajes.',
      ficha: ['Ningún recurso de cómputo ni de almacenamiento; solo la red para intercambiar mensajes', 'Escala horizontalmente añadiendo nodos; cada nodo trabaja sobre sus datos locales', 'Exige diseñar la partición de datos y coordinar consultas entre nodos; mover datos por la red es costoso'],
      pasos: [
        { foco: ['disco'], texto: 'La tabla de facturas está particionada (por ejemplo, por hash del número de factura): cada nodo guarda aproximadamente un tercio en su propio disco.' },
        { foco: ['cpu', 'ram', 'disco'], texto: 'Cada nodo cuenta solo su partición local con su CPU, su memoria y su disco, sin competir por recursos con los demás nodos.' },
        { foco: ['cpu'], cuello: ['red'], texto: 'Cuello de botella típico: para agrupar por estado de la factura, parte de las filas debe redistribuirse por la red. Si las particiones están desequilibradas, un nodo termina mucho después que los otros (sesgo de datos).' },
        { foco: ['red'], texto: 'El coordinador junta los resultados parciales recibidos por mensajes. Escala añadiendo nodos, a cambio de partir bien los datos.' }
      ]
    }
  };

  var EXPLICA = {
    sm: {
      cpu: 'Procesador sin memoria principal propia en este modelo (puede tener cachés internas). Ejecuta su parte de la consulta leyendo de la memoria común.',
      ram: 'Memoria principal común: todos los procesadores la ven. Facilita compartir datos y coordinarse, pero es un punto de contención.',
      disco: 'Los discos guardan los datos persistentes. Ojo: lo que define a Shared Memory es la memoria común; no conviene equipararla con «disco compartido».'
    },
    sd: {
      cpu: 'Procesador del nodo. Trabaja con su memoria privada y lee los datos del almacenamiento común.',
      ram: 'Memoria privada del nodo: actúa como caché local. Mantener coherentes las cachés de varios nodos exige coordinación.',
      red: 'Interconexión entre los nodos y el almacenamiento común. Todas las lecturas y escrituras de bloques pasan por aquí.',
      disco: 'Almacenamiento común: cualquier nodo accede a cualquier dato. Requiere coordinar accesos y bloqueos y puede sufrir contención.'
    },
    sn: {
      cpu: 'Procesador propio del nodo. Solo procesa directamente los datos de su partición local.',
      ram: 'Memoria propia del nodo: ningún otro nodo la lee directamente.',
      disco: 'Disco propio con una partición de los datos. Elegir bien la partición (rango, hash, lista) es clave para equilibrar el trabajo.',
      red: 'Red de interconexión: el único elemento común. Por ella viajan mensajes y datos redistribuidos. Shared Nothing no significa que no exista ninguna conexión.'
    }
  };

  var NOMBRE_RECURSO = { cpu: 'CPU', ram: 'Memoria', disco: 'Disco', red: 'Red' };
  var ICONO_RECURSO = { cpu: 'i-cpu', ram: 'i-ram', disco: 'i-disco', red: 'i-red' };

  var lab = { arq: 'sm', rep: null, simuladas: {} };

  function botonRecurso(tipo, etiqueta, badge) {
    var b = el('button', { type: 'button', class: 'recurso ' + tipo, 'data-recurso': tipo }, [
      icono(ICONO_RECURSO[tipo]),
      el('span', { text: etiqueta }),
      badge ? el('span', { class: 'badge-comp', text: badge }) : null
    ]);
    b.addEventListener('click', function () {
      document.querySelectorAll('#diagrama-arq .recurso').forEach(function (x) { x.classList.remove('seleccionado'); });
      b.classList.add('seleccionado');
      var caja = document.getElementById('arq-explica');
      caja.textContent = '';
      caja.appendChild(el('h4', { text: etiqueta + ' · ' + ARQ[lab.arq].nombre }));
      caja.appendChild(el('p', { text: EXPLICA[lab.arq][tipo] }));
    });
    return b;
  }

  function dibujarArquitectura() {
    var a = ARQ[lab.arq];
    var d = document.getElementById('diagrama-arq');
    d.textContent = '';
    d.appendChild(el('span', { class: 'titulo-diag', text: '// DBMS paralelo · ' + a.nombre }));
    var fila = el('div', { class: 'fila-nodos' });
    [1, 2, 3].forEach(function (n) {
      var nodo = el('div', { class: 'nodo' }, [el('span', { class: 'nodo-titulo', text: (lab.arq === 'sm' ? 'Procesador ' : 'Nodo ') + n })]);
      a.nodo.forEach(function (t) {
        var etiqueta = NOMBRE_RECURSO[t] + ' ' + n;
        if (t === 'ram') { etiqueta = 'Memoria privada ' + n; }
        if (t === 'disco') { etiqueta = 'Disco ' + n + ' (partición ' + n + ')'; }
        nodo.appendChild(botonRecurso(t, etiqueta));
      });
      fila.appendChild(nodo);
    });
    d.appendChild(fila);
    d.appendChild(el('div', { class: 'conector', 'aria-hidden': 'true', text: '│ │ │' }));
    var comun = el('div', { class: 'compartido' });
    a.comun.forEach(function (t) {
      comun.appendChild(botonRecurso(t, a.etiquetaComun[t], a.badge[t]));
    });
    d.appendChild(comun);

    document.getElementById('arq-descripcion').textContent = a.descripcion;
    var ficha = document.getElementById('arq-ficha');
    ficha.textContent = '';
    ['Qué se comparte', 'Ventaja principal', 'Problema típico'].forEach(function (t, i) {
      ficha.appendChild(el('div', {}, [el('strong', { text: t }), el('span', { text: a.ficha[i] })]));
    });
    var caja = document.getElementById('arq-explica');
    caja.textContent = '';
    caja.appendChild(el('h4', { text: 'Explicación del componente' }));
    caja.appendChild(el('p', { text: 'Selecciona una CPU, una memoria, un disco o la interconexión del diagrama de ' + a.nombre + '.' }));
  }

  function limpiarEstadoRecursos() {
    document.querySelectorAll('#diagrama-arq .recurso').forEach(function (r) { r.classList.remove('trabajando', 'cuello'); });
  }

  function pasoArq(i) {
    var p = ARQ[lab.arq].pasos[i];
    limpiarEstadoRecursos();
    (p.foco || []).forEach(function (t) {
      document.querySelectorAll('#diagrama-arq .recurso.' + t).forEach(function (r) { r.classList.add('trabajando'); });
    });
    (p.cuello || []).forEach(function (t) {
      document.querySelectorAll('#diagrama-arq .recurso.' + t).forEach(function (r) { r.classList.remove('trabajando'); r.classList.add('cuello'); });
    });
    var etiqueta = p.cuello ? 'Paso ' + (i + 1) + ' · ⚠ Cuello de botella típico' : 'Paso ' + (i + 1);
    document.getElementById('arq-registro').appendChild(el('li', {}, [
      el('div', {}, [el('span', { class: 'donde', text: etiqueta }), el('span', { text: p.texto })])
    ]));
  }

  function actualizarAvanceLab() {
    var avance = document.getElementById('arq-avance');
    if (!avance) { return; }
    var partes = ['sm', 'sd', 'sn'].map(function (k) {
      return ARQ[k].nombre + (lab.simuladas[k] ? ' ✓' : ' ○');
    });
    avance.textContent = 'Arquitecturas simuladas: ' + partes.join(' · ') + '. Simula las tres para completar el laboratorio.';
  }

  function prepararLab() {
    var btnPausa = document.getElementById('arq-pausa');
    if (lab.rep) { lab.rep.reiniciar(); }
    lab.rep = new Lab.Reproductor({
      total: ARQ[lab.arq].pasos.length,
      retardo: 2300,
      alPaso: pasoArq,
      alTerminar: function () {
        btnPausa.disabled = true;
        btnPausa.textContent = '⏸ Pausar';
        lab.simuladas[lab.arq] = true;
        actualizarAvanceLab();
        if (lab.simuladas.sm && lab.simuladas.sd && lab.simuladas.sn) { Lab.marcarHecho('p2-laboratorio'); }
      },
      alReiniciar: function () {
        document.getElementById('arq-registro').textContent = '';
        limpiarEstadoRecursos();
        btnPausa.disabled = true;
        btnPausa.textContent = '⏸ Pausar';
      }
    });
  }

  function seleccionarPestana(tab, enfocar) {
    var tabs = document.querySelectorAll('#tabs-arq [role="tab"]');
    tabs.forEach(function (t) {
      var activa = t === tab;
      t.setAttribute('aria-selected', activa ? 'true' : 'false');
      t.setAttribute('tabindex', activa ? '0' : '-1');
    });
    document.getElementById('panel-arq').setAttribute('aria-labelledby', tab.id);
    if (enfocar) { tab.focus(); }
    lab.arq = tab.getAttribute('data-arq');
    dibujarArquitectura();
    prepararLab();
  }

  function iniciarLaboratorio() {
    dibujarArquitectura();
    prepararLab();
    actualizarAvanceLab();
    var tabs = Array.prototype.slice.call(document.querySelectorAll('#tabs-arq [role="tab"]'));
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { seleccionarPestana(t, false); });
      t.addEventListener('keydown', function (e) {
        var destino = null;
        if (e.key === 'ArrowRight') { destino = tabs[(i + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft') { destino = tabs[(i - 1 + tabs.length) % tabs.length]; }
        if (e.key === 'Home') { destino = tabs[0]; }
        if (e.key === 'End') { destino = tabs[tabs.length - 1]; }
        if (destino) { e.preventDefault(); seleccionarPestana(destino, true); }
      });
    });
    var btnPausa = document.getElementById('arq-pausa');
    document.getElementById('arq-simular').addEventListener('click', function () {
      lab.rep.iniciar();
      if (lab.rep.estado === 'reproduciendo') { btnPausa.disabled = false; }
    });
    btnPausa.addEventListener('click', function () {
      if (lab.rep.estado === 'reproduciendo') { lab.rep.pausar(); btnPausa.textContent = '▶ Reanudar'; }
      else if (lab.rep.estado === 'pausado') { lab.rep.reanudar(); btnPausa.textContent = '⏸ Pausar'; }
    });
    document.getElementById('arq-reiniciar').addEventListener('click', function () { lab.rep.reiniciar(); });
  }

  /* =====================================================
     LAB 03 · Juego «¿En qué nivel pertenece?»
     ===================================================== */
  var CAT_SI = 'si';
  var CAT_DBMS = 'dbms';
  var TARJETAS = [
    { id: 'navegador', nombre: 'Navegador', categoria: CAT_SI, porque: 'Es la capa de presentación: el cliente que solicita servicios.' },
    { id: 'api', nombre: 'API', categoria: CAT_SI, porque: 'Es la capa de lógica de negocio en una arquitectura de 3 capas.' },
    { id: 'dbms', nombre: 'DBMS', categoria: CAT_SI, porque: 'Como componente, el DBMS ocupa el papel de servidor de datos (capa de datos) en cliente-servidor. Cómo reparte por dentro CPU, memoria y discos es otra pregunta, del otro nivel.' },
    { id: 'memoria', nombre: 'Memoria común', categoria: CAT_DBMS, porque: 'Es el rasgo definitorio de Shared Memory: cómo se organizan los recursos dentro del motor.' },
    { id: 'disco', nombre: 'Disco compartido', categoria: CAT_DBMS, porque: 'Define a Shared Disk: varios nodos con memoria privada acceden al mismo almacenamiento.' },
    { id: 'particion', nombre: 'Partición de datos', categoria: CAT_DBMS, porque: 'Repartir una tabla entre nodos es una decisión interna del DBMS paralelo (típica de Shared Nothing).' },
    { id: 'http', nombre: 'Solicitud HTTP', categoria: CAT_SI, porque: 'Es la comunicación entre el cliente (navegador) y el servidor de aplicaciones.' },
    { id: 'nodo', nombre: 'Nodo con disco propio', categoria: CAT_DBMS, porque: 'Describe Shared Nothing: cada nodo tiene CPU, memoria y disco propios.' }
  ];
  var juego = { respuestas: {} };

  function pintarMarcador() {
    var ids = Object.keys(juego.respuestas);
    var ok = ids.filter(function (k) { return juego.respuestas[k]; }).length;
    document.getElementById('juego-marcador').textContent = 'Aciertos: ' + ok + ' de ' + TARJETAS.length + ' · Respondidas: ' + ids.length +
      (ids.length === TARJETAS.length ? (ok === TARJETAS.length ? ' · ¡Perfecto! Separas bien los dos niveles.' : ' · Revisa las tarjetas en rojo y pulsa «Reintentar juego».') : '');
    if (ids.length === TARJETAS.length) { Lab.marcarHecho('p2-juego'); }
  }

  function construirJuego() {
    var cont = document.getElementById('cartas');
    cont.textContent = '';
    juego.respuestas = {};
    TARJETAS.forEach(function (t) {
      var fb = el('p', { class: 'fb', 'aria-live': 'polite' });
      var carta = el('div', { class: 'carta', role: 'group', 'aria-label': 'Tarjeta: ' + t.nombre });
      var opciones = el('div', { class: 'opciones-carta' });
      [[CAT_SI, '▣ Arquitectura SI / cliente-servidor'], [CAT_DBMS, '◆ Arquitectura interna del DBMS']].forEach(function (op) {
        var b = el('button', { type: 'button', class: 'btn', text: op[1] });
        b.addEventListener('click', function () {
          var acierto = window.LabLogic.checkClassification(TARJETAS, t.id, op[0]);
          juego.respuestas[t.id] = acierto;
          carta.classList.remove('ok', 'mal');
          carta.classList.add(acierto ? 'ok' : 'mal');
          fb.textContent = '';
          fb.appendChild(el('strong', { text: acierto ? '✓ Correcto. ' : '✗ No es ese nivel. ' }));
          fb.appendChild(document.createTextNode(t.porque));
          opciones.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          pintarMarcador();
        });
        opciones.appendChild(b);
      });
      carta.appendChild(el('span', { class: 'carta-nombre', text: t.nombre }));
      carta.appendChild(opciones);
      carta.appendChild(fb);
      cont.appendChild(carta);
    });
    pintarMarcador();
  }

  /* =====================================================
     LAB 04 · Reto final
     ===================================================== */
  var QUIZ_P2 = [
    {
      id: 'p2q1',
      enunciado: '¿Qué pregunta responde principalmente el modelo cliente-servidor?',
      opciones: [
        { id: 'a', texto: '¿Cómo comparten CPU, memoria y discos los nodos del motor?' },
        { id: 'b', texto: '¿Quién presta el servicio a quién y en qué capa?' },
        { id: 'c', texto: '¿Qué índice conviene crear en una tabla?' },
        { id: 'd', texto: '¿Cuántos discos necesita el servidor?' }
      ],
      correcta: 'b',
      explicacion: 'Cliente-servidor organiza responsabilidades y comunicación entre componentes de software; la organización de CPU, memoria y discos es propia de las arquitecturas paralelas del DBMS.'
    },
    {
      id: 'p2q2',
      enunciado: '¿Qué describe mejor a Shared Disk?',
      opciones: [
        { id: 'a', texto: 'Todos los procesadores comparten una única memoria principal.' },
        { id: 'b', texto: 'Cada nodo tiene memoria privada y todos acceden a un almacenamiento común.' },
        { id: 'c', texto: 'Cada nodo tiene CPU, memoria y disco propios y no hay red.' },
        { id: 'd', texto: 'Es otro nombre para la arquitectura de 3 capas.' }
      ],
      correcta: 'b',
      explicacion: 'En Shared Disk la memoria es privada por nodo y el almacenamiento es común; por eso hay que coordinar bloqueos y cachés.'
    },
    {
      id: 'p2q3',
      enunciado: 'Pregunta trampa: ¿una aplicación de 3 capas puede usar un DBMS Shared Nothing en su capa de datos?',
      opciones: [
        { id: 'a', texto: 'No, porque son arquitecturas que compiten entre sí.' },
        { id: 'b', texto: 'Sí: son niveles distintos y se combinan.' },
        { id: 'c', texto: 'Solo si la aplicación es de 2 capas.' },
        { id: 'd', texto: 'Solo si el DBMS es Shared Memory.' }
      ],
      correcta: 'b',
      explicacion: 'Cliente-servidor describe la aplicación; Shared Nothing, el interior del motor. La API envía SQL y no necesita saber cómo reparte el DBMS sus particiones.'
    },
    {
      id: 'p2q4',
      enunciado: '¿Cuál es el reto típico de Shared Nothing?',
      opciones: [
        { id: 'a', texto: 'La contención en una memoria común a todos los procesadores.' },
        { id: 'b', texto: 'Que no puede escalar añadiendo nodos.' },
        { id: 'c', texto: 'Diseñar la partición de datos y coordinar consultas entre nodos.' },
        { id: 'd', texto: 'Que obliga a usar un navegador como cliente.' }
      ],
      correcta: 'c',
      explicacion: 'Shared Nothing escala horizontalmente, pero exige partir bien los datos y mover resultados entre nodos por la red.'
    }
  ];

  /* =====================================================
     Arranque
     ===================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    el = window.Lab.el;
    Lab = window.Lab;
    iniciarSimulador();
    iniciarLaboratorio();
    construirJuego();
    document.getElementById('juego-reintentar').addEventListener('click', function () {
      construirJuego();
      Lab.anunciar('Juego reiniciado.');
      var primero = document.querySelector('#cartas button');
      if (primero) { primero.focus(); }
    });
    Lab.renderQuiz(document.getElementById('quiz-p2'), QUIZ_P2, 'p2-quiz');

    var revelar = document.getElementById('caso-revelar');
    revelar.addEventListener('click', function () {
      var panel = document.getElementById('caso-revelacion');
      var abrir = panel.hidden;
      panel.hidden = !abrir;
      revelar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      revelar.textContent = abrir ? 'Ocultar el interior del DBMS' : 'Mirar dentro del DBMS';
    });

    var oral = document.getElementById('resp-oral');
    document.getElementById('resp-oral-contador').textContent =
      'Extensión: ' + window.LabLogic.countWords(oral.textContent) + ' palabras (objetivo: 80–110, unos 45 segundos de exposición).';
  });

  // Exposición mínima para pruebas automatizadas en el navegador.
  window.__P2 = { QUIZ_P2: QUIZ_P2, TARJETAS: TARJETAS };
})();
