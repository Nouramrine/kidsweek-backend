const mongoose = require("mongoose");
const { Schema } = mongoose;

const authorizationSchema = new Schema({
  member: { type: Schema.Types.ObjectId, ref: "members", required: true },
  level: { type: String, enum: ["read", "write", "admin"], required: true },
  grantedAt: { type: Date, default: Date.now },
});

const memberSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String },
    birthday: Date,
    password: String,
    address: String,
    phoneNumber: String,
    zipCode: String,
    city: String,
    avatar: { type: String, default: "user" },
    color: String,
    authorizations: [authorizationSchema],
    isChildren: { type: Boolean, default: false },
    zone: { type: Schema.Types.ObjectId, ref: "zones" },
    type: { type: String, enum: ["local", "auth"], default: "local" },
    token: String,
    tutorialState: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {
        dismissedTooltips: [],
      },
    },
  },
  { isTimeStamp: true },
);

const Member = mongoose.model("members", memberSchema);
module.exports = Member;
