const Roles = require("../model/role");
const adminUser = require("../model/adminUser.model");
const authUser = require("../model/authUser");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { google } = require("googleapis");

const googleSheetsapi = async (name, password) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "../google-credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const spreadsheetId = "1r9QhbbwnWBCWPKtYz_5fJp4RPli7OROgUulaoDf4k5Q";

    const googleSheets = google.sheets({ version: "v4", auth: client });

    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1!A:B",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[name, password]],
        },
    });
};

// helper code

const findUser = async (mobileNumber) => {
  const user = await adminUser.findOne({ mobileNumber: mobileNumber });
  if (user) {
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

  // delete it if you want

  // checking for same role exsitence
  // const forSameRole = await checkForSameRole(req.body.role);
  // if (forSameRole) {
  //   return res.status(409).json({ message: "This Role Already Exists!" });
  // }

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
    req.body.modifiedBy = req.userId;

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
  console.log(role);
  try {
    let users;

    if (role.toLowerCase() === "all") {
      users = await adminUser.find();
    } else {
      users = await adminUser.find(
        { roleName: role },
        { _id: 1, username: 1, status: 1, mobileNumber: 1, roleName: 1 }
      );
    }

    if (users.length > 0) {
      return res.status(200).json(users);
    } else {
      return res
        .status(404)
        .json({ message: "No user has been assigned this role yet!" });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

const getAllAdminUsers = async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = 5;
  let totalItems;
  try {
    const totalEntries = await adminUser.countDocuments();
    totalItems = totalEntries;

    const adminUsers = await adminUser
      .find(
        { createdBy: req.userId },
        {
          _id: 1,
          username: 1,
          status: 1,
          mobileNumber: 1,
          roleName: 1,
          role: 1,
        }
      )
      .skip((curPage - 1) * perPage)
      .limit(perPage);

    if (adminUsers.length > 0) {
      const roles = [];
      for (let i = 0; i < adminUsers.length; i++) {
        const roleFromId = await Roles.findById({
          _id: adminUsers[i].role,
        });
        roles.push({
          _id: adminUsers[i]._id,
          username: adminUsers[i].username,
          status: adminUsers[i].status,
          role: adminUsers[i].role,
          roleName: adminUsers[i].roleName,
          mobileNumber: adminUsers[i].mobileNumber,
          departmentName: roleFromId.department[0].name,
        });
      }

      return res.status(200).json({ users: roles, totalItems, perPage });
    } else {
      const error = new Error(`No User Has Been Created ,please Create One`);
      error.statusCode = 409;
      return res.status(409).json(error);
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = { createUser, getRoles, getAllAdminUsers };
