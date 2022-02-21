const express = require("express");
const { body } = require("express-validator/check");
const AuthUser = require("../model/authUser");

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

const regex = new RegExp(/^[A-Za-z0-9 ]+$/);

router.post(
    "/signup",
    [
        body("email")
            .isEmail()
            .withMessage("Not valid email!")
            .custom((value, { req }) => {
                return AuthUser.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject(
                            "User with this email already exsists!"
                        );
                    }
                });
            })
            .normalizeEmail(),
        body("password").trim().isLength({ min: 5 }),
        body("name")
            .trim()
            .not()
            .isEmpty()
            .custom((value, { req }) => {
                const isValid = regex.test(value);
                if (!isValid) {
                    return Promise.reject(
                        "Please avoid special characters in username"
                    );
                } else {
                    return Promise.resolve();
                }
            }),
    ],
    authController.signup
);

router.post("/login", authController.login);
router.get("/get-user", isAuth, authController.getUser);
// router.delete("/delete-user/:id", isAuth, authController.deleteUser);

module.exports = router;
