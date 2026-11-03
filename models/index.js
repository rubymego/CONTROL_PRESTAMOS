'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = {};

for (const file of fs.readdirSync(__dirname)) {
  if (file === 'index.js' || !file.endsWith('.js')) continue;
  const defineModel = require(path.join(__dirname, file));
  const model = defineModel(sequelize, Sequelize.DataTypes);
  models[model.name] = model;
}

for (const model of Object.values(models)) {
  if (model.associate) model.associate(models);
}

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;