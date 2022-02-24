const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const roleRoutes = require("./routes/role");
const adminUserRoutes = require("./routes/admin_user");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", authRoutes);
app.use("/role", roleRoutes);
app.use("/admin-user", adminUserRoutes);

app.use("/", (req, res, next) => {
  res.status(405).json({ message: "Not allowed" });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  let message = error.message;
  const data = error.data;
  if (data && data[0].msg) {
    message = data[0].msg;
  }
  res.status(status).json({ message, data });
});

mongoose
  .connect(
    "mongodb+srv://nutryAdmin:GEbMVHwrNIFvzblz@cluster0.m2dtm.mongodb.net/nutry?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
