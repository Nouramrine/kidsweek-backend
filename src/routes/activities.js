const express = require("express");
const router = express.Router();
const Activity = require("../models/activities");
const authMiddleware = require("../middleware/auth");
const Task = require("../models/tasks");
const Recurrence = require("../models/recurrences");

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
      .populate("taskIds", "_id name isOk")
      .populate("recurrence", "_id dateDebut dateFin days")
      .sort({ dateBegin: 1 })
      .lean();
    console.log("Activities fetched for member:", memberId, activities);
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
      members:
        a.members?.map((m) => ({
          _id: m._id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          color: m.color,
        })) || [],
      owner: a.owner
        ? {
            firstName: a.owner.firstName,
            lastName: a.owner.lastName,
            email: a.owner.email,
          }
        : null,
      tasks:
        a.taskIds?.map((t) => ({
          _id: t._id,
          text: t.name,
          isOk: t.isOk,
        })) || [],
      recurrence: a.recurrence
        ? {
            dateDebut: a.recurrence.dateDebut,
            dateFin: a.recurrence.dateFin,
            days: a.recurrence.days,
          }
        : null,
      color: a.color || "#ccc",
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
      tasks,
      recurrence,
      dateEndRecurrence,
      members,
      color,
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
    if (Array.isArray(tasks) && tasks.length > 0) {
      for (const t of tasks) {
        if (!t.text) continue;
        const newTask = new Task({
          name: t.text,
          isOk: t.checked || false,
        });
        const saved = await newTask.save();
        createdTaskIds.push(saved._id);
      }
    }

    let createdReccurenceId = "";
    if (recurrence) {
      const newRecurrence = new Recurrence({
        dateDebut: dateBegin,
        dateFin: dateEndRecurrence,
        days: recurrence,
      });
      const saved = await newRecurrence.save();
      createdReccurenceId = saved._id;
    }
    console.log(
      place,
      dateBegin,
      dateEnd,
      reminder,
      note,
      createdTaskIds,
      createdReccurenceId,
      ownerId,
      members,
      color
    );
    // Creer la nouvelle activité avec les taskIds et recurrenceId
    const newActivity = new Activity({
      name,
      place: place || "",
      dateBegin: new Date(dateBegin),
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      reminder: reminder ? new Date(reminder) : null,
      note: note || "",
      validation: false,
      taskIds: createdTaskIds,
      recurrence: createdReccurenceId || null,
      owner: ownerId,
      members: members,
      color: color,
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
// Récupérer les notifications de l'utilisateur
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const now = new Date();

    // Invitations : activités où je suis membre mais pas encore validées
    const invitations = await Activity.find({
      members: memberId,
      validation: false,
    })
      .populate("owner", "firstName lastName email")
      .lean();

    // ✅ Reminders : activités dont le rappel est arrivé, mais qui ne sont pas encore commencées
    const reminders = await Activity.find({
      $or: [{ owner: memberId }, { members: memberId }],
      reminder: { $ne: null, $lte: now },
      dateBegin: { $gt: now }, // activité encore à venir
    })
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email")
      .lean();

    res.json({ result: true, invitations, reminders });
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
    const {
      name,
      place,
      dateBegin,
      dateEnd,
      reminder,
      note,
      tasks,
      recurrence,
      dateEndRecurrence,
      members,
      color,
    } = req.body;
    console.log("=== PUT /activities/:id ===");
    console.log("members reçus :", members);
    console.log("body complet :", req.body);
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

    // Gérer les tasks
    let updatedTaskIds = [];
    if (Array.isArray(tasks) && tasks.length > 0) {
      // Supprimer les anciennes tâches
      if (activity.taskIds && activity.taskIds.length > 0) {
        await Task.deleteMany({ _id: { $in: activity.taskIds } });
      }

      // Créer les nouvelles tâches
      for (const t of tasks) {
        if (!t.text) continue;
        const newTask = new Task({
          name: t.text,
          isOk: t.checked || t.isOk || false,
        });
        const saved = await newTask.save();
        updatedTaskIds.push(saved._id);
      }
    }

    // Gérer la récurrence
    let updatedRecurrenceId = activity.recurrence;

    if (recurrence) {
      // Si une récurrence existait, la mettre à jour COMPLÈTEMENT
      if (activity.recurrence) {
        // CORRECTION : Utiliser findByIdAndUpdate avec l'option de remplacement complet
        await Recurrence.findByIdAndUpdate(
          activity.recurrence,
          {
            dateDebut: dateBegin,
            dateFin: dateEndRecurrence,
            days: {
              lun: recurrence.lun || false,
              mar: recurrence.mar || false,
              mer: recurrence.mer || false,
              jeu: recurrence.jeu || false,
              ven: recurrence.ven || false,
              sam: recurrence.sam || false,
              dim: recurrence.dim || false,
            },
          },
          { overwrite: false } // Ne pas écraser tout le document, mais mettre à jour les champs
        );
      } else {
        // Sinon, créer une nouvelle récurrence
        const newRecurrence = new Recurrence({
          dateDebut: dateBegin,
          dateFin: dateEndRecurrence,
          days: {
            lun: recurrence.lun || false,
            mar: recurrence.mar || false,
            mer: recurrence.mer || false,
            jeu: recurrence.jeu || false,
            ven: recurrence.ven || false,
            sam: recurrence.sam || false,
            dim: recurrence.dim || false,
          },
        });
        const saved = await newRecurrence.save();
        updatedRecurrenceId = saved._id;
      }
    } else {
      // Si pas de récurrence dans la requête, supprimer l'ancienne si elle existe
      if (activity.recurrence) {
        await Recurrence.findByIdAndDelete(activity.recurrence);
        updatedRecurrenceId = null;
      }
    }

    // Mettre à jour l'activité
    activity.name = name || activity.name;
    activity.place = place !== undefined ? place : activity.place;
    activity.dateBegin = dateBegin ? new Date(dateBegin) : activity.dateBegin;
    activity.dateEnd = dateEnd ? new Date(dateEnd) : activity.dateEnd;
    activity.reminder = reminder ? new Date(reminder) : null;
    activity.note = note !== undefined ? note : activity.note;
    activity.taskIds =
      updatedTaskIds.length > 0 ? updatedTaskIds : activity.taskIds;
    activity.recurrence = updatedRecurrenceId;
    activity.members = members || activity.members;
    activity.color = color || activity.color;

    const updatedActivity = await activity.save();

    // Populate pour retourner les données complètes
    const populatedActivity = await Activity.findById(updatedActivity._id)
      .populate("members", "firstName lastName email")
      .populate("owner", "firstName lastName email")
      .populate("taskIds", "_id name isOk")
      .populate("recurrence", "_id dateDebut dateFin days")
      .lean();

    res.json({
      result: true,
      activity: populatedActivity,
      message: "Activité mise à jour avec succès.",
    });
  } catch (err) {
    console.error("Erreur dans PUT /activities/:id :", err);
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

router.put("/:activityId/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { activityId, taskId } = req.params;
    const { isOk } = req.body;
    const memberId = req.member._id;
    //console.log("dans le back");
    // Vérifier que l'activité existe et que le membre y a accès
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        result: false,
        message: "Activité non trouvée.",
      });
    }

    // Vérifier que le membre est soit owner soit participant
    const hasAccess =
      activity.owner.toString() === memberId.toString() ||
      activity.members.some((m) => m.toString() === memberId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        result: false,
        message: "Accès non autorisé.",
      });
    }

    // Mettre à jour la tâche
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { isOk: isOk },
      { new: true } // Retourne le document mis à jour
    );

    if (!updatedTask) {
      return res.status(404).json({
        result: false,
        message: "Tâche non trouvée.",
      });
    }

    res.json({
      result: true,
      task: updatedTask,
      message: "Tâche mise à jour avec succès.",
    });
  } catch (err) {
    console.error(
      "Erreur dans PUT /activities/:activityId/tasks/:taskId :",
      err
    );
    res.status(500).json({ result: false, message: err.message });
  }
});

module.exports = router;
