'use strict';

const express = require('express');
const { body } = require('express-validator');
const validar = require('../middleware/validar');
const { registrar, iniciarSesion } = require('../controllers/authController');

const router = express.Router();

router.post('/registro', [
  body('nombre').trim().notEmpty().withMessage('nombre es obligatorio.'),
  body('correo').trim().isEmail().withMessage('correo debe tener un formato válido.'),
  body('contrasena').isLength({ min: 6 }).withMessage('contrasena debe tener al menos 6 caracteres.')
], validar, registrar);

router.post('/login', [
  body('correo').trim().isEmail().withMessage('correo debe tener un formato válido.'),
  body('contrasena').notEmpty().withMessage('contrasena es obligatoria.')
], validar, iniciarSesion);

module.exports = router;