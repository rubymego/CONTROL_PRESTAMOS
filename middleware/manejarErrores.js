'use strict';

function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  return res.status(500).json({ mensaje: 'Ocurrió un error interno del servidor.' });
}

module.exports = manejarErrores;