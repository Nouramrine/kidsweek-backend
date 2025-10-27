const mongoose = require("mongoose");
const { Schema } = mongoose;

const zoneSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Members",
    },
  ],
});

const Zone = mongoose.model("zones", zoneSchema);
module.exports = Zone;
