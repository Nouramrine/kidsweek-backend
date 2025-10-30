const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  birthday: Date,
  password: String,
  address: String,
  phoneNumber: String,
  zipCode: String,
  city: String,
  authorization: [String],
  avatar: String,
  isChildren: { type: Boolean, default: false },
  zone: { type: Schema.Types.ObjectId, ref: "zones" },
  creator: { type: Schema.Types.ObjectId, ref: "members" },
  token: String,
}, { isTimeStamp: true });

const Member = mongoose.model("members", memberSchema);
module.exports = Member;
