'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const autenticar = require('../middleware/autenticar');
const validar = require('../middleware/validar');
const controller = require('../controllers/prestamosController');

const router = express.Router();
const fechaValida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor)
  && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`))
  && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;

router.use(autenticar);

router.get('/', [
  query('activos').optional().isIn(['true', 'false']).withMessage('activos solo acepta true o false.'),
  query('equipo_id').optional().isInt({ min: 1 }).withMessage('equipo_id debe ser un entero positivo.')
], validar, controller.listar);

router.post('/', [
  body('equipo_id').isInt({ min: 1 }).withMessage('equipo_id debe ser un entero positivo.'),
  body('prestatario').trim().notEmpty().withMessage('prestatario es obligatorio.'),
  body('fecha_prestamo').custom((valor) => fechaValida(valor)).withMessage('fecha_prestamo debe tener formato YYYY-MM-DD y ser una fecha válida.'),
  body('fecha_prevista').custom((valor) => fechaValida(valor)).withMessage('fecha_prevista debe tener formato YYYY-MM-DD y ser una fecha válida.'),
  body('fecha_prevista').custom((valor, { req }) => fechaValida(req.body.fecha_prestamo) && valor >= req.body.fecha_prestamo)
    .withMessage('fecha_prevista no puede ser anterior a fecha_prestamo.')
], validar, controller.crear);

router.put('/:id/devolucion', [
  param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo.'),
  body('fecha_devolucion').optional().custom((valor) => fechaValida(valor))
    .withMessage('fecha_devolucion debe tener formato YYYY-MM-DD y ser una fecha válida.')
], validar, controller.devolver);

module.exports = router;