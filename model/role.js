const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  departmentName: String,
});

const roleSchema = new Schema(
  {
    department:[{
      name: { type: String },
    }],
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        name: String,
        selected: Boolean,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      // autopopulate: true,
    },
  },
  { timestamps: true }
);

roleSchema.plugin(require("mongoose-autopopulate"));
module.exports = mongoose.model("Role", roleSchema);
