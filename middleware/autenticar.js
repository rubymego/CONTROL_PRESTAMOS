'use strict';

const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

async function autenticar(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const coincidencia = authorization.match(/^Bearer\s+(.+)$/i);

  if (!coincidencia) {
    return res.status(401).json({ mensaje: 'Se requiere un token Bearer válido.' });
  }

  try {
    const datos = jwt.verify(coincidencia[1], process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(datos.id, {
      attributes: ['id', 'nombre', 'correo']
    });
    if (!usuario) return res.status(401).json({ mensaje: 'El usuario del token ya no existe.' });
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'El token es inválido o ha expirado.' });
  }
}

module.exports = autenticar;