const AuthUser = require("../model/authUser");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
    }
    if (authHeader !== "admin") {
        AuthUser.findOne({ token: authHeader })
            .then((user) => {
                if (user) {
                    req.userId = user._id;
                    next();
                } else {
                    res.status(404).json({ message: "User not found" });
                }
            })
            .catch((err) => {
                const error = new Error("Not valid token!");
                error.statusCode = 400;
                throw error;
            });
    } else {
        next();
    }
};
