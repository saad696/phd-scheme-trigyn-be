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
            _id: ObjectId(req.body.department[0].id),
            roles: { $elemMatch: { roleName: req.body.role } },
        });
        if (checkForRole.length > 0) {
            return res.status(409).json({
                message: `${req.body.role} is present in ${req.body.department[0].name}`,
            });
        } else {
            const role = new Role({
                department: [
                    {
                        name: req.body.department[0].name,
                        _id: ObjectId(req.body.department[0].id),
                    },
                ],
                role: req.body.role,
                status: req.body.status,
                description: req.body.description,
                permissions: req.body.permissions,
                admin: req.userId,
            });
            const userInAuth = await AuthUser.findById(
                { _id: ObjectId(req.userId) },
                { rolesCreated: 1 }
            );

            if (!userInAuth) {
                return res.status(404).json({
                    message: `User not found with id: ${req.userId}`,
                });
            }
            userInAuth.rolesCreated.push(ObjectId(role._id));

            const inDepartment = await Department.findById(
                { _id: req.body.department[0].id },
                { roles: 1 }
            );
            inDepartment.roles.push({
                roleName: role.role,
                _id: ObjectId(role._id),
            });
            inDepartment.save();
            role.save();
            userInAuth.save();
            return res.status(200).json({
                message: `Role of ${req.body.role} created for department of ${req.body.department[0].name}`,
            });
        }
    } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
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
            return res.status(409).json(`run the department seeds`);
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            return res.status(500).json(err);
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

exports.updateRoles = async (req, res, next) => {
    const roleId = req.params.roleId;
    const { department, role, status, description, permissions } = req.body;
    let hasCreated;
    let untouchedRole;

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

            return Role.findOne({ _id: ObjectId(hasCreated) });
        })
        .then((role) => {
            untouchedRole = role;
            return Department.findById(role.department[0].id);
        })
        .then(async (_department) => {
            _department.roles.pull({ _id: ObjectId(roleId) });
            _department.save();

            const newDepartment = await Department.findById(
                ObjectId(department[0].id)
            );
            newDepartment.roles.push({
                roleName: role,
                _id: ObjectId(roleId),
            });
            newDepartment.save();

            const updatedRole = await Role.findByIdAndUpdate(
                ObjectId(hasCreated),
                {
                    department: [
                        { _id: department[0].id, name: department[0].name },
                    ],
                    role,
                    status,
                    description,
                    permissions,
                }
            );

            if (!updatedRole) {
                return res
                    .status(500)
                    .json({ message: "something went wrong" });
            } else {
                return res.status(200).json({
                    message: "Request role has been updated successfully!",
                });
            }
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteRoles = async (req, res, next) => {
    const roleId = req.params.roleId;

    const role = await Role.findById({ _id: roleId }, { department: 1 });
    const department = await Department.findById(
        { _id: role.department[0].id },
        { roles: 1 }
    );

    if (department != null) {
        department.roles.pull({ _id: roleId });
        department.save();
    }

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
