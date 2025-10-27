const mongoose = require("mongoose");
const { Schema } = mongoose;

const activitySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  place: String,
  dateBegin: Date,
  dateEnd: Date,
  reminder: String,
  note: String,
  description: String,
  validation: {
    type: Boolean,
    default: false,
  },

  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Tasks",
  },

  recurrence: {
    type: Schema.Types.ObjectId,
    ref: "Recurrences",
  },

  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Members",
    },
  ],

  owner: {
    type: Schema.Types.ObjectId,
    ref: "Members",
  },
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
