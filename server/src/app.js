const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const clientRoutes = require('./routes/clients');
const quotationRoutes = require('./routes/quotations');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const announcementRoutes = require('./routes/announcements');
const settingRoutes = require('./routes/settings');
const bootstrapAdmin = require('./bootstrap');

try { dotenv.config(); } catch (e) {}

// Sincronizar todas las fechas en UTC-5 (Bogotá/Colombia)
process.env.TZ = 'America/Bogota';

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /\.railway\.app$/,
      /\.brainstudioagencia\.com$/,
      /\.sunpartners\.com\.co$/,
      /^http:\/\/localhost:\d+$/
    ];

    if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Servir archivos estáticos del frontend en producción (antes de rutas de API para assets)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware Catch-all para SPA (Bypassing path-to-regexp)
// Debe ir al final de todas las rutas definidas
app.use((req, res) => {
  // Si la ruta empieza por /api y llega aquí, es un 404 real de API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API Endpoint not found' });
  }

  // Para todo lo demás en producción, servimos el frontend
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  bootstrapAdmin().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  });
}

module.exports = app;
