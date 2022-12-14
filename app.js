const express = require("express");
const app = express();
const placeRouter = require("./routes/places-routes");
const userRouter = require("./routes/users-routes");
const fs = require("fs");
const path = require("path");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");
require("dotenv").config();
app.use(express.json());
app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-with, Content-Type,Accept,Authorization"
  );

  res.setHeader("Access-Control-Allows-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placeRouter);
app.use("/api/users", userRouter);

app.use((req, res, next) => {
  const error = new HttpError(" could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unkown error occured" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(console.log("connected to db"))
  .then(
    app.listen(
      process.env.PORT || 5000,
      console.log("server is listening on port 5000")
    )
  )
  .catch((err) => console.log(err));
