const express = require("express");
const router = express.Router();
const Zone = require("../models/zones");
const authMiddleware = require("../middleware/auth");

//Récupérer toutes les zones du membre connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1]; // Récup du token utilisateur

    const zones = await Zone.find().lean();
    res.json({ result: true, zones });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Créer une nouvelle zone
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, color, members } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ result: false, message: "Le nom de la zone est requis." });
    }
    if (!color) {
      return res
        .status(400)
        .json({ result: false, message: "La couleur est requise." });
    }

    const zone = new Zone({
      name,
      color: color,
      member: members || [],
    });
    await zone.save();
    res.json({ result: true, zone });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Modifier une zone

router.put("/:zoneId", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { name, color } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res
        .status(404)
        .json({ result: false, message: "Zone non trouvée." });
    }
    if (name) zone.name = name;
    if (color) zone.color = color;

    await zone.save();
    res.json({ result: true, message: "Zone mise à jour.", zone });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Supprimer une zone

router.delete("/:zoneId", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;

    const deletedZone = await Zone.findByIdAndDelete(zoneId);
    if (!deletedZone) {
      return res
        .status(404)
        .json({ result: false, message: "Zone non trouvée." });
    }
    res.json({ result: true, message: "Zone supprimée." });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Ajouter un membre à une zone

router.put("/:zoneId/add-member", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { memberId } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res
        .status(404)
        .json({ result: false, message: "Zone non trouvée." });
    }
    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ result: false, message: "Membre non trouvé." });
    }

    if (!zone.members.includes(memberId)) {
      zone.members.push(memberId);
      await zone.save();
    }
    res.json({ result: true, message: "Membre ajouté à la zone.", zone });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Retirer un membre d'une zone

router.put("/:zoneId/remove-member", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { memberId } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res
        .status(404)
        .json({ result: false, message: "Zone non trouvée." });
    }

    zone.members = zone.members.filter(
      (m) => m.toString() !== memberId.toString()
    );

    await zone.save();
    res.json({ result: true, message: "Membre retiré de la zone.", zone });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

module.exports = router;
