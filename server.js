const express = require("express");
const connectDB = require("./config/db");

const app = express();

// connect the database
connectDB();

app.get("/", (req, res) => res.send("API Running"));

// look for PORT environment varialble or set to port 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`>>>> dev-connect server listening on port ${PORT} <<<<`)
);
