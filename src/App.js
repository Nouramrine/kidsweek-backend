const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("../config/db");

const membersRouter = require("./routes/members");
const activitiesRouter = require("./routes/activities");
const zonesRouter = require("./routes/zones");
const invitesRouter = require("./routes/invites");
const { startReminderCron } = require("../services/reminderCron");

// Connexion à la base de données
connectDB();

const app = express();

// ─── Middlewares ──────────────────────────────────────────────────────────────

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/members", membersRouter);
app.use("/activities", activitiesRouter);
app.use("/zones", zonesRouter);
app.use("/invites", invitesRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000; // ✅ PORT défini depuis .env ou 3000 par défaut

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  startReminderCron();
});

module.exports = app;
