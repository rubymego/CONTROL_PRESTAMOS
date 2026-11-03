'use strict';

const bcrypt = require('bcryptjs');
const { Equipo, Prestamo, Usuario } = require('../models');

module.exports = {
  async up() {
    const usuariosDatos = [
      { nombre: 'Ruby Mego', correo: 'ruby@senati.test', contrasena: 'Ruby123' },
      { nombre: 'Ana Torres', correo: 'ana@senati.test', contrasena: 'Ana12345' },
      { nombre: 'Luis Rojas', correo: 'luis@senati.test', contrasena: 'Luis12345' }
    ];

    const usuarios = {};
    for (const dato of usuariosDatos) {
      const [usuario] = await Usuario.findOrCreate({
        where: { correo: dato.correo },
        defaults: {
          nombre: dato.nombre,
          correo: dato.correo,
          contrasena: await bcrypt.hash(dato.contrasena, 10)
        }
      });
      usuarios[dato.correo] = usuario;
    }

    const equiposDatos = [
      ['LAB-MIC-001', 'Microscopio óptico', 'Microscopía', 'Bueno'],
      ['LAB-BAL-002', 'Balanza analítica', 'Medición', 'Bueno'],
      ['LAB-MUL-003', 'Multímetro digital', 'Electricidad', 'Bueno'],
      ['LAB-OSC-004', 'Osciloscopio', 'Electrónica', 'En mantenimiento'],
      ['LAB-PIP-005', 'Pipeta automática', 'Biología', 'Bueno'],
      ['LAB-CEN-006', 'Centrífuga', 'Biología', 'Bueno'],
      ['LAB-TER-007', 'Termómetro digital', 'Medición', 'Bueno'],
      ['LAB-FUE-008', 'Fuente de alimentación', 'Electrónica', 'Bueno']
    ];

    const equipos = {};
    for (const [codigo, nombre, categoria, condicion_uso] of equiposDatos) {
      const [equipo] = await Equipo.findOrCreate({
        where: { codigo },
        defaults: { codigo, nombre, categoria, condicion_uso }
      });
      equipos[codigo] = equipo;
    }

    const prestamosDatos = [
      {
        equipo_id: equipos['LAB-MIC-001'].id,
        usuario_id: usuarios['ruby@senati.test'].id,
        prestatario: 'Estudiante de Biología',
        fecha_prestamo: '2026-11-02',
        fecha_prevista: '2026-11-10',
        fecha_devolucion: null
      },
      {
        equipo_id: equipos['LAB-BAL-002'].id,
        usuario_id: usuarios['ana@senati.test'].id,
        prestatario: 'Estudiante de Química',
        fecha_prestamo: '2026-10-10',
        fecha_prevista: '2026-10-12',
        fecha_devolucion: '2026-10-12'
      },
      {
        equipo_id: equipos['LAB-MUL-003'].id,
        usuario_id: usuarios['luis@senati.test'].id,
        prestatario: 'Estudiante de Electrónica',
        fecha_prestamo: '2026-10-15',
        fecha_prevista: '2026-10-17',
        fecha_devolucion: '2026-10-16'
      }
    ];

    for (const dato of prestamosDatos) {
      await Prestamo.findOrCreate({
        where: {
          equipo_id: dato.equipo_id,
          usuario_id: dato.usuario_id,
          fecha_prestamo: dato.fecha_prestamo,
          prestatario: dato.prestatario
        },
        defaults: dato
      });
    }
  },

  async down() {
    await Prestamo.destroy({ where: {}, force: true });
    await Equipo.destroy({ where: {}, force: true });
    await Usuario.destroy({ where: {}, force: true });
  }
};