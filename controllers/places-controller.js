const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const getCoordsforAddress = require("../util/location");
const fs = require("fs");
const Place = require("../models/places");
const User = require("../models/user");
const mongoose = require("mongoose");

const getPlaceById = async (req, res, next) => {
  const { pid } = req.params;
  let place;
  try {
    place = await Place.findById(pid);
  } catch (error) {
    const err = new HttpError("something went wrong could not find place", 500);
    return next(err);
  }
  if (!place) {
    // return res.status(404).json({ message: "could not find place for id" });
    const error = new HttpError(
      "Could not find a place for the provided id",
      404
    );
    return next(error);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const { uid } = req.params;

  // let places;

  let userWithPlaces;
  try {
    // places = await Place.find({ creator: uid });
    userWithPlaces = await User.findById(uid).populate("places");
  } catch (error) {
    const err = new HttpError("something went wrong could not find place", 500);
    return next(err);
  }

  if (!userWithPlaces || userWithPlaces.length == 0) {
    return next(
      new HttpError("Could not find place for the provided user id", 404)
    );
  }

  res.status(200).json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("invalid input passed, please check your data", 422)
    );
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsforAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    creator: req.userData.userId,
    title,
    address,
    description,
    location: coordinates,
    image: req.file.path,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
    // console.log(user, "node");
  } catch (error) {
    const err = new HttpError("creating a place failed, please try again", 500);
    return next(err);
  }

  if (!user) {
    const error = new HttpError("could not find users for provided id", 404);
    return next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });

    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
    // await createdPlace.save();User
  } catch (error) {
    const err = new HttpError("creating places failed, please try again", 500);
    return next(err);
  }
  res.status(201).json({ place: createdPlace });
};

///update place

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed,please check your data", 422)
    );
  }
  const { title, description } = req.body;
  const { pid } = req.params;

  // const updatedPlace = { ...dummy_places.find((p) => p.id == pid) };
  // const placeIndex = dummy_places.findIndex((p) => p.id == pid);
  let place;
  try {
    place = await Place.findById(pid);
  } catch (error) {
    const err = new HttpError("could not update place, please try again", 500);
    return next(err);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const err = new HttpError("you are not allowed to edit this place", 401);
    return next(err);
  }
  place.title = title;
  place.description = description;

  try {
    await Place.save();
  } catch (error) {
    const err = new HttpError("something went wrong, could not update", 500);
    return next(err);
  }
  // dummy_places[placeIndex] = updatedPlace;

  // res.status(200).json({ place: updatedPlace });
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const { pid } = req.params;
  let place;
  try {
    place = await Place.findById(pid).populate("creator");
  } catch (error) {
    const err = new HttpError("could not delete place, please try again", 500);

    return next(err);
  }

  if (!place) {
    const error = new HttpError("could not find place for this is id", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const err = new HttpError("you are not allowed to delete this place", 500);
    return next(err);
  }
  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("could not delete place, please try again", 500);
    return next(err);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "deleted place" });
};
module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  deletePlaceById,
  updatePlaceById,
};
