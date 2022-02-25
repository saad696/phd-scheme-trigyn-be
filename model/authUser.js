const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authUserSchema = new Schema(
    {
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        token: String,
        role: { type: String, default: "superadmin" },
        rolesCreated: [
            {
                type: Schema.Types.ObjectId,
                ref: "Role",
                // autopopulate: true,
            },
        ],
        permissions: [
            {
                _id: Schema.Types.ObjectId,
                name: String,
                selected: Boolean,
            },
        ],
    },
    { timestamps: true }
);

authUserSchema.plugin(require("mongoose-autopopulate"));
module.exports = mongoose.model("AuthUser", authUserSchema);
