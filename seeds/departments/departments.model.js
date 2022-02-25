const mongose = require("mongoose");

const departmentModel = new mongose.Schema({
    departmentName: String,
    roles: [{ roleName: String, roleId: mongose.Schema.Types.ObjectId }],
});
const departments = mongose.model("departmentsseeds", departmentModel);
module.exports = departments;
