const express = require("express");
const router = express.Router();
const Zone = require("../models/zones");
const Member = require("../models/members");
const authMiddleware = require("../middleware/auth");
const getPopulatedZone = require("../controllers/zones");

//Récupérer toutes les zones du membre connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    let zones = await Zone.find({
      $or: [{ owner: memberId }, { members: memberId }]
    }).lean();

    // Populate & droits
    zones = await Promise.all(
      zones = zones.map( async (zone) => {
        return await getPopulatedZone(memberId, zone);
      })
    )
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
    members.push(memberId)
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
      owner: memberId,
      members: members || [],
    });
    await zone.save();
    res.json({ result: true, zone: await getPopulatedZone(req.member._id, zone) });
  } catch (err) {
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
    console.log(getPopulatedZone(req.member._id, result))
    res.json({ result: true, zone: await getPopulatedZone(req.member._id, zone) });
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
    res.json({ result: true, zone: deletedZone });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
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
        .json({ result: false, error: "Zone non trouvée." });
    }
    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ result: false, error: "Membre non trouvé." });
    }

    if (!zone.members.includes(memberId)) {
      zone.members.push(memberId);
      await zone.save();
    }
    res.json({ result: true, zone: await getPopulatedZone(req.member._id, zone) });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
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
        .json({ result: false, error: "Zone non trouvée." });
    }

    zone.members = zone.members.filter(
      (m) => m.toString() !== memberId.toString()
    );

    await zone.save();
    res.json({ result: true, zone: await getPopulatedZone(req.member._id, zone) });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

module.exports = router;
