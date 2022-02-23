const mongoose = require("mongoose");
const Department = require("./departments.model");

// const app = express();

mongoose
  .connect(
    "mongodb+srv://someguy:someguy@cluster0.dyjns.mongodb.net/todo?retryWrites=true&w=majority"
  )
  .then((dbConnection) => {
    console.log("DB CONNECTED ...........");
  })
  .catch((err) => {
    console.log(err);
  });
const departments = [
  { departmentName: "PhD Cell" },
  { departmentName: "Ministry of Electronics and IT" },
  { departmentName: "Academic Committee" },
  { departmentName: "Institute" },
];

async function saveSeeds() {
  const department = await Department.insertMany(departments);
  console.log("department seed created check your db");
}

saveSeeds();
// mongoose.disconnect();
