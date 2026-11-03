'use strict';

const { validationResult } = require('express-validator');

function validar(req, res, next) {
  const resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Hay datos inválidos o incompletos.',
      errores: resultado.array().map((error) => ({ campo: error.path, mensaje: error.msg }))
    });
  }
  next();
}

module.exports = validar;