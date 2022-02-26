const AuthUser = require("../model/authUser");
const { validationResult } = require("express-validator/check");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    const permissions = [
        { _id: new ObjectId(), name: "edit", selected: true },
        { _id: new ObjectId(), name: "approve", selected: true },
        { _id: new ObjectId(), name: "view", selected: true },
    ];

    if (!errors.isEmpty()) {
        const error = new Error("Validation failed");
        error.statusCode = 400;
        error.data = errors.array();
        throw error;
    }
    const { name, password } = req.body;

    const doesUserExsist = await AuthUser.findOne({ name });
    if (doesUserExsist) {
        return res.status(409).json({
            message: "User with this username already exsists!",
        });
    }
    bcrypt
        .hash(password, 12)
        .then((hashedPaswword) => {
            const user = new AuthUser({
                name,
                password: hashedPaswword,
                permissions,
            });
            return user.save();
        })
        .then((response) => {
            res.status(201).json({
                message: "user created",
                userId: response._id,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.login = (req, res, next) => {
    const { name, password } = req.body;
    let loadedUser;
    let expiryDate;
    let token;
    AuthUser.findOne({ name })
        .then((user) => {
            if (!user) {
                const error = new Error("User not found!");
                error.statusCode = 404;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then((isEqual) => {
            if (!isEqual) {
                const error = new Error("Wrong password!");
                error.statusCode = 401;
                throw error;
            }
            token = JWT.sign(
                {
                    userId: loadedUser._id.toString(),
                },
                "DBGBtvhMPaMxuFFLzu",
                { expiresIn: "1h" }
            );
            const remainingMilliseconds = 60 * 60 * 1000;
            expiryDate = new Date(new Date().getTime() + remainingMilliseconds);

            return AuthUser.findById(loadedUser._id);
        })
        .then((user) => {
            if (!user) {
                res.status(404).json({ message: "User not found" });
            }
            user.token = token;
            return user.save();
        })
        .then((response) => {
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),
                name: loadedUser.name,
                expiryDate,
                permissions: loadedUser.permissions,
                message: "user logged in",
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getUser = (req, res, next) => {
    AuthUser.findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = "User not found!";
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({ data: user });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteUser = (req, res, next) => {
    if (req.headers.authorization !== "admin") {
        const error = new Error("Access forbidden!");
        error.statusCode = 403;
        throw error;
    }
    const UserId = req.params.id;
    AuthUser.findById(UserId)
        .then((user) => {
            if (!user) {
                const error = new Error("User not found!");
                error.statusCode = 404;
                throw error;
            }

            return AuthUser.deleteOne({ _id: ObjectId(UserId) });
        })
        .then((response) => {
            res.status(204).json({});
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
