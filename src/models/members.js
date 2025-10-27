const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: Date,
  password: { type: String, required: true },
  address: String,
  phoneNumber: String,
  zipCode: String,
  city: String,
  authorization: [String],
  avatar: String,
  isChildren: { type: Boolean, default: false },
  zone: { type: Schema.Types.ObjectId, ref: "Zones" },
  token: String,
});

const Member = mongoose.model("members", memberSchema);
module.exports = Member;
