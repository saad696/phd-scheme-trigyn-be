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
    check("password", "Password should not be empty").isLength({
      min: 1,
    }),
  ],
  isAuth,
  adminUserController.createUser
);
router.post(
  "/update-adminuser",
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
    check("roleName", "Role name should not be empty").isLength({
      min: 1,
    }),
  ],
  isAuth,
  adminUserController.updateUser
);

router.delete("/delete/:authUserId", isAuth, adminUserController.deleteUser);

router.get("/get-roles", isAuth, adminUserController.getRoles);
router.get("/get-users/:role", isAuth, adminUserController.getAllAdminUsers);
router.get(
    "/get-user-department",
    isAuth,
    adminUserController.getUserDepartment
);

module.exports = router;
