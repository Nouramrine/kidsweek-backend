const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema({
  Firstname: {
    type: String,
    required: true,
  },
  Token: String,
  Lastname: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Birthday: Date,
  Password: {
    type: String,
    required: true,
  },
  Address: String,
  Number: String,
  ZipCode: String,
  City: String,
  Authorization: Object,
  Avatars: [String],
  IsChildren: {
    type: Boolean,
    default: false,
  },

  Zone: {
    type: Schema.Types.ObjectId,
    ref: "Zones",
  },
});

const Member = mongoose.model("members", memberSchema);
module.exports = Member;
