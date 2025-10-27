const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  isOk: {
    type: Boolean,
    default: false,
  },

  activities: [
    {
      type: Schema.Types.ObjectId,
      ref: "Activities",
    },
  ],
});

const Task = mongoose.model("tasks", taskSchema);
module.exports = Task;
