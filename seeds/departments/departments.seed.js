const mongoose = require("mongoose");
const Department = require("./departments.model");

const departments = [
    { departmentName: "PhD Cell" },
    { departmentName: "Ministry of Electronics and IT" },
    { departmentName: "Academic Committee" },
    { departmentName: "Institute" },
];

mongoose
    .connect(
        "mongodb+srv://nutryAdmin:GEbMVHwrNIFvzblz@cluster0.m2dtm.mongodb.net/nutry?retryWrites=true&w=majority"
    )
    .then(() => {
        console.log("DB CONNECTED ...........");
        async function saveSeeds() {
            const department = await Department.insertMany(departments);
            mongoose.disconnect();
        }

        saveSeeds();
    })
    .catch((err) => {
        console.log(err);
    });
