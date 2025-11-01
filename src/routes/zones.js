const express = require("express");
const router = express.Router();
const Zone = require("../models/zones");
const Member = require("../models/members");
const authMiddleware = require("../middleware/auth");
const getZones = require("../controllers/zones");

//Récupérer toutes les zones du membre connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const zones = await getZones(req.member._id);
    res.json({ result: true, zones });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Créer une nouvelle zone
router.post("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const { name, color, members } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ result: false, error: "Le nom de la zone est requis." });
    }
    if (!color) {
      return res
        .status(400)
        .json({ result: false, error: "La couleur est requise." });
    }
    const zone = new Zone({
      name,
      color: color,
      authorizations : [ { member: memberId, level: 'admin' } ],
    });
    await zone.save();
    res.json({ result: true, zones: await getZones(req.member._id, zone._id) });
  } catch (err) {
    console.log("Create Zone", err)
    res.status(500).json({ result: false, error: err.message });
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
        .json({ result: false, error: "Zone non trouvée." });
    }
    if (name) zone.name = name;
    if (color) zone.color = color;

    const result = await zone.save();
    res.json({ result: true, zones: await getZones(req.member._id, zone._id) });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Supprimer une zone

router.delete("/:zoneId", authMiddleware, async (req, res) => {
  try {
    const zoneId = req.params.zoneId;
    const deletedZone = await Zone.findByIdAndDelete(zoneId);
    if (!deletedZone) {
      return res.status(404).json({ result: false, error: "Zone non trouvée." });
    }
    res.json({ result: true, zones: deletedZone });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Ajouter un membre à une zone

router.put("/:zoneId/add-member", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { memberId } = req.body;

    // Vérifier que la zone existe
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ result: false, error: "Zone non trouvée." });
    }

    // Vérifier que le membre existe
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ result: false, error: "Membre non trouvé." });
    }

    // Vérifier si le membre est déjà dans la zone
    const exists = zone.authorizations.some(auth => auth.member.toString() === memberId);
    if (exists) {
      return res.status(400).json({ result: false, error: "Le membre est déjà dans cette zone." });
    }

    // Ajouter le membre avec un niveau d'autorisation par défaut
    zone.authorizations.push({ member: memberId, level: 'read' });
    await zone.save();

    res.json({ result: true, zones: await getZones(req.member._id, zone._id) });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Retirer un membre d'une zone

router.put("/:zoneId/remove-member", authMiddleware, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { memberId } = req.body;

    // Vérifier que la zone existe
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ result: false, error: "Zone non trouvée." });
    }

    // Vérifier que le membre existe
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ result: false, error: "Membre non trouvé." });
    }

    // Vérifier si le membre est dans la zone
    const index = zone.authorizations.findIndex(auth => auth.member.toString() === memberId);
    if (index === -1) {
      return res.status(400).json({ result: false, error: "Le membre n'est pas dans cette zone." });
    }

    // Supprimer le membre de la liste des authorizations
    zone.authorizations.splice(index, 1);
    await zone.save();

    res.json({ result: true, zones: await getZones(req.member._id, zone._id) });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

module.exports = router;
