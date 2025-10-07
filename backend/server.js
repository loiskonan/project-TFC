require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressSanitizer = require('express-sanitizer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Configuration CORS complète
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Configuration Helmet pour la sécurité des headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactivé pour éviter les problèmes avec les uploads
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors(corsOptions));

// Configuration Rate Limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requêtes par fenêtre (développement)
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 tentatives de connexion par IP (5 x 3)
  message: (req, res) => {
    const windowMs = 5; // 5 minutes en minutes
    return {
      success: false,
      message: `Trop de tentatives de connexion, veuillez réessayer dans ${windowMs} minutes.`
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour les uploads de fichiers
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 135, // 135 uploads par heure par IP (45 x 3)
  message: {
    success: false,
    message: 'Trop d\'uploads de fichiers, veuillez réessayer dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting général
app.use(generalLimiter);

// Middleware pour les autres requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sanitisation pour nettoyer les entrées
app.use(expressSanitizer());


// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const banqueRoutes = require('./routes/banques');
const systemRoutes = require('./routes/system');
const fileRoutes = require('./routes/files');
const userUploadRoutes = require('./routes/userUploads');
const fileSendRoutes = require('./routes/fileSend');
const banqueProductRoutes = require('./routes/banqueProducts');
const userProductRoutes = require('./routes/userProducts');

// Appliquer les rate limiters spécifiques aux routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user-uploads', uploadLimiter, userUploadRoutes);
app.use('/api/file-send', uploadLimiter, fileSendRoutes);

// Routes sans rate limiting spécial
app.use('/api/users', userRoutes);
app.use('/api/banques', banqueRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/banque-products', banqueProductRoutes);
app.use('/api/user-products', userProductRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DataFlow API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // Server running
});
