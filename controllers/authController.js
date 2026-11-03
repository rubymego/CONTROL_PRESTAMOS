'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { asyncRoute, esDuplicado } = require('./helpers');

const registrar = asyncRoute(async (req, res) => {
  try {
    const contrasena = await bcrypt.hash(req.body.contrasena, 10);
    const usuario = await Usuario.create({
      nombre: req.body.nombre,
      correo: req.body.correo.toLowerCase(),
      contrasena
    });
    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo }
    });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    throw error;
  }
});

const iniciarSesion = asyncRoute(async (req, res) => {
  const usuario = await Usuario.findOne({ where: { correo: req.body.correo.toLowerCase() } });
  const coincide = usuario && await bcrypt.compare(req.body.contrasena, usuario.contrasena);
  if (!coincide) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });

  const token = jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

  return res.json({
    mensaje: 'Inicio de sesión correcto.',
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo }
  });
});

module.exports = { registrar, iniciarSesion };