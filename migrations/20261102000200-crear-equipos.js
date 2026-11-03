'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(120), allowNull: false },
      categoria: { type: Sequelize.STRING(80), allowNull: false },
      condicion_uso: { type: Sequelize.STRING(100), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipos');
  }
};