require('dotenv').config();

const express = require('express');
const path = require('path');
const usuariosRouter = require('./routes/usuarios');

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');
const port = Number(process.env.PORT) || 3000;

const variablesFaltantes = ['DB_HOST', 'DB_USER'].filter((key) => !process.env[key]);
if (variablesFaltantes.length > 0) {
  console.error(`Configurá estas variables en .env: ${variablesFaltantes.join(', ')}`);
  process.exit(1);
}

app.use(express.json({ limit: '10kb' }));
app.use('/api/usuarios', usuariosRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API no encontrada.' }));
app.use(express.static(frontendPath));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido.' });
  }

  console.error('Error de base de datos/API:', error.code || 'ERROR');
  res.status(500).json({
    error: 'No se pudo completar la operación. Revisá la conexión y la tabla usuarios.'
  });
});

app.listen(port, () => {
  console.log(`Aplicación disponible en http://localhost:${port}`);
});