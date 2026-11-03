'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prestamos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      equipo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'equipos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      prestatario: { type: Sequelize.STRING(120), allowNull: false },
      fecha_prestamo: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_prevista: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_devolucion: { type: Sequelize.DATEONLY, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE `prestamos` ADD COLUMN `equipo_activo` INT GENERATED ALWAYS AS (CASE WHEN `fecha_devolucion` IS NULL THEN `equipo_id` ELSE NULL END) VIRTUAL'
    );
    await queryInterface.addIndex('prestamos', ['equipo_activo'], {
      name: 'uq_prestamos_equipo_activo',
      unique: true
    });
    await queryInterface.addIndex('prestamos', ['equipo_id'], { name: 'idx_prestamos_equipo' });
    await queryInterface.addIndex('prestamos', ['usuario_id'], { name: 'idx_prestamos_usuario' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prestamos');
  }
};