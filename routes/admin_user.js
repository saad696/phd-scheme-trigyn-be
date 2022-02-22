const express = require("express");
// const { body } = require("express-validator/check");

const { check } = require("express-validator");

const adminUserController = require("../controllers/adminUser.controller");
const isAuth = require("../middleware/is-auth");

const router = express.Router();
// const regex = new RegExp(/^[A-Za-z0-9 ]+$/);
// username: String,
// status: String,
// role: mongose.Schema.Types.ObjectId,
// createdate: { type: Date, default: Date.now },
// mobilenumber: String,
// setpassword: String,
// setusername: String,

router.post(
  "/create-admin-user",
  [
    check("username", "User Name should not be empty").isLength({ min: 1 }),
    check("status", "status should not be empty").isLength({
      min: 1,
    }),
    check("mobileNumber", "Mobile number should contains 10 digits").isLength({
      min: 10,
      max: 10,
    }),
    check("role", "role should not be empty").isLength({
      min: 1,
    }),
    check("setPassword", "Password should not be empty").isLength({
      min: 1,
    }),
    check("setUsername", "setusername should not be empty").isLength({
      min: 1,
    }),
  ],
  isAuth,
  adminUserController.createUser
);

router.get("/get-roles", isAuth, adminUserController.getRoles);
router.get("/filter-by-roles/:role", isAuth, adminUserController.filterRoles);
router.get("/get-all-admin-users",isAuth,adminUserController.getAllAdminUsers);

module.exports = router;
