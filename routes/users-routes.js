const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();
const {
  getAllUsers,
  register,
  login,
} = require("../controllers/user-controller");

router.route("/").get(getAllUsers);
router
  .route("/register")
  .post(
    fileUpload.single("image"),
    [
      check("name").not().isEmpty(),
      check("email").normalizeEmail().isEmail(),
      check("password").isLength({ min: 6 }),
    ],
    register
  );
router.route("/login").post(login);

module.exports = router;
