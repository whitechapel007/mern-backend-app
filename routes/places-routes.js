const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  deletePlaceById,
  updatePlaceById,
} = require("../controllers/places-controller");

const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
router
  .route("/:pid")
  .get(getPlaceById)
  .patch(checkAuth, updatePlaceById)
  .delete(checkAuth, deletePlaceById);
router.route("/user/:uid").get(getPlacesByUserId);

router
  .route("/")
  .post(
    checkAuth,
    fileUpload.single("image"),
    [
      check("title").not().isEmpty(),
      check("description").isLength({ min: 5 }),
      check("address").not().isEmpty(),
    ],
    createPlace
  );

// router.route()
module.exports = router;
