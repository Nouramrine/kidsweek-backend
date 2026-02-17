const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotifications = async (pushTokens, title, body, data = {}) => {
  const validTokens = pushTokens.filter(
    (token) => token && Expo.isExpoPushToken(token),
  );

  if (validTokens.length === 0) {
    console.log("ℹ️ Aucun token push valide");
    return;
  }

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
    badge: 1,
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket) => {
        if (ticket.status === "error") {
          console.error("❌ Erreur ticket push:", ticket.message);
        }
      });
      console.log(`✅ ${tickets.length} notification(s) push envoyée(s)`);
    } catch (err) {
      console.error("❌ Erreur envoi push:", err);
    }
  }
};

const notifyActivityInvitation = async (activity, members, creator) => {
  const tokens = members
    .filter((m) => m.pushToken && m._id.toString() !== creator._id.toString())
    .map((m) => m.pushToken);

  if (tokens.length === 0) return;

  await sendPushNotifications(
    tokens,
    "Nouvelle activité 📅",
    `${creator.firstName} vous invite à "${activity.name}"`,
    {
      type: "invitation",
      activityId: activity._id.toString(),
    },
  );
};

const notifyActivityReminder = async (activity, members) => {
  const tokens = members.filter((m) => m.pushToken).map((m) => m.pushToken);

  if (tokens.length === 0) return;

  const formattedDate = new Date(activity.dateBegin).toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  await sendPushNotifications(
    tokens,
    "Rappel d'activité ⏰",
    `"${activity.name}" commence le ${formattedDate}`,
    {
      type: "reminder",
      activityId: activity._id.toString(),
    },
  );
};

module.exports = {
  sendPushNotifications,
  notifyActivityInvitation,
  notifyActivityReminder,
};
