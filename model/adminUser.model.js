const mongose = require("mongoose");

const adminUserModel = new mongose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        role: mongose.Schema.Types.ObjectId,
        roleName: { type: String, lowercase: true },
        mobileNumber: {
            type: Number,
            required: true,
        },
        setPassword: {
            type: String,
            required: true,
        },
        setUsername: {
            type: String,
            required: true,
        },
        createdBy: mongose.Schema.Types.ObjectId,
    },
    { timestamps: true }
);
const adminUser = mongose.model("adminusers", adminUserModel);
module.exports = adminUser;
