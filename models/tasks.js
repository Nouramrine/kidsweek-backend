const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema({
  Name: {
    type: String,
    required: true,
  },
  IsOk: {
    type: Boolean,
    default: false,
  },

  Activities: [
    {
      type: Schema.Types.ObjectId,
      ref: "Activities",
    },
  ],
});

const Task = mongoose.model("tasks", taskSchema);
module.exports = Task;
