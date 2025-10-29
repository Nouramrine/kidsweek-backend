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
  validation: {
    type: Boolean,
    default: false,
  },
  taskId: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tasks",
    },
  ],
  recurrence: {
    type: Schema.Types.ObjectId,
    ref: "Recurrences",
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Member",
  },
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
