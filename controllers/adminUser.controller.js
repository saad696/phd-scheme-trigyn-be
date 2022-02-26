const Roles = require("../model/role");
const adminUser = require("../model/adminUser.model");
const authUser = require("../model/authUser");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { google } = require("googleapis");
const role = require("../model/role");

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

  const { mobileNumber } = req.body;

  // checking for user with same phone number
  const findForSameUser = await findUser(mobileNumber);
  if (findForSameUser) {
    const error = new Error("User already present with this phone number");
    error.statusCode = 409;
    return res.status(409).json(error);
  }

     try {
        const { username: uname, password: pass } = req.body;
        req.body.password = await bcrypt.hash(req.body.password, saltRounds);

        const roleName = await Roles.findOne(
            { _id: req.body.role },
            { role: 1, permissions: 1 }
        );
        req.body.roleName = roleName.role;
        req.body.createdBy = req.userId;
        req.body.modifiedBy = req.userId;

        const createUser = new adminUser(req.body);
        createUser.save();

        const toAuth = new authUser({
            _id: createUser._id,
            password: createUser.password,
            name: createUser.username,
            role: roleName.role,
            permissions: roleName.permissions,
        });
        toAuth.save();
        googleSheetsapi(uname, pass);
        return res.status(200).json({
            message: `Account for ${createUser.username} has been created.`,
        });
    } catch (err) {
        return res.status(400).json({ message: "something went wrong1" });
    }
};


const getRoles = async (req, res) => {
    const _authUser = await authUser.findById(req.userId);
    if (_authUser.role === "superadmin") {
        const data = await Roles.find(
            { admin: req.userId, status: "active" },
            { _id: 1, role: 1, department: 1 }
        );
        return res.status(200).json(data);
    } else {
        const _adminUser = await adminUser.findById(req.userId);
        const _adminUserRole = await role.findById(_adminUser.role);

        const _filteredRoles = await role.find(
            {
                "department._id": _adminUserRole.department[0]._id,
            },
            { _id: 1, role: 1, department: 1 }
        );

        res.status(200).json(_filteredRoles);
  } 
//   else {
//     const error = new Error("No Data");
//     error.statusCode = 400;
//     return res.status(400).json(error);
//   }
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

    const roles = [];
    // not an efficent way buddy
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
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    return res.status(400).json(error);
  }
  const { _id, username, status, role, roleName, mobileNumber, password } =
    req.body;
  try {
    const hashedPassoword = await bcrypt.hash(password, saltRounds);
    const updateUser = await adminUser.findByIdAndUpdate(
      { _id: _id },
      {
        $set: {
          username: username,
          status: status,
          role: role,
          roleName,
          mobileNumber: mobileNumber,
          password: hashedPassoword,
        },
      }
    );

    const updateAuthUser = await authUser.findByIdAndUpdate(
      { _id: _id },
      { $set: { name: username, role: roleName, password: hashedPassoword } }
    );

    if (updateUser !== null && updateAuthUser !== null) {
      return res.status(200).json({ messge: "update successfully" });
    }
    return res.status(404).json({ message: "User Not Found" });
  } catch (err) {
    return res.status(500).json({ message: "oops !!!!!!!", error: err });
  }
};

const deleteUser = async (req, res) => {
  const authUserId = req.params.authUserId;

  try {
    const user = await adminUser.findOne({ _id: authUserId });

    if (user != null) {
      await adminUser.findByIdAndDelete({
        _id: authUserId,
      });
      await authUser.findByIdAndDelete({
        _id: authUserId,
      });
      return res.status(200).json({ message: "Deleted" });
    }
    return res.status(404).json({ message: "No such user present" });
  } catch (err) {
    return res.status(500).json({ message: "oops !!!!!!!", error: err });
  }
};


const getUserDepartment = (req, res, next) => {
    adminUser
        .findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = new Error("No user found");
                error.statusCode = 404;
                throw error;
            }

            return role.findById(user.role);
        })
        .then((role) => {
            if (!role) {
                const error = new Error("No role found");
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({ data: role.department[0] });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};


  

module.exports = {   createUser,
  getRoles,
  getAllAdminUsers,
  updateUser,
  deleteUser, getUserDepartment };

