const mongose = require("mongoose");

const adminUserModel = new mongose.Schema({
  username: String,
  status: String,
  role: mongose.Schema.Types.ObjectId,
  createdate: { type: Date, default: Date.now },
  mobilenumber: String,
  setpassword: String,
  setusername: String,
});
const adminUser = mongose.model("adminusers", adminUserModel);
module.exports = adminUser;
