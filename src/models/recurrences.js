const mongoose = require("mongoose");
const { Schema } = mongoose;

const recurrenceSchema = new Schema({
  dateDebut: Date,
  dateFin: Date,
  days: [String],
});

const Recurrence = mongoose.model("recurrences", recurrenceSchema);
module.exports = Recurrence;
