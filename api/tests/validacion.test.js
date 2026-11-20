// Pruebas de la API que no necesitan PostgreSQL: validación de datos y seguridad de contraseñas y tokens.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cifrarPassword, crearToken, hashToken, sonIguales, verificarPassword } from '../src/seguridad.js';
import { normalizarItems, validarProducto } from '../src/validacion.js';

describe('normalizarItems', () => {
  it('acepta id y cantidad, suma ids repetidos e ignora otros campos como el precio', () => {
    assert.deepEqual(
      normalizarItems([{ id: 1, quantity: 2, price: 1 }, { id: 3, quantity: 1 }, { id: 1, quantity: 1 }]),
      [{ id: 1, quantity: 3 }, { id: 3, quantity: 1 }],
    );
  });

  it('rechaza carritos vacíos, cantidades inválidas e ids que no son enteros', () => {
    for (const items of [[], null, 'x', [{ id: 1, quantity: 0 }], [{ id: 1, quantity: 100 }], [{ id: '1', quantity: 1 }], [{ id: 1.5, quantity: 1 }]]) {
      assert.equal(normalizarItems(items), null, JSON.stringify(items));
    }
  });
});

describe('validarProducto', () => {
  it('exige title, price y category al crear, y solo guarda campos conocidos', () => {
    assert.equal(validarProducto({ title: 'Dados', price: 2990 }).error, 'Falta el campo "category".');
    assert.deepEqual(validarProducto({ title: ' Dados ', price: 2990, category: 'Juegos de mesa', id: 9, admin: true }).campos, {
      title: 'Dados',
      price: 2990,
      category: 'Juegos de mesa',
    });
  });

  it('permite actualizaciones parciales y rechaza valores inválidos', () => {
    assert.deepEqual(validarProducto({ price: 4990 }, { parcial: true }).campos, { price: 4990 });
    assert.match(validarProducto({ price: -1 }, { parcial: true }).error, /price/);
    assert.match(validarProducto({ category: 'Otra' }, { parcial: true }).error, /category/);
    assert.equal(validarProducto({}, { parcial: true }).error, 'No hay campos para guardar.');
  });
});

describe('seguridad', () => {
  it('cifra la contraseña con sal aleatoria y la verifica', async () => {
    const a = await cifrarPassword('Secreta123');
    const b = await cifrarPassword('Secreta123');
    assert.notEqual(a, b);
    assert.ok(!a.includes('Secreta123'));
    assert.equal(await verificarPassword('Secreta123', a), true);
    assert.equal(await verificarPassword('Otra1234', a), false);
    assert.equal(await verificarPassword('Secreta123', 'texto-plano'), false);
  });

  it('genera tokens distintos y compara sin importar el largo', () => {
    const token = crearToken();
    assert.notEqual(token, crearToken());
    assert.equal(hashToken(token).length, 64);
    assert.equal(sonIguales(token, token), true);
    assert.equal(sonIguales(token, 'corto'), false);
  });
});
