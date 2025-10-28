const express = require("express");
const router = express.Router();
const Activity = require("../models/activities");
const authMiddleware = require("../middleware/auth");
const Task = require("../models/tasks");

// Récupérer les activités à venir du membre
router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const now = new Date();

    const activities = await Activity.find({
      $or: [{ owner: memberId }, { members: memberId }],
      dateBegin: { $gte: now },
    })
      .populate("members", "firstName lastName email")
      .populate("owner", "firstName lastName email")
      .sort({ dateBegin: 1 })
      .lean();

    if (!activities.length) {
      return res.json({
        result: true,
        activities: [],
        message: "Aucune activité à venir.",
      });
    }

    const formatted = activities.map((a) => ({
      _id: a._id,
      name: a.name,
      place: a.place || "",
      dateBegin: a.dateBegin,
      dateEnd: a.dateEnd,
      reminder: a.reminder || "",
      note: a.note || "",
      validation: a.validation,
      members: a.members.map((m) => ({
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
      })),
      owner: {
        firstName: a.owner?.firstName || "",
        lastName: a.owner?.lastName || "",
        email: a.owner?.email || "",
      },
    }));

    res.json({ result: true, activities: formatted });
  } catch (err) {
    console.error("Erreur dans GET /activities :", err);
    res.status(500).json({
      result: false,
      message: "Erreur serveur lors de la récupération des activités.",
    });
  }
});

// Créer une nouvelle activité
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      place,
      dateBegin,
      dateEnd,
      reminder,
      note,
      task,
      recurrence,
      members,
    } = req.body;

    if (!name || !dateBegin) {
      return res.json({
        result: false,
        message: "Les champs obligatoires sont manquants (name, dateBegin).",
      });
    }

    const ownerId = req.member._id;

    // Gérer les tasks et stocker leurs IDs

    let createdTaskIds = [];
    if (Array.isArray(task) && task.length > 0) {
      for (const t of task) {
        if (!t.text) continue;
        const newTask = new Task({
          name: t.text,
          isOk: t.checked || false,
        });
        const saved = await newTask.save();
        createdTaskIds.push(saved._id);
      }
    }

    // Creer la nouvelle activité avec les taskIds
    const newActivity = new Activity({
      name,
      place: place || "",
      dateBegin: new Date(dateBegin),
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      reminder: reminder || "",
      note: note || "",
      validation: false,
      taskId: createdTaskIds,
      recurrence: recurrence || null,
      owner: ownerId,
      members: members?.length ? members : [ownerId],
    });

    const savedActivity = await newActivity.save();

    res.json({
      result: true,
      activity: savedActivity,
      message: "Activité créée avec succès.",
    });
  } catch (err) {
    console.error("Erreur dans POST /activities :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});
// Recupérer les notifications de l'utilisateur
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;

    const activities = await Activity.find({
      members: memberId,
      validation: false,
    })
      .populate("owner", "firstName lastName email")
      .lean();

    const reminders = await Activity.find({
      owner: memberId,
      reminder: { $ne: null },
    }).lean();

    res.json({ result: true, invitations: activities, reminders });
  } catch (err) {
    console.error("Erreur dans GET /activities/notifications :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});
//  Supprimer une activité
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member._id;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res
        .status(404)
        .json({ result: false, message: "Activité non trouvée." });
    }

    if (activity.owner.toString() !== memberId.toString()) {
      return res
        .status(403)
        .json({ result: false, message: "Suppression non autorisée." });
    }

    await Activity.findByIdAndDelete(id);
    res.json({ result: true, message: "Activité supprimée avec succès." });
  } catch (err) {
    console.error("Erreur dans DELETE /activities :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

//  Modifier une activité
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member._id;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res
        .status(404)
        .json({ result: false, message: "Activité non trouvée." });
    }

    if (activity.owner.toString() !== memberId.toString()) {
      return res
        .status(403)
        .json({ result: false, message: "Modification non autorisée." });
    }

    const updatableFields = [
      "name",
      "place",
      "dateBegin",
      "dateEnd",
      "reminder",
      "note",
      "validation",
      "taskId",
      "recurrence",
      "members",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) activity[field] = req.body[field];
    });

    const updated = await activity.save();
    res.json({
      result: true,
      activity: updated,
      message: "Activité mise à jour avec succès.",
    });
  } catch (err) {
    console.error("Erreur dans PUT /activities :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// Valider ou refuser une activité (depuis la notification)
router.put("/:id/validate", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { validate } = req.body;
    const memberId = req.member._id;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res
        .status(404)
        .json({ result: false, message: "Activité non trouvée." });
    }
    // Vérifier que le membre fait partie des participants
    if (!activity.members.some((m) => m.toString() === memberId.toString())) {
      return res.status(403).json({
        result: false,
        message: "Vous ne participez pas a cette activité",
      });
    }

    activity.validation = validate;
    await activity.save();

    res.json({
      result: true,
      message: validate ? "Activité acceptée." : "Activité refusée.",
    });
  } catch (err) {
    console.error("Erreur dans PUT /activities/:id/validate :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

module.exports = router;
