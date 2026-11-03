'use strict';

module.exports = (sequelize, DataTypes) => {
  const Equipo = sequelize.define('Equipo', {
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false },
    categoria: { type: DataTypes.STRING(80), allowNull: false },
    condicion_uso: { type: DataTypes.STRING(100), allowNull: false }
  }, {
    tableName: 'equipos'
  });

  Equipo.associate = (models) => {
    Equipo.hasMany(models.Prestamo, { foreignKey: 'equipo_id', as: 'prestamos' });
  };

  return Equipo;
};