const express = require('express');
const helmet = require("helmet");
const hpp = require('hpp');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const usersRouter = require('./routes/users');


const app = express();
app.use(cors());

// Middleware de sécurité
app.use(helmet());
app.use(hpp());
app.use(xss());

// Configuration de CORS (plus flexible et sécurisée que les headers manuels)
app.use(cors({
  origin: '*', // Remplacez par votre domaine spécifique en production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
 
// Body Parser (inclus dans Express depuis la v4.16)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour gérer les formulaires classiques

// Journalisation (uniquement en développement)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiteur de débit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,  // Retourne les headers RateLimit-*
  legacyHeaders: false, // Désactive les anciens headers X-RateLimit-*
});
app.use(limiter);

// Routes
app.use('/users', usersRouter);

// Gestion des fichiers statiques 
app.use(express.static(path.join(__dirname, 'public')));

// Page d'accueil par défaut (si nécessaire)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
  