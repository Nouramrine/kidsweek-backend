const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
  memberId: {
    type: Schema.Types.ObjectId,
    ref: "members",
    required: true,
  },
  activityId: {
    type: Schema.Types.ObjectId,
    ref: "activities",
    default: null,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "members",
    default: null,
  },
  type: {
    type: String,
    enum: ["info", "reminder", "invitation"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  criticality: {
    type: String,
    enum: ["low", "medium", "high"],
  },
  status: {
    type: String,
    enum: ["pending", "read", "done"],
    default: "pending",
  },
  meta: {
    type: Schema.Types.Mixed,
    default: null, //permet de stocker tout type d'infos spécifique à la notification
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//index utile pour requête par memebre / status
notificationSchema.index({ memberId: 1, status: 1, type: 1 });

const Notification = mongoose.model("notifications", notificationSchema);
module.exports = Notification;
