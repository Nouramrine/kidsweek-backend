const mongoose = require("mongoose");
const { Schema } = mongoose;

const activitySchema = new Schema({
  Name: {
    type: String,
    required: true,
  },
  Place: String,
  DateBegin: Date,
  DateEnd: Date,
  Reminder: String,
  Note: String,
  Description: String,
  Validation: {
    type: Boolean,
    default: false,
  },

  TaskId: {
    type: Schema.Types.ObjectId,
    ref: "Tasks",
  },

  Recurrence: {
    type: Schema.Types.ObjectId,
    ref: "Recurrences",
  },

  Members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Members",
    },
  ],

  Owner: {
    type: Schema.Types.ObjectId,
    ref: "Members",
  },
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
