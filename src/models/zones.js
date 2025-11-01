const mongoose = require("mongoose");
const { Schema } = mongoose;

const authorizationSchema = new Schema({
  member: { type: Schema.Types.ObjectId, ref: 'members', required: true },
  level: { type: String, enum: ['read', 'write', 'admin'], required: true },
  grantedAt: { type: Date, default: Date.now }
});

const zoneSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String },
  authorizations: [authorizationSchema]
});

const Zone = mongoose.model("zones", zoneSchema);
module.exports = Zone;
