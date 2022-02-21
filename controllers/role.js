const { validationResult } = require("express-validator/check");
const Role = require("../model/role");
const AuthUser = require("../model/authUser");
const ObjectId = require("mongodb").ObjectId;

const createRoleHelper = (req, res, next) => {
    const { department, role, status, description, permissions } = req.body;
    let roleCreationResponse;

    const createdRole = new Role({
        department: department.toLowerCase(),
        role: role.toLowerCase(),
        status: status.toLowerCase(),
        description: description.toLowerCase(),
        permissions: permissions,
        admin: req.userId,
    });

    createdRole
        .save()
        .then((response) => {
            roleCreationResponse = response;
            return AuthUser.findById(req.userId);
        })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    `User not found with id: ${req.userId}`
                );
                error.statusCode = 404;
                throw error;
            }

            user.rolesCreated.push(
                ObjectId(roleCreationResponse._id.toString())
            );

            return user.save();
        })
        .then((response) => {
            res.status(201).json({
                message: `Role: ${role} has been created for department of ${department}`,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createRole = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(
            "Validation failed, Please check if all fields are filled"
        );
        error.statusCode = 400;
        error.data = errors.array();
        throw error;
    }

    const { role } = req.body;
    if (role.toLowerCase() === "admin") {
        Role.find({ role: "admin" }).then((data) => {
            console.log(data);
            if (data.length === 0) {
                createRoleHelper(req, res,next);
            } else {
                res.status(406).json({
                    message: "User with a role of Admin already exists!",
                });
            }
        });
    } else {
        createRoleHelper(req, res, next);
    }
};

exports.getRoles = (req, res, next) => {
    const curPage = req.query.page || 1;
    const perPage = 3;
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
