/*
 * logic.js — Funciones puras (sin DOM) del laboratorio.
 * Se usan en el navegador (window.LabLogic) y en las pruebas de Node (module.exports).
 * Todas las simulaciones del sitio son EDUCATIVAS: no hay ninguna base de datos real.
 */
(function (root) {
  'use strict';

  /** Puntúa un cuestionario. preguntas: [{id, correcta}], respuestas: {id: opcionElegida} */
  function scoreQuiz(preguntas, respuestas) {
    var detalle = preguntas.map(function (p) {
      var elegida = respuestas ? respuestas[p.id] : undefined;
      return {
        id: p.id,
        elegida: elegida === undefined ? null : elegida,
        correcta: elegida === p.correcta,
        respondida: elegida !== undefined && elegida !== null
      };
    });
    var aciertos = detalle.filter(function (d) { return d.correcta; }).length;
    return {
      aciertos: aciertos,
      total: preguntas.length,
      completo: detalle.every(function (d) { return d.respondida; }),
      detalle: detalle
    };
  }

  /** Juego de clasificación: ¿la tarjeta pertenece a la categoría elegida? */
  function checkClassification(tarjetas, id, categoria) {
    var t = tarjetas.filter(function (x) { return x.id === id; })[0];
    if (!t) { throw new Error('Tarjeta desconocida: ' + id); }
    return t.categoria === categoria;
  }

  /** Minijuego de lock-in: ¿la mitigación sirve para ese riesgo? */
  function checkMitigation(riesgos, riesgoId, mitigacionId) {
    var r = riesgos.filter(function (x) { return x.id === riesgoId; })[0];
    if (!r) { throw new Error('Riesgo desconocido: ' + riesgoId); }
    return r.mitigaciones.indexOf(mitigacionId) !== -1;
  }

  /**
   * Constructor de decisiones (escenario: comercializadora con un sistema de facturación pequeño).
   * prioridades: array con 'control', 'equipo', 'appLista', 'evitarDependencia'.
   * Devuelve la opción con mayor puntaje, el puntaje de todas y las tensiones detectadas.
   * Es una heurística didáctica, no una recomendación universal.
   */
  var PESOS = {
    control:           { iaas: 3,  dbaas: 0,  saas: -3 },
    equipo:            { iaas: -2, dbaas: 3,  saas: 2 },
    appLista:          { iaas: -2, dbaas: -1, saas: 4 },
    evitarDependencia: { iaas: 2,  dbaas: 0,  saas: -2 }
  };
  var ORDEN_DESEMPATE = ['dbaas', 'iaas', 'saas'];

  function recommendCloud(prioridades) {
    prioridades = (prioridades || []).filter(function (p) { return PESOS[p]; });
    if (prioridades.length === 0) {
      return { opcion: null, puntajes: null, tensiones: [] };
    }
    var puntajes = { iaas: 0, dbaas: 0, saas: 0 };
    prioridades.forEach(function (p) {
      Object.keys(puntajes).forEach(function (k) { puntajes[k] += PESOS[p][k]; });
    });
    var mejor = ORDEN_DESEMPATE.reduce(function (a, b) {
      return puntajes[b] > puntajes[a] ? b : a;
    });
    var tiene = function (p) { return prioridades.indexOf(p) !== -1; };
    var tensiones = [];
    if (tiene('control') && tiene('equipo')) { tensiones.push('control-vs-equipo'); }
    if (tiene('appLista') && tiene('evitarDependencia')) { tensiones.push('applista-vs-dependencia'); }
    if (tiene('appLista') && tiene('control')) { tensiones.push('applista-vs-control'); }
    return { opcion: mejor, puntajes: puntajes, tensiones: tensiones };
  }

  /** Cuenta palabras (para validar el resumen oral de 80–110 palabras). */
  function countWords(texto) {
    var t = String(texto || '').trim();
    if (!t) { return 0; }
    return t.split(/\s+/).filter(function (w) { return /[\wáéíóúüñÁÉÍÓÚÜÑ]/.test(w); }).length;
  }

  /** Progreso: cuántas actividades están completas en el objeto guardado. */
  function countProgress(estado, actividades) {
    estado = estado || {};
    return actividades.filter(function (a) { return estado[a] === true; }).length;
  }

  var api = {
    scoreQuiz: scoreQuiz,
    checkClassification: checkClassification,
    checkMitigation: checkMitigation,
    recommendCloud: recommendCloud,
    countWords: countWords,
    countProgress: countProgress,
    PESOS: PESOS
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.LabLogic = api; }
})(typeof window !== 'undefined' ? window : this);
