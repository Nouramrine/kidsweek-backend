const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Activity = require("../models/activities");
const authMiddleware = require("../middleware/auth");
const Task = require("../models/tasks");
const Recurrence = require("../models/recurrences");
const Notification = require("../models/notifications");

// Récupérer les activités à venir du membre
router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const now = new Date();
    const includePast = req.query.includePast === "true";

    // 1️⃣ Récupérer les activités que le membre a acceptées
    const acceptedActivityIds = await Notification.find({
      memberId,
      type: "invitation",
      status: "done",
      "meta.accepted": true,
    }).distinct("activityId");

    // 2️⃣ Filtrer les activités pour le planning
    const filter = {
      $or: [
        { owner: memberId }, // Toutes les activités où il est propriétaire
        { _id: { $in: acceptedActivityIds } }, // Les activités qu’il a acceptées
      ],
    };

    if (!includePast) {
      filter.dateBegin = { $gte: now };
    }

    const activities = await Activity.find(filter)
      .populate("members", "firstName lastName email")
      .populate("owner", "firstName lastName email")
      .populate("taskIds", "_id name isOk")
      .populate("recurrence", "_id dateDebut dateFin days")
      .sort({ dateBegin: 1 })
      .lean();

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
      members, // IDs des invités
      color,
    } = req.body;

    if (!name || !dateBegin) {
      return res.json({
        result: false,
        message: "Les champs obligatoires sont manquants (name, dateBegin).",
      });
    }

    const ownerId = req.member._id;

    //Créer les tâches si présentes
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

    //Créer la récurrence si définie
    let createdRecurrenceId = null;
    if (recurrence) {
      const newRecurrence = new Recurrence({
        dateDebut: dateBegin,
        dateFin: dateEndRecurrence,
        days: recurrence,
      });
      const saved = await newRecurrence.save();
      createdRecurrenceId = saved._id;
    }

    // 3️⃣ Créer l'activité (sans invités)
    const newActivity = new Activity({
      name,
      place: place || "",
      dateBegin: new Date(dateBegin),
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      reminder: reminder ? new Date(reminder) : null,
      note: note || "",
      validation: false,
      taskIds: createdTaskIds,
      recurrence: createdRecurrenceId,
      owner: ownerId,
      members: [],
      color: color || "#ccc",
    });

    const savedActivity = await newActivity.save();

    //Créer les invitations dans Notification
    if (Array.isArray(members) && members.length > 0) {
      const recipients = members.filter(
        (m) => m.toString() !== ownerId.toString(),
      );

      // console.log("🎯 Création des invitations pour:", {
      //   activity: name,
      //   recipients,
      //   owner: ownerId,
      // });

      for (const rec of recipients) {
        const message = `Vous êtes invité(e) à "${name}" le ${new Date(
          dateBegin,
        ).toLocaleString("fr-FR")}.`;

        const notif = new Notification({
          memberId: rec,
          activityId: savedActivity._id,
          sender: ownerId,
          type: "invitation",
          message,
          criticality: "medium",
          status: "pending",
          meta: { activityName: name },
        });
        await notif.save();
      }
    }

    //Créer les reminders si nécessaire
    if (reminder) {
      const remDate = new Date(reminder);
      const now = new Date();
      const MIN_DIFF_MS = -60000;
      const diff = remDate - now;

      if (diff >= MIN_DIFF_MS) {
        const recipients = [ownerId, ...(members || [])];

        for (const rec of recipients) {
          const exists = await Notification.findOne({
            memberId: rec,
            activityId: savedActivity._id,
            type: "reminder",
          });

          const message = `Rappel : "${name}" programmé le ${new Date(
            dateBegin,
          ).toLocaleString("fr-FR")}.`;

          if (!exists) {
            const notif = new Notification({
              memberId: rec,
              activityId: savedActivity._id,
              sender: ownerId,
              type: "reminder",
              message,
              criticality: "high",
              status: "pending",
              expiresAt: dateEnd ? new Date(dateEnd) : new Date(dateBegin),
              meta: { reminderDate: remDate },
            });
            await notif.save();
          }
        }
      }
    }

    res.json({
      result: true,
      activity: savedActivity,
      message:
        "Activité créée avec succès. Les invitations sont envoyées, elles apparaîtront dans la modal de notifications.",
    });
  } catch (err) {
    console.error("Erreur dans POST /activities :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// Récupérer les notifications de l'utilisateur
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    let memberId = req.member._id;
    if (!(memberId instanceof mongoose.Types.ObjectId)) {
      memberId = new mongoose.Types.ObjectId(String(req.member._id));
    }

    const invitations = await Notification.find({
      memberId,
      type: "invitation",
      status: "pending",
    })
      .populate("sender", "firstName lastName email")
      .populate("activityId")
      .lean();

    /*console.log(
      "🔍 Invitations trouvées en base:",
      invitations.map((inv) => ({
        id: inv._id,
        memberId: inv.memberId,
        activityName: inv.activityId?.name,
        sender: inv.sender?.firstName,
      }))
    );*/

    const reminders = await Notification.find({
      memberId,
      type: "reminder",
      status: "pending",
      "meta.reminderDate": { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // ✅ Filtre les reminders obsolètes
    })
      .populate("activityId")
      .lean();

    res.json({ result: true, invitations, reminders });
  } catch (err) {
    console.error("Erreur dans GET /activities/notifications :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// Supprimer une activité
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

// Modifier une activité
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
      if (activity.taskIds && activity.taskIds.length > 0) {
        await Task.deleteMany({ _id: { $in: activity.taskIds } });
      }
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
      if (activity.recurrence) {
        await Recurrence.findByIdAndUpdate(
          activity.recurrence,
          {
            dateDebut: dateBegin,
            dateFin: dateEndRecurrence,
            days: recurrence,
          },
          { overwrite: false },
        );
      } else {
        const newRecurrence = new Recurrence({
          dateDebut: dateBegin,
          dateFin: dateEndRecurrence,
          days: recurrence,
        });
        const saved = await newRecurrence.save();
        updatedRecurrenceId = saved._id;
      }
    } else if (activity.recurrence) {
      await Recurrence.findByIdAndDelete(activity.recurrence);
      updatedRecurrenceId = null;
    }

    // Sauvegarder ancien ensemble de membres pour diff
    const previousMembers = activity.members?.map((m) => m.toString()) || [];

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

    // Notifications pour membres ajoutés
    const newMembers = Array.isArray(members)
      ? members.map((m) => m.toString())
      : previousMembers;
    const added = newMembers.filter((m) => !previousMembers.includes(m));
    const removed = previousMembers.filter((m) => !newMembers.includes(m));

    for (const rec of added) {
      if (rec === activity.owner.toString()) continue;
      const message = `Vous êtes invité(e) à "${activity.name}" le ${new Date(
        activity.dateBegin,
      ).toLocaleString("fr-FR")}.`;
      const exists = await Notification.findOne({
        memberId: rec,
        activityId: activity._id,
        type: "invitation",
      });
      if (!exists) {
        const notif = new Notification({
          memberId: rec,
          activityId: activity._id,
          sender: activity.owner,
          type: "invitation",
          message,
          criticality: "medium",
          status: "pending",
        });
        await notif.save();
      }
    }

    if (removed.length > 0) {
      await Notification.deleteMany({
        memberId: { $in: removed },
        activityId: activity._id,
      });
    }

    // Reminder notification mise à jour
    if (reminder) {
      const remDate = new Date(reminder);
      const now = new Date();

      // ✅ Même tolérance que pour POST
      const MIN_DIFF_MS = -60000; // -60 secondes
      const diff = remDate - now;

      // console.log("⏰ Update Reminder check:", {
      //   reminderDate: remDate.toISOString(),
      //   now: now.toISOString(),
      //   diff: diff,
      //   willCreate: diff >= MIN_DIFF_MS,
      // });

      if (diff >= MIN_DIFF_MS) {
        const recipients =
          Array.isArray(members) && members.length > 0
            ? members
            : [activity.owner];

        // ✅ IMPORTANT : Supprimer les anciennes notifications reminder
        await Notification.deleteMany({
          activityId: activity._id,
          type: "reminder",
        });

        for (const rec of recipients) {
          const message = `Rappel : "${activity.name}" programmé le ${new Date(
            activity.dateBegin,
          ).toLocaleString("fr-FR")}.`;

          const notif = new Notification({
            memberId: rec,
            activityId: activity._id,
            sender: activity.owner,
            type: "reminder",
            message,
            criticality: "high",
            status: "pending",
            expiresAt: activity.dateEnd
              ? new Date(activity.dateEnd)
              : new Date(activity.dateBegin),
            meta: { reminderDate: remDate },
          });
          await notif.save();
        }
      } else {
        // Si le reminder est passé, supprimer les notifications existantes
        await Notification.deleteMany({
          activityId: activity._id,
          type: "reminder",
        });
      }
    } else {
      // Si plus de reminder, supprimer les notifications
      await Notification.deleteMany({
        activityId: activity._id,
        type: "reminder",
      });
      // console.log("🗑️ Reminder supprimé, notifications supprimées");
    }

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

// PUT validate activité / accepter ou refuser une invitation
router.put("/:id/validate", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { validate } = req.body; // true = accepter, false = refuser
    const memberId = req.member._id;

    const activity = await Activity.findById(id).populate("owner");
    if (!activity)
      return res
        .status(404)
        .json({ result: false, message: "Activité non trouvée." });

    // Vérifier s'il existe une invitation en attente pour ce membre
    const invitation = await Notification.findOne({
      activityId: activity._id,
      memberId,
      type: "invitation",
      status: "pending",
    });

    if (!invitation) {
      return res.status(403).json({
        result: false,
        message: "Vous ne participez pas à cette activité",
      });
    }

    // Si accepté, ajouter le membre à activity.members
    if (validate) {
      if (!activity.members.includes(memberId)) {
        activity.members.push(memberId);
        await activity.save();
      }
    }

    // Mettre à jour la notification d'invitation
    invitation.status = "done";
    invitation.meta = { respondedAt: new Date(), accepted: !!validate };
    await invitation.save();

    // Informer le propriétaire si nécessaire
    if (activity.owner) {
      const message = `${req.member.firstName || "Un utilisateur"} a ${
        validate ? "accepté" : "refusé"
      } l'invitation pour "${activity.name}".`;
      const infoNotif = new Notification({
        memberId: activity.owner._id,
        activityId: activity._id,
        sender: memberId,
        type: "info",
        message,
        criticality: "low",
        status: "pending",
      });
      await infoNotif.save();
    }

    res.json({
      result: true,
      message: validate ? "Activité acceptée." : "Activité refusée.",
    });
  } catch (err) {
    console.error("Erreur dans PUT /activities/:id/validate :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// PUT notification read
router.put("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member._id;

    const notif = await Notification.findById(id);
    if (!notif)
      return res
        .status(404)
        .json({ result: false, message: "Notification non trouvée." });
    if (notif.memberId.toString() !== memberId.toString())
      return res
        .status(403)
        .json({ result: false, message: "Accès non autorisé." });

    notif.status = "read";
    await notif.save();

    res.json({ result: true, notification: notif });
  } catch (err) {
    console.error("Erreur dans PUT /activities/notifications/:id/read :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// PUT notification status
router.put("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, criticality } = req.body;
    const memberId = req.member._id;

    const notif = await Notification.findById(id);
    if (!notif)
      return res
        .status(404)
        .json({ result: false, message: "Notification non trouvée." });
    if (notif.memberId.toString() !== memberId.toString())
      return res
        .status(403)
        .json({ result: false, message: "Accès non autorisé." });

    if (status) notif.status = status;
    if (criticality) notif.criticality = criticality;
    await notif.save();

    res.json({ result: true, notification: notif });
  } catch (err) {
    console.error("Erreur dans PUT /activities/notifications/:id :", err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// PUT task isOk
router.put("/:activityId/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { activityId, taskId } = req.params;
    const { isOk } = req.body;
    const memberId = req.member._id;

    const activity = await Activity.findById(activityId);
    if (!activity)
      return res
        .status(404)
        .json({ result: false, message: "Activité non trouvée." });

    const hasAccess =
      activity.owner.toString() === memberId.toString() ||
      activity.members.some((m) => m.toString() === memberId.toString());

    if (!hasAccess)
      return res
        .status(403)
        .json({ result: false, message: "Accès non autorisé." });

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { isOk },
      { new: true },
    );
    if (!updatedTask)
      return res
        .status(404)
        .json({ result: false, message: "Tâche non trouvée." });

    res.json({
      result: true,
      task: updatedTask,
      message: "Tâche mise à jour avec succès.",
    });
  } catch (err) {
    console.error(
      "Erreur dans PUT /activities/:activityId/tasks/:taskId :",
      err,
    );
    res.status(500).json({ result: false, message: err.message });
  }
});

module.exports = router;
