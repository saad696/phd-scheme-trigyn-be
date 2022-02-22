const Roles = require("../model/role");
const adminUser = require("../model/adminUser.model");
const authUser = require("../model/authUser");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// helper code

const findUser = async (mobileNumber) => {
  const user = await adminUser.findOne({ mobileNumber: mobileNumber });
  if (user) {
    return true;
  } else {
    return false;
  }
};

const checkForSameRole = async (role) => {
  const find = await adminUser.findOne({role:role ,roleName: "admin", status:"active" });
  if (find) {
    return true;
  } else {
    return false;
  }
};

// real controllers
const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    return res.status(400).json(error);
  }

  // checking for same role exsitence
  const forSameRole = await checkForSameRole(req.body.role);
  if (forSameRole) {
    const error = new Error("This Role Already Present");
    error.statusCode = 409;
    return res.status(409).json(error);
  }

  const { mobileNumber } = req.body;

  // checking for user with same phone number
  const findForSameUser = await findUser(mobileNumber);
  if (findForSameUser) {
    const error = new Error("User already present with this phone number");
    error.statusCode = 409;
    return res.status(409).json(error);
  }

  try {
    req.body.setPassword = await bcrypt.hash(req.body.setPassword, saltRounds);

    const roleName = await Roles.findOne({ _id: req.body.role }, { role: 1 });
    req.body.roleName = roleName.role;
    req.body.createdBy = req.userId;

    const createUser = new adminUser(req.body);
    createUser.save();

    const toAuth = new authUser({
      _id: createUser._id,
      password: createUser.setPassword,
      name: createUser.username,
      role: roleName.role,
    });
    toAuth.save();
    return res.status(200).json({
      message: `Account for ${createUser.username} has been created.`,
    });
  } catch (err) {
    return res.status(400).json(err);
  }
};

const getRoles = async (req, res) => {

  const data = await Roles.find(
    { admin: req.userId, status: "active" },
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

const filterRoles = async (req, res) => {
  const { role } = req.params;
  try {
    const roles = await adminUser.find(
      { roleName: role },
      { _id: 1, username: 1, status: 1, mobileNumber: 1, roleName: 1 }
    );

    if (roles.length > 0) {
      return res.status(200).json(roles);
    } else {
      const error = new Error(`No Such Role ${role} Create One`);
      error.statusCode = 409;
      return res.status(409).json(error);
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

const getAllAdminUsers = async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = 5;
  try {
    const adminUsers = await adminUser
      .find(
        { createdBy: req.userId },
        { _id: 1, username: 1, status: 1, mobileNumber: 1, roleName: 1 }
      )
      .skip((curPage - 1) * perPage)
      .limit(perPage);

    if (adminUsers.length > 0) {
      return res.status(200).json(adminUsers);
    } else {
      const error = new Error(`No User Has Been Created ,please Create One`);
      error.statusCode = 409;
      return res.status(409).json(error);
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = { createUser, getRoles, filterRoles, getAllAdminUsers };
