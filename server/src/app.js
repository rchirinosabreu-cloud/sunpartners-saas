const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const bootstrapAdmin = require('./bootstrap');

dotenv.config();

// Sincronizar todas las fechas en UTC-5 (Bogotá/Colombia)
process.env.TZ = 'America/Bogota';

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /\.railway\.app$/,
      /\.brainstudioagencia\.com$/,
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

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
