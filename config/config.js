require('dotenv').config();

const databaseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'control_prestamos',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false
};

module.exports = {
  development: databaseConfig,
  test: databaseConfig,
  production: databaseConfig
};