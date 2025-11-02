const mongoose = require("mongoose");
const { Schema } = mongoose;

const recurrenceSchema = new Schema({
  dateDebut: Date,
  dateFin: Date,
  days: {
    lun: Boolean,
    mar: Boolean,
    mer: Boolean,
    jeu: Boolean,
    ven: Boolean,
    sam: Boolean,
    dim: Boolean,
  },
});

const Recurrence = mongoose.model("recurrences", recurrenceSchema);
module.exports = Recurrence;
