const { validationResult } = require("express-validator/check");
const Role = require("../model/role");
const Department = require("../seeds/departments/departments.model");
const AuthUser = require("../model/authUser");
const ObjectId = require("mongodb").ObjectId;

exports.createRole = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(
            "Validation failed, Please check if all fields are filled"
        );
        error.statusCode = 400;
        error.data = errors.array();
        throw error;
    }

    try {
        const checkForRole = await Department.find({
            _id: req.body.department[0].id,
            roles: { $elemMatch: { roleName: req.body.role } },
        });

        if (checkForRole.length > 0) {
            return res
                .status(409)
                .json({
                    message: `${req.body.role} is present in ${req.body.department[0].name}`,
                });
        } else {
            const role = new Role({ ...req.body, admin: req.userId });

            const inDepartment = await Department.findById(
                { _id: req.body.department[0].id },
                { roles: 1 }
            );
            inDepartment.roles.push({ roleName: role.role, roleId: role._id });
            inDepartment.save();
            role.save();
            return res.status(200).json(role);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "something went wrong" });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find(
            {},
            { _id: 1, departmentName: 1 }
        );
        if (departments.length > 0) {
            return res.status(200).json(departments);
        } else {
            const error = new Error(`run the department seeds`);
            error.statusCode = 409;
            return res.status(409).json(error);
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
    }
};

exports.getRoles = (req, res, next) => {
    const curPage = req.query.page || 1;
    const perPage = 5;
    let totalItems;

    Role.find()
        .countDocuments()
        .then((count) => {
            totalItems = count;
            return Role.find()
                .skip((curPage - 1) * perPage)
                .limit(perPage);
        })
        .then((data) => {
            if (!data) {
                const error = new Error("No records found");
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({
                data,
                totalItems,
                perPage,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.updateRoles = (req, res, next) => {
    const roleId = req.params.roleId;
    const { department, role, status, description, permissions } = req.body;
    let hasCreated;

    AuthUser.findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = new Error("User not found!");
                error.statusCode = 404;
                throw error;
            }

            hasCreated = user.rolesCreated.find(
                (x) => x.toString() === roleId.toString()
            );
            if (!hasCreated) {
                const error = new Error("Not authorized");
                error.statusCode = 401;
                throw error;
            }

            return Role.findByIdAndUpdate(ObjectId(hasCreated), {
                department,
                role,
                status,
                description,
                permissions,
            });
        })
        .then((response) => {
            res.status(200).json({
                message: "Request role has been updated successfully!",
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteRoles = (req, res, next) => {
    const roleId = req.params.roleId;
    let hasCreated;

    AuthUser.findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = new Error("User not found!");
                error.statusCode = 404;
                throw error;
            }

            hasCreated = user.rolesCreated.find(
                (x) => x.toString() === roleId.toString()
            );
            if (!hasCreated) {
                const error = new Error("Not authorized");
                error.statusCode = 401;
                throw error;
            }
            user.rolesCreated.pull(ObjectId(hasCreated));
            return user.save();
        })
        .then((response) => {
            return Role.findByIdAndDelete(ObjectId(hasCreated));
        })
        .then((response) => {
            res.status(200).json({
                message: "Requested role has been deleted successfully",
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
