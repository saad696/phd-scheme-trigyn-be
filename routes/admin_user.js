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
        check(
            "username",
            "User Name length should be 3 to 15 characters"
        ).isLength({ min: 0, max: 50 }),
        check(
            "status",
            "status length should be between 0 to 50 characters"
        ).isLength({
            min: 0,
            max: 10,
        }),
        check(
            "mobileNumber",
            "Mobile number should contains 10 digits"
        ).isLength({
            min: 10,
            max: 10,
        }),
        check("role", "role length should be 8 to 10 characters").isLength({
            min: 3,
            max: 30,
        }),
        check(
            "setPassword",
            "Password length should be 5 to 10 characters"
        ).isLength({
            min: 5,
            max: 30,
        }),
        check(
            "setUsername",
            "setusername length should be 3 to 10 characters"
        ).isLength({
            min: 3,
            max: 30,
        }),
    ],
    isAuth,
    adminUserController.createUser
);

router.get("/get-roles", isAuth, adminUserController.getRoles);

module.exports = router;
