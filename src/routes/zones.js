const express = require("express");
const router = express.Router();
const Zone = require("../models/zones");
const authMiddleware = require("../middleware/auth");

// Creéer une nouvelle zone

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ result: false, message: "Le nom de la zone est requis." });
    }

    const zone = new Zone({
      name,
      members: members || [],
    });

    await zone.save();
    res.status(201).json({ result: true, message: "Zone créée.", zone });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Modifier une zone

router.put("/", authMiddleware, async (req, res) => {
  try {
    const { id, name } = req.body;

    const zone = await Zone.findById(id);
    if (!zone) {
      return res
        .status(404)
        .json({ result: false, message: "Zone non trouvée." });
    }
    if (name) zone.name = name;

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
