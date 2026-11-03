'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    correo: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    contrasena: { type: DataTypes.STRING(255), allowNull: false }
  }, {
    tableName: 'usuarios'
  });

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Prestamo, { foreignKey: 'usuario_id', as: 'prestamos' });
  };

  return Usuario;
};