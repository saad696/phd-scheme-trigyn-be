const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authUserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        token: String,
        rolesCreated: [
            {
                type: Schema.Types.ObjectId,
                required: true,
                ref: "Role",
                // autopopulate: true,
            },
        ],
    },
    { timestamps: true }
);

authUserSchema.plugin(require("mongoose-autopopulate"));
module.exports = mongoose.model("AuthUser", authUserSchema);

