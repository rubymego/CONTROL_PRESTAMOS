require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const port = Number(process.env.PORT) || 3000;

sequelize.authenticate()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor iniciado en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar con MySQL:', error.message);
    process.exit(1);
  });