const mongoose = require("mongoose");
const { Schema } = mongoose;

const recurrenceSchema = new Schema({
  DateDebut: Date,
  DateFin: Date,
  Day: String,
});

const Recurrence = mongoose.model("recurrences", recurrenceSchema);
module.exports = Recurrence;
