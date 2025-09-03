require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Configuration CORS complète
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));



// Middleware pour les autres requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const banqueRoutes = require('./routes/banques');
const systemRoutes = require('./routes/system');
const fileRoutes = require('./routes/files');
const userUploadRoutes = require('./routes/userUploads');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banques', banqueRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/user-uploads', userUploadRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DataFlow API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
