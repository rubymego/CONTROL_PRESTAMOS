'use strict';

function asyncRoute(controlador) {
  return (req, res, next) => Promise.resolve(controlador(req, res, next)).catch(next);
}

function esDuplicado(error) {
  return error.name === 'SequelizeUniqueConstraintError';
}

module.exports = { asyncRoute, esDuplicado };