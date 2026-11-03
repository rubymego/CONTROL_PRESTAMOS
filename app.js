const cors = require('cors');
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const prestamosRoutes = require('./routes/prestamosRoutes');
const manejarErrores = require('./middleware/manejarErrores');

const app = express();

// CORS permite que una aplicación de otro origen consulte esta API.
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de control de préstamos de laboratorio' });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/prestamos', prestamosRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use(manejarErrores);

module.exports = app;