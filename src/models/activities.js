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
  reminder: Date,
  note: String,
  validation: {
    type: Boolean,
    default: false,
  },
  taskId: [
    {
      type: Schema.Types.ObjectId,
      ref: "tasks",
    },
  ],
  recurrence: {
    type: Schema.Types.ObjectId,
    ref: "recurrences",
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "member",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "member",
  },
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
