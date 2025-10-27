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
<<<<<<< HEAD
=======

>>>>>>> 60db0a86de7546720baee68e1658e024af7261d4
  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Tasks",
  },
<<<<<<< HEAD
=======

>>>>>>> 60db0a86de7546720baee68e1658e024af7261d4
  recurrence: {
    type: Schema.Types.ObjectId,
    ref: "Recurrences",
  },
<<<<<<< HEAD
=======

>>>>>>> 60db0a86de7546720baee68e1658e024af7261d4
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Members",
    },
  ],
<<<<<<< HEAD
=======

>>>>>>> 60db0a86de7546720baee68e1658e024af7261d4
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Members",
  },
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
