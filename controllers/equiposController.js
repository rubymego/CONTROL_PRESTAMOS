'use strict';

const { Op } = require('sequelize');
const { Equipo, Prestamo } = require('../models');
const { asyncRoute, esDuplicado } = require('./helpers');

const listar = asyncRoute(async (req, res) => {
  const equipos = await Equipo.findAll({ order: [['id', 'ASC']] });
  return res.json({ equipos });
});

const crear = asyncRoute(async (req, res) => {
  try {
    const equipo = await Equipo.create(req.body);
    return res.status(201).json({ mensaje: 'Equipo registrado correctamente.', equipo });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'El código de equipo ya existe.' });
    throw error;
  }
});

const obtener = asyncRoute(async (req, res) => {
  const equipo = await Equipo.findByPk(req.params.id);
  if (!equipo) return res.status(404).json({ mensaje: 'No existe un equipo con ese id.' });
  return res.json({ equipo });
});

const actualizar = asyncRoute(async (req, res) => {
  const equipo = await Equipo.findByPk(req.params.id);
  if (!equipo) return res.status(404).json({ mensaje: 'No existe un equipo con ese id.' });
  try {
    await equipo.update(req.body);
    return res.json({ mensaje: 'Equipo actualizado correctamente.', equipo });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'El código de equipo ya existe.' });
    throw error;
  }
});

const eliminar = asyncRoute(async (req, res) => {
  const equipo = await Equipo.findByPk(req.params.id);
  if (!equipo) return res.status(404).json({ mensaje: 'No existe un equipo con ese id.' });
  const historial = await Prestamo.count({ where: { equipo_id: equipo.id } });
  if (historial > 0) {
    return res.status(409).json({ mensaje: 'No se puede eliminar el equipo porque tiene historial de préstamos.' });
  }
  await equipo.destroy();
  return res.json({ mensaje: 'Equipo eliminado correctamente.' });
});

module.exports = { listar, crear, obtener, actualizar, eliminar };