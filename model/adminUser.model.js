const mongose = require("mongoose");

const adminUserModel = new mongose.Schema(
    {
        name: {
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
        password: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        createdBy: mongose.Schema.Types.ObjectId,
        modifiedBy: mongose.Schema.Types.ObjectId,
    },
    { timestamps: true }
);
const adminUser = mongose.model("adminusers", adminUserModel);
module.exports = adminUser;
