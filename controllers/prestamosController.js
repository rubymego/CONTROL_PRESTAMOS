'use strict';

const { Op } = require('sequelize');
const { sequelize, Equipo, Prestamo, Usuario } = require('../models');
const { asyncRoute } = require('./helpers');

function esConflictoUnico(error) {
  return error.name === 'SequelizeUniqueConstraintError'
    || error.original?.code === 'ER_DUP_ENTRY'
    || error.original?.errno === 1062;
}

const listar = asyncRoute(async (req, res) => {
  const where = {};
  if (req.query.activos === 'true') where.fecha_devolucion = null;
  if (req.query.equipo_id) where.equipo_id = Number(req.query.equipo_id);

  const prestamos = await Prestamo.findAll({
    where,
    include: [
      { model: Equipo, as: 'equipo' },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] }
    ],
    order: [['id', 'ASC']]
  });
  return res.json({ prestamos });
});

const crear = asyncRoute(async (req, res) => {
  try {
    const prestamo = await sequelize.transaction(async (transaction) => {
      const equipo = await Equipo.findByPk(req.body.equipo_id, { transaction });
      if (!equipo) {
        const error = new Error('EQUIPO_NO_EXISTE');
        error.code = 'EQUIPO_NO_EXISTE';
        throw error;
      }

      const activo = await Prestamo.findOne({
        where: { equipo_id: equipo.id, fecha_devolucion: null },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (activo) {
        const error = new Error('EQUIPO_PRESTADO');
        error.code = 'EQUIPO_PRESTADO';
        throw error;
      }

      return Prestamo.create({
        equipo_id: equipo.id,
        usuario_id: req.usuario.id,
        prestatario: req.body.prestatario,
        fecha_prestamo: req.body.fecha_prestamo,
        fecha_prevista: req.body.fecha_prevista
      }, { transaction });
    });

    return res.status(201).json({ mensaje: 'Préstamo registrado correctamente.', prestamo });
  } catch (error) {
    if (error.code === 'EQUIPO_NO_EXISTE') return res.status(404).json({ mensaje: 'El equipo indicado no existe.' });
    if (error.code === 'EQUIPO_PRESTADO' || esConflictoUnico(error)) {
      return res.status(409).json({ mensaje: 'El equipo ya tiene un préstamo activo.' });
    }
    throw error;
  }
});

const devolver = asyncRoute(async (req, res) => {
  const prestamo = await Prestamo.findByPk(req.params.id);
  if (!prestamo) return res.status(404).json({ mensaje: 'No existe un préstamo con ese id.' });
  if (prestamo.fecha_devolucion) {
    return res.status(409).json({ mensaje: 'Este préstamo ya fue devuelto.' });
  }

  const fechaDevolucion = req.body.fecha_devolucion || new Date().toISOString().slice(0, 10);
  if (fechaDevolucion < prestamo.fecha_prestamo) {
    return res.status(400).json({
      mensaje: 'fecha_devolucion no puede ser anterior a fecha_prestamo.',
      errores: [{ campo: 'fecha_devolucion', mensaje: 'Debe ser igual o posterior a la fecha del préstamo.' }]
    });
  }

  await prestamo.update({ fecha_devolucion: fechaDevolucion });
  return res.json({ mensaje: 'Devolución registrada correctamente.', prestamo });
});

module.exports = { listar, crear, devolver };