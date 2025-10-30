const mongoose = require("mongoose");
const { Schema } = mongoose;

const zoneSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: "members" },
  members: [{ type: Schema.Types.ObjectId, ref: "members" }],
});

const Zone = mongoose.model("zones", zoneSchema);
module.exports = Zone;
