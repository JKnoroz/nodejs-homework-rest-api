const express = require("express");
const router = express.Router();
const CreateError = require("http-errors");

const { User } = require("../../models/user");
const { authenticate, upload } = require("../../middlewares");
const { schemas } = require("../../models/user");

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).send();
});

router.patch("/updatesubscription", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.update.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { _id } = req.user;
    const { subscription } = req.body;
    await User.findByIdAndUpdate(_id, { subscription });
    res.json({
      user: {
        subscription: req.body.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {}
);

module.exports = router;
