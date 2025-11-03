const mongoose = require("mongoose");
const { Schema } = mongoose;
const uid2 = require('uid2');

const inviteSchema = new Schema({
  inviter: { type: Schema.Types.ObjectId, ref: 'members', required: true },
  invited: { type: Schema.Types.ObjectId, ref: 'members', required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired' ], default: 'pending'},
  token: { type: String, default: uid2(32) },
  invitedAt: { type: Date, default: Date.now }
});

const Invite = mongoose.model("invites", inviteSchema);
module.exports = Invite;
