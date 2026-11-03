'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const autenticar = require('../middleware/autenticar');
const validar = require('../middleware/validar');
const controller = require('../controllers/equiposController');

const router = express.Router();
const validarId = param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo.');
const validarEquipo = [
  body('codigo').trim().notEmpty().withMessage('codigo es obligatorio.'),
  body('nombre').trim().notEmpty().withMessage('nombre es obligatorio.'),
  body('categoria').trim().notEmpty().withMessage('categoria es obligatoria.'),
  body('condicion_uso').trim().notEmpty().withMessage('condicion_uso es obligatoria.')
];

router.use(autenticar);
router.get('/', controller.listar);
router.post('/', validarEquipo, validar, controller.crear);
router.get('/:id', validarId, validar, controller.obtener);
router.put('/:id', [validarId, ...validarEquipo], validar, controller.actualizar);
router.delete('/:id', validarId, validar, controller.eliminar);

module.exports = router;