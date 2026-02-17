const cron = require("node-cron");
const Member = require("../src/models/members");
const Notification = require("../src/models/notifications");
const { notifyActivityReminder } = require("./pushNotificationService");

/**
 * Démarre le cron job de rappels d'activités
 * Se base sur les Notifications type "reminder" existantes en BDD
 * Utilise meta.pushSent pour éviter les doublons
 * S'exécute toutes les minutes
 */
const startReminderCron = () => {
  console.log("⏰ Cron job de rappels démarré");

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Chercher les notifications reminder dont la date est atteinte
      // et dont le push n'a pas encore été envoyé
      const remindersToSend = await Notification.find({
        type: "reminder",
        status: "pending",
        "meta.reminderDate": { $lte: now },
        "meta.pushSent": { $ne: true },
      }).populate("activityId");

      if (remindersToSend.length === 0) return;

      // Regrouper par activité pour éviter plusieurs appels push
      const byActivity = remindersToSend.reduce((acc, notif) => {
        const actId = notif.activityId?._id?.toString();
        if (!actId) return acc;
        if (!acc[actId]) {
          acc[actId] = {
            activity: notif.activityId,
            notifIds: [],
            memberIds: [],
          };
        }
        acc[actId].notifIds.push(notif._id);
        acc[actId].memberIds.push(notif.memberId);
        return acc;
      }, {});

      for (const actId of Object.keys(byActivity)) {
        const { activity, notifIds, memberIds } = byActivity[actId];

        // Récupérer les membres avec pushToken
        const members = await Member.find({
          _id: { $in: memberIds },
          pushToken: { $exists: true, $ne: null },
        });

        if (members.length > 0) {
          await notifyActivityReminder(activity, members);
          console.log(`✅ Rappel push envoyé pour: "${activity.name}"`);
        }

        // Marquer comme envoyé pour éviter les doublons
        await Notification.updateMany(
          { _id: { $in: notifIds } },
          { $set: { "meta.pushSent": true } },
        );
      }
    } catch (err) {
      console.error("❌ Erreur cron rappels:", err);
    }
  });
};

module.exports = { startReminderCron };
