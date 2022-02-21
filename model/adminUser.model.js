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
    },
    { timestamps: true }
);
const adminUser = mongose.model("adminusers", adminUserModel);
module.exports = adminUser;
