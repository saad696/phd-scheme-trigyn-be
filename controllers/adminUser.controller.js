const Roles = require("../model/role");
const adminUser = require("../model/adminUser.model");
const authUser = require("../model/authUser");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const findUser = async (mobilenumber) => {
  const user = await adminUser.findOne({ mobilenumber: mobilenumber });
  console.log("this is user :", user);
  if (user) {
    return true;
  } else {
    return false;
  }
};

const createUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    return res.status(400).json(error);
  }

  const { mobilenumber } = req.body;

  const findForSameUser = await findUser(mobilenumber);

  if (findForSameUser) {
    const error = new Error("User already present with this phone number");
    error.statusCode = 409;
    return res.status(409).json(error);
  }

  try {
    req.body.setpassword = await bcrypt.hash(req.body.setpassword, saltRounds);
    const createUser = new adminUser(req.body);
    createUser.save();

    const toAuth = new authUser({
      _id: createUser._id,
      password: createUser.setpassword,
      name: createUser.username,
      email: "somerandom@gail.com", // this has to fixed but for now keep it like this
    });
    toAuth.save();
    return res.status(200).json(createUser);
  } catch (err) {
    return res.status(400).json(err);
  }
};

const getRoles = async (req, res) => {
  const { id } = req.params;
  const data = await Roles.find(
    { admin: id, status: "active" },
    { _id: 1, role: 1 }
  );
  if (data.length > 0) {
    return res.status(200).json(data);
  } else {
    const error = new Error("No Data");
    error.statusCode = 400;
    return res.status(400).json(error);
  }
};

module.exports = { createUser, getRoles };
