// Pruebas de la lógica pura. Ejecutar con: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const L = require('../js/logic.js');

test('scoreQuiz cuenta aciertos y detecta respuestas incompletas', () => {
  const preguntas = [{ id: 'a', correcta: 'x' }, { id: 'b', correcta: 'y' }];
  let r = L.scoreQuiz(preguntas, { a: 'x', b: 'y' });
  assert.strictEqual(r.aciertos, 2); assert.strictEqual(r.completo, true);
  r = L.scoreQuiz(preguntas, { a: 'x', b: 'z' });
  assert.strictEqual(r.aciertos, 1);
  r = L.scoreQuiz(preguntas, { a: 'x' });
  assert.strictEqual(r.completo, false);
  r = L.scoreQuiz(preguntas, {});
  assert.strictEqual(r.aciertos, 0); assert.strictEqual(r.completo, false);
});

test('checkClassification acierta y falla según la categoría', () => {
  const t = [{ id: 'http', categoria: 'si' }, { id: 'particion', categoria: 'dbms' }];
  assert.ok(L.checkClassification(t, 'http', 'si'));
  assert.ok(!L.checkClassification(t, 'particion', 'si'));
  assert.throws(() => L.checkClassification(t, 'nada', 'si'));
});

test('checkMitigation admite varias mitigaciones válidas', () => {
  const r = [{ id: 'sql', mitigaciones: ['estandar', 'abstraccion'] }];
  assert.ok(L.checkMitigation(r, 'sql', 'estandar'));
  assert.ok(L.checkMitigation(r, 'sql', 'abstraccion'));
  assert.ok(!L.checkMitigation(r, 'sql', 'backup'));
});

test('recommendCloud responde según la prioridad', () => {
  assert.strictEqual(L.recommendCloud([]).opcion, null);
  assert.strictEqual(L.recommendCloud(['control']).opcion, 'iaas');
  assert.strictEqual(L.recommendCloud(['equipo']).opcion, 'dbaas');
  assert.strictEqual(L.recommendCloud(['appLista']).opcion, 'saas');
  assert.strictEqual(L.recommendCloud(['evitarDependencia']).opcion, 'iaas');
  assert.strictEqual(L.recommendCloud(['equipo', 'evitarDependencia']).opcion, 'dbaas');
  const r = L.recommendCloud(['control', 'equipo']);
  assert.ok(r.tensiones.includes('control-vs-equipo'));
  assert.ok(L.recommendCloud(['appLista', 'evitarDependencia']).tensiones.includes('applista-vs-dependencia'));
});

test('countWords y countProgress', () => {
  assert.strictEqual(L.countWords('  uno, dos — tres  '), 3);
  assert.strictEqual(L.countWords(''), 0);
  assert.strictEqual(L.countProgress({ a: true, b: false }, ['a', 'b', 'c']), 1);
});
