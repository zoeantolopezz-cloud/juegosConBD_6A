const express = require('express');
const pool = require('../db');

const router = express.Router();
const camposUsuario = ['usu_usuario', 'usu_nombre', 'usu_apellido'];

function validarId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarUsuario(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Ingresá los datos del usuario.' };
  }

  const usuario = {};
  for (const campo of camposUsuario) {
    if (typeof body[campo] !== 'string') {
      return { error: 'Completá todos los campos.' };
    }

    const valor = body[campo].trim();
    if (!valor) return { error: 'Completá todos los campos.' };
    if (valor.length > 50) {
      return { error: 'Cada campo debe tener como máximo 50 caracteres.' };
    }
    usuario[campo] = valor;
  }

  return { usuario };
}

router.get('/', async (req, res, next) => {
  try {
    const [usuarios] = await pool.execute(
      'SELECT usu_id, usu_usuario, usu_nombre, usu_apellido FROM usuarios ORDER BY usu_id'
    );
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El ID debe ser un número entero positivo.' });

  try {
    const [usuarios] = await pool.execute(
      'SELECT usu_id, usu_usuario, usu_nombre, usu_apellido FROM usuarios WHERE usu_id = ?',
      [id]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'No se encontró un usuario con ese ID.' });
    }
    res.json(usuarios[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { usuario, error: validationError } = validarUsuario(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const [result] = await pool.execute(
      'INSERT INTO usuarios (usu_usuario, usu_nombre, usu_apellido) VALUES (?, ?, ?)',
      [usuario.usu_usuario, usuario.usu_nombre, usuario.usu_apellido]
    );
    const [usuarios] = await pool.execute(
      'SELECT usu_id, usu_usuario, usu_nombre, usu_apellido FROM usuarios WHERE usu_id = ?',
      [result.insertId]
    );
    res.status(201).json(usuarios[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El ID debe ser un número entero positivo.' });

  const { usuario, error: validationError } = validarUsuario(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    await pool.execute(
      'UPDATE usuarios SET usu_usuario = ?, usu_nombre = ?, usu_apellido = ? WHERE usu_id = ?',
      [usuario.usu_usuario, usuario.usu_nombre, usuario.usu_apellido, id]
    );
    const [usuarios] = await pool.execute(
      'SELECT usu_id, usu_usuario, usu_nombre, usu_apellido FROM usuarios WHERE usu_id = ?',
      [id]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'No se encontró un usuario con ese ID.' });
    }
    res.json(usuarios[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El ID debe ser un número entero positivo.' });

  try {
    const [result] = await pool.execute('DELETE FROM usuarios WHERE usu_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró un usuario con ese ID.' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;