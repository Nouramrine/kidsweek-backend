const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('../config/db');
//const userRoutes = require('./routes/userRoutes');

dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
//app.use('/users', userRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});