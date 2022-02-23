const express = require("express");
const { body } = require("express-validator/check");

const roleController = require("../controllers/role");
const isAuth = require("../middleware/is-auth");

const router = express.Router();
const regex = new RegExp(/^[A-Za-z0-9 ]+$/);

router.post(
  "/create",
  [
    body("department.id")
      .trim()
      .notEmpty()
      .withMessage("Department id field is required"),
    body("department.name")
      .trim()
      .notEmpty()
      .withMessage("Department name field is required"),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role field is required")
      .custom((value, { req }) => {
        const isValid = regex.test(value);
        if (!isValid) {
          return Promise.reject(
            "Cannot accept special characters in role name"
          );
        } else {
          return Promise.resolve();
        }
      }),
    body("status").trim().notEmpty().withMessage("Status field is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description field is required"),
    body("permissions.*.*")
      .notEmpty()
      .withMessage("Permissions field is required"),
  ],
  isAuth,
  roleController.createRole
);

router.get("/get-roles", isAuth, roleController.getRoles);
router.get("/get-departments", isAuth, roleController.getDepartments);

router.delete("/delete/:roleId", isAuth, roleController.deleteRoles);
router.put("/edit/:roleId", isAuth, roleController.updateRoles);

module.exports = router;
