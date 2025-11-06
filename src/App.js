const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("../config/db");
//const userRoutes = require('./routes/userRoutes');

const membersRouter = require("./routes/members");
const activitiesRouter = require("./routes/activities");
const zonesRouter = require("./routes/zones");
const invitesRouter = require("./routes/invites");

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  // console.log(
  //   `[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${
  //     req.url
  //   } ${JSON.stringify(req.body)}`
  // );
  next();
});

// Routes
//app.use('/users', userRoutes);
app.use("/members", membersRouter);
app.use("/activities", activitiesRouter);
app.use("/zones", zonesRouter);
app.use("/invites", invitesRouter);
// Route par défaut
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

module.exports = app;
