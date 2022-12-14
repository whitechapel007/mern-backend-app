const { validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError(
      "fetching users failed, pease try again later",
      500
    );
    next(err);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

//login

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("logging in failed, pease try again later", 500);
    return next(err);
  }

  if (!existingUser) {
    const error = new HttpError(
      "invalid credentials, could not log you in",
      401
    );
    return next(error);
  }
  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError(
      "could not log you in, please check your credentials and try again ",
      500
    );
    return next(err);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "invalid credentials, could not log you in",
      401
    );
    return next(error);
  }
  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.jwt_key,
      {
        expiresIn: "1h",
      }
    );
  } catch (error) {
    const err = new HttpError("loggin in failed, please try again", 500);
    return next(err);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

//register
const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Signup failed please try again later", 500);
    return next(err);
  }
  if (existingUser) {
    const err = new HttpError("user exists already, please login", 422);
    return next(err);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new HttpError("could not create user, please try again", 500);
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  try {
    await createdUser.save();
  } catch (error) {
    const err = new HttpError("signing up failed, please try again", 500);
    return next(err);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.jwt_key,
      {
        expiresIn: "1h",
      }
    );
  } catch (error) {
    const err = new HttpError("signing up failed, please try again", 500);
    return next(err);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

module.exports = { getAllUsers, register, login };
