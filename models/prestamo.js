'use strict';

module.exports = (sequelize, DataTypes) => {
  const Prestamo = sequelize.define('Prestamo', {
    equipo_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    prestatario: { type: DataTypes.STRING(120), allowNull: false },
    fecha_prestamo: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_prevista: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_devolucion: { type: DataTypes.DATEONLY, allowNull: true }
  }, {
    tableName: 'prestamos'
  });

  Prestamo.associate = (models) => {
    Prestamo.belongsTo(models.Equipo, { foreignKey: 'equipo_id', as: 'equipo' });
    Prestamo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return Prestamo;
};